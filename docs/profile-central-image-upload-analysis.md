# Profile central image upload / picker analysis

Date: 2026-06-01  
Project: Reiki Yggdrasil  
Repo: `andylitvinov-design/reiki-yggdrasil`  
Live: `https://mentalica.vercel.app`  
Legacy: `https://reiki-yggdrasil.vercel.app`

## Purpose

This document captures the current situation around image upload and image selection in the master cabinet, especially the central client/goal photo in the Power Place constructor.

It is intended as a handoff document for Claude Code / Codex before making a minimal safe fix.

## Current user-facing symptom

In the authenticated master cabinet `/profile`, image upload and image selection still feel unreliable or inconsistent.

The most visible problem concerns the central image, labelled `Фото клиента / цели`:

1. The user can open the central image picker.
2. The picker looks like a shared/base image picker and can show saved images from different categories.
3. The user may select an ordinary material/mandala/tradition image into the center.
4. The selected image can appear visually in the center.
5. Saving the Power Place composition may still fail with a message that asks for a central client/goal photo.

This creates the impression that upload/selection is broken, even when the visual selection technically happened.

## Important project constraints

Before changing this repo, read repo-local context first:

- `AGENTS.md`
- `README.md`
- `STATE.md`
- `LOG.md`
- `package.json`
- `vercel.json`
- `src/pages/ProfilePage.jsx`
- `src/lib/profileMediaClient.js`
- `src/lib/powerPlaceClient.js`

Do not change:

- Supabase env names
- Supabase secret values
- OAuth/session/bootstrap flow
- Vercel rewrites
- routes `/`, `/profile`, `/profile-lite`, `/profile-old`, `/masters`, `/profile/admin`
- RU-default interface
- desktop three-column layout
- existing storage bucket name `profile-cabinet-media`

## Relevant files

### Main file

- `src/pages/ProfilePage.jsx`

Key state and functions to inspect:

- `clientGoalPhotos`
- `selectedCentralPhotoId`
- `selectedCentralImageRef`
- `imagePickerContext`
- `activePickerCategory`
- `mediaUploadTarget`
- `centerImage`
- `buildSourceLibraryItems`
- `handlePickerDirectFileUpload`
- `handleClientPhotoSave`
- `openClientPhotoPicker`
- `openClientPhotoUpload`
- `chooseCenterPickerImage`
- `chooseCentralPhoto`
- `buildPowerPlacePayload`
- `handleCompositionSave`
- `handleDownloadMandala`

### Storage / media

- `src/lib/profileMediaClient.js`

Important facts:

- `PROFILE_MEDIA_BUCKET = "profile-cabinet-media"`
- allowed types: JPG, PNG, WEBP, GIF
- max size: 5 MB
- supported upload kinds:
  - `client-goal`
  - `tradition`
  - `power-place`
  - `material`
  - `underlay`

### Power Place persistence

- `src/lib/powerPlaceClient.js`

Important facts:

- `normalizePowerPlaceComposition()` normalizes `central_photo_id` to `null` when empty.
- `object_refs` persist non-data image refs and filter out `data:image/...`.
- This means a central image stored as `object_refs.__center_image` is already technically persistable if the UI allows save.

## History / why this is inconsistent

### PR #66 — profile mandala cabinet UX

PR #66 added/refined material image upload through the existing private Supabase Storage flow.

It introduced or confirmed that material images can be uploaded to `profile-cabinet-media` and saved as `storage://...` refs in material records.

Important limitation from that work:

- live authenticated upload/reload against Supabase Storage was not fully verified at the time.
- the migration/storage policies must exist in the live Supabase project.

### PR #69 — Power Place image picker and download UX

PR #69 introduced a shared popup-style picker for center and object slots.

However, the PR also explicitly preserved the old business rule:

- center was still intended to be restricted to saved `Фото клиента / цели` records.

The current code now appears to be between two models:

1. Old model: center must be a `client-goal` row with `selectedCentralPhotoId`.
2. New model: center can also be an arbitrary selected image ref through `selectedCentralImageRef`.

The UI has partially moved to the new model, but save/export logic still contains old assumptions.

## Confirmed code-level problem

### Problem 1 — Save gate still requires `selectedCentralPhotoId`

In `ProfilePage.jsx`, `handleCompositionSave` currently blocks saving when `selectedCentralPhotoId` is empty:

```js
if (!selectedCentralPhotoId) {
  setError("Выберите центральное фото из раздела «Фото клиентов / целей».");
  return;
}
```

But `chooseCenterPickerImage()` supports selecting a non-client-photo option into the center:

```js
setSelectedCentralPhotoId("");
setSelectedCentralImageRef(option.src);
setMessage("Изображение выбрано в центр мандалы.");
closeImagePicker();
```

Result:

- visual center can be selected via `selectedCentralImageRef`;
- save still fails because `selectedCentralPhotoId` is empty.

This is the primary root cause.

### Problem 2 — payload already supports `__center_image`

`buildPowerPlacePayload()` already stores the central image ref inside object refs:

```js
object_refs: persistableObjectRefs(
  { ...objectImages, __center_image: selectedCentralImageRef },
  [...activeObjectSlots.map((slot) => slot.id), "__center_image"]
),
central_photo_id: selectedCentralPhotoId,
```

Therefore the persistence path is already mostly prepared.

The save gate is the main blocker.

### Problem 3 — HTML download/export still reads only `selectedCentralPhoto`

`handleDownloadMandala()` currently builds the center export from `selectedCentralPhoto` only:

```js
const centerRef = selectedCentralPhoto?.image_ref || selectedCentralPhoto?.image_url || "";
const centerDisplay = selectedCentralPhoto?.display_url || selectedCentralPhoto?.image_url || "";
```

If center was selected through `selectedCentralImageRef`, the downloaded HTML may omit the selected center.

### Problem 4 — confusing left button action

In the left sidebar, the visible button says:

```text
Добавить мандалу
```

But its click handler is:

```js
onClick={openClientPhotoUpload}
```

`openClientPhotoUpload()` sets picker context to center/client-goals flow:

```js
handlePickerCategorySelect("client-goals");
setActivePickerSubcategory("client-goals");
setActivePickerThirdLevel("");
setIsClientPhotoUploadOpen(true);
setImagePickerContext({ mode: "center", slotId: "" });
```

This means the button label and behavior disagree:

- label says: add mandala;
- behavior opens: central client/goal image flow.

This is a UX root cause of confusion.

### Problem 5 — copy still describes the old model

Some UI copy still says or implies that the center uses only `Фото клиентов / целей`.

For the new intended model, this must be softened to:

- choose or upload a central image;
- it can be client/goal photo, mandala, material, or tradition image depending on picker category.

## Main hypothesis

The cabinet image issue is not mainly a Supabase Storage upload bug.

The strongest hypothesis is a state/model mismatch:

- picker UI now allows a central image ref through `selectedCentralImageRef`;
- save/export/UX copy still assume the center must be a saved client-goal row with `selectedCentralPhotoId`.

Secondary risk remains:

- live Storage upload can still fail if the migration/policies/env are missing or stale, but the code-level mismatch can reproduce even when storage works.

## Recommended minimal safe fix

### 1. Derive a unified central image flag

In `ProfilePage.jsx`, near `centerImage`, add:

```js
const hasCentralImage = Boolean(selectedCentralPhotoId || selectedCentralImageRef || centerImage);
```

### 2. Replace the save gate

Replace:

```js
if (!selectedCentralPhotoId) {
  setError("Выберите центральное фото из раздела «Фото клиентов / целей».");
  return;
}
```

With:

```js
if (!hasCentralImage) {
  setError("Выберите или загрузите центральное изображение.");
  return;
}
```

This allows save when:

- a saved client-goal row is selected; or
- an arbitrary saved/uploaded image ref is selected through `selectedCentralImageRef`.

### 3. Keep payload shape backward-compatible

Do not remove `central_photo_id`.

Keep:

```js
central_photo_id: selectedCentralPhotoId,
```

Also keep:

```js
__center_image: selectedCentralImageRef
```

Expected behavior:

- old compositions with `central_photo_id` continue to work;
- new compositions can persist a center through `object_refs.__center_image` if no `central_photo_id` exists.

### 4. Fix HTML export center source

Update `handleDownloadMandala()` so it uses both models:

```js
const centerRef = selectedCentralImageRef || selectedCentralPhoto?.image_ref || selectedCentralPhoto?.image_url || "";
const centerDisplay = previewImageUrl(
  selectedCentralImageRef,
  selectedCentralPhoto?.display_url,
  selectedCentralPhoto?.signed_url,
  selectedCentralPhoto?.image_url,
  selectedCentralPhoto?.image_ref
);
```

### 5. Fix the misleading left sidebar button

Current:

```jsx
<button className="powerAddImageButton" type="button" onClick={openClientPhotoUpload}>
  Добавить мандалу
</button>
```

Recommended minimal behavior:

```jsx
<button className="powerAddImageButton" type="button" onClick={() => setActiveTopTab("mandalas")}>
  Добавить мандалу
</button>
```

Optional secondary button:

```text
Добавить фото цели
```

This secondary button can call `openClientPhotoPicker` or `openClientPhotoUpload` if needed.

### 6. Update center picker copy

For `imagePickerContext.mode === "center"`, change modal title from:

```text
Выбрать фото клиента / цели
```

To:

```text
Выбрать центральное изображение
```

Suggested hint:

```text
Можно выбрать фото клиента / цели, мандалу, образ традиции или загрузить новое изображение.
```

### 7. Do not delete client-goal flow yet

Keep `clientGoalPhotos` and `handleClientPhotoSave()`.

Reason:

- client/goal photos have their own table and plan limits;
- old saved compositions may depend on `central_photo_id`;
- deleting this flow would be too risky.

The goal is not to remove client-goal support, but to stop requiring it as the only valid central image source.

## Tests to add/update

### `test/powerPlaceClient.test.mjs`

Add coverage that `normalizePowerPlaceComposition()` preserves `object_refs.__center_image` and accepts empty `central_photo_id` as `null`:

```js
assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Центр из мандалы ",
    constructor_type: "client",
    geometry: 4,
    object_refs: {
      "__center_image": "storage://profile-cabinet-media/profile-1/materials/uuid-center.webp",
      "source-1": "https://example.com/source.jpg"
    },
    central_photo_id: ""
  }),
  {
    profile_id: "profile-1",
    title: "Центр из мандалы",
    constructor_type: "client",
    geometry: 4,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    cover_ref: null,
    object_refs: {
      "__center_image": "storage://profile-cabinet-media/profile-1/materials/uuid-center.webp",
      "source-1": "https://example.com/source.jpg"
    },
    central_photo_id: null,
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);
```

### Optional source-level test

If there is a source-contract test for `ProfilePage.jsx`, add checks that:

- `handleCompositionSave` does not use `if (!selectedCentralPhotoId)` as the only center gate;
- `hasCentralImage` or equivalent includes `selectedCentralImageRef`;
- `handleDownloadMandala` includes `selectedCentralImageRef`.

## Commands to run

```bash
npm run test:power-place
npm run test:profile-media
npm run test:profile-materials
node test/profilePageAuthBootstrap.test.mjs
npm run check
npm run build
```

## QA scenarios

Authenticated `/profile` QA:

1. Open `/profile`.
2. Open `Место силы`.
3. Click central image.
4. Select a saved `Фото клиента / цели`.
5. Save composition.
6. Click central image again.
7. Select a regular material/mandala/tradition image.
8. Confirm the center visually updates.
9. Save composition without `selectedCentralPhotoId`.
10. Reload saved composition and confirm center restores from `object_refs.__center_image`.
11. Use `Скачать` and confirm exported HTML includes the center image.
12. Click left `Добавить мандалу` and confirm it opens/switches to the mandala upload workspace, not the client-goal center upload flow.
13. Check desktop and mobile.
14. Check console errors.

## Risks

- If live Supabase Storage policies/migration are missing, upload can still fail independently of this UI fix.
- Existing compositions with `central_photo_id` must continue to work.
- The `Фото клиентов / целей` table and plan limit should remain intact.
- Do not accidentally save `data:image/...` refs.
- Do not break `resourceComparisonMode === "client_photo"` visual mode.
- Do not change OAuth/session/bootstrap paths while fixing this.

## Expected final report from Claude Code / Codex

Report:

- branch
- PR URL
- changed files
- root cause
- exact fix
- checks run
- authenticated QA status
- what was not verified
- risks
- whether `STATE.md` / `LOG.md` were updated
