# Profile Lite — upload library and slot flow plan

Date: 2026-06-02
Project: Reiki Yggdrasil
Area: `/profile/mandalas`

## Problem

The current image workflow mixes two intents:

1. Upload a new image into the user's library.
2. Apply an image to the current mandala composition.

The left action should add an image to the library only. It must not change the active mandala. Uploading from a selected slot may still add the image to the library and apply it to that selected target.

## Product rule

- Global upload = add to library only.
- Slot upload = add to library and apply to selected target.

This rule must be explicit in code and tests. Do not infer intent from missing slot state.

## Flow A — left-rail upload

The left-rail top action should become a library upload action. Preferred label: `Добавить фото`.

Behavior:

- opens upload mode for the library;
- default destination tab is `Клиенты`;
- optional second destination tab is `Материалы`;
- uploads to Supabase Storage through the existing safe media client;
- creates the corresponding library record;
- updates the left photo list;
- keeps the current composition unchanged.

Must not happen:

- no `central_photo_id` update;
- no `object_refs.__center_image` write;
- no object slot ref write;
- no cover update;
- no automatic insertion into the mandala.

## Flow B — upload from a selected mandala target

If the user starts upload from a selected target, the uploaded image may be applied immediately:

- center upload applies to center;
- object upload applies to selected object slot;
- cover upload applies to active cover layer;
- left global upload does not apply anywhere.

## Upload destination tabs

The upload UI should have two tabs:

### Клиенты

Default tab. Fields:

- title or default filename;
- file;
- notes or meta.

Saves as a client-goal photo and updates `clientGoalPhotos`.

### Материалы

Fields:

- group;
- category;
- subcategory or step;
- title;
- file;
- notes or description.

Use existing material/publication client only if it safely supports image material creation. Do not add migrations in this task. If material persistence is not ready, implement a clear safe MVP / `needs verification` state.

## Picker tabs for composition selection

When a picker is opened for a composition target, it should offer:

- `Новые` — default latest images;
- `Клиенты`;
- `Материалы`;
- `Загрузить фото`.

`Загрузить фото` should use the same client/material upload form. In target context, successful upload should apply to the active target.

## Implementation notes

Suggested explicit modes:

- `library` or `upload-library`;
- `center`;
- `object`;
- `cover`.

Add a library upload handler that shares the Storage and DB creation logic but does not mutate `compositionDraft`.

Keep existing Storage behavior intact:

- `normalizeSignedStorageUrl`;
- `createSignedMediaUrl`;
- `uploadProfileMedia`;
- durable `storage://` refs;
- temporary signed display URLs.

## Files likely involved

- `src/pages/profile-lite/ProfileLitePowerPlaceModule.jsx`
- `src/pages/ProfileLitePage.jsx`
- `src/pages/profile-lite/ProfileLiteImagePicker.jsx`
- `src/profileMandalaWorkspace.css`
- `test/profileLiteCabinetContract.test.mjs`
- `test/profileMediaClient.test.mjs`
- material tests if material flow is touched

## Tests

Cover these cases:

- left library upload does not set `central_photo_id`;
- left library upload does not write `object_refs.__center_image`;
- left library upload adds the photo to the left library/list;
- center upload still applies to center;
- object upload still applies to selected object slot;
- cover upload still applies to active cover layer;
- client tab is default;
- materials tab renders filters or safe MVP state;
- existing Storage display remains working.

## QA checklist

Run:

- `npm run test:profile-lite`
- `npm run test:profile-media`
- `npm run test:power-place`
- `npm run test:profile-loading-recovery`
- `npm run check`
- `npm run build`
- `git diff --check`

Manual QA:

- `/profile/mandalas` desktop 1280;
- `/profile/mandalas` mobile 390;
- left upload adds photo to list only;
- mandala center does not change after left upload;
- target upload applies to the selected target;
- Storage photos and old external images still render;
- delete cross still works;
- no horizontal overflow.

## Do not break

- `/profile-old`
- `/profile`
- `/masters`
- `/profile/admin`
- auth/bootstrap
- Vercel rewrites
- compact left filter
- report module
- chess variants
- inner/outer cover layers
- Storage signed URL display

## Definition of done

The task is complete when the global upload action stores the photo in the library without changing the composition, while target-context upload still uploads and applies the image to the selected target. The new photo must appear in the left list after upload and existing image display must remain stable.
