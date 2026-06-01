# PR #182 — Central image picker/save fix result

Date: 2026-06-01
Project: Reiki Yggdrasil
Branch: `codex/fix-central-image-save-and-picker-ux`
PR: #182
Related analysis: `docs/profile-central-image-upload-analysis.md`

## Summary

PR #182 fixes the Power Place central image mismatch in the authenticated master cabinet.

The UI already allowed the center image to be selected through the shared picker and stored as `selectedCentralImageRef`, but the save gate still required the older `selectedCentralPhotoId` client-goal row. So an image could appear visually in the center but still fail on save.

## Root cause

Two central image models existed at the same time:

1. Old model: center must be a saved client-goal photo row and save requires `selectedCentralPhotoId`.
2. New model: center can be a persisted image ref and save can store it through `object_refs.__center_image`.

The UI had moved toward the new model, while save/export logic still partly used the old model.

## Fixes included

- Power Place save now accepts `selectedCentralPhotoId`, `selectedCentralImageRef`, or `centerImage`.
- The old `central_photo_id` path is preserved for backward compatibility.
- Universal central image refs continue to persist through `object_refs.__center_image`.
- HTML export now uses `selectedCentralImageRef` as the primary central image source.
- The left button `Добавить мандалу` now switches to the mandala workspace instead of opening the client-goal center upload flow.
- The center picker title is now `Выбрать центральное изображение`.
- Empty-state copy is category-agnostic for center mode.
- `test/powerPlaceClient.test.mjs` covers empty `central_photo_id` becoming `null` while `object_refs.__center_image` is preserved.

## Checks reported as passed

- `npm run test:power-place`
- `npm run test:profile-media`
- `npm run test:profile-materials`
- `node test/profilePageAuthBootstrap.test.mjs`
- `npm run check`
- `npm run build`

## Still needs live QA after merge/deploy

- Open `https://mentalica.vercel.app/profile` with an authenticated session.
- Select a saved client-goal photo in the center and save.
- Select a regular mandala/material/tradition image in the center and save.
- Reload the saved composition and confirm the center restores from `object_refs.__center_image`.
- Use `Скачать` and confirm the exported HTML includes the central image.
- Confirm `Добавить мандалу` opens the mandala workspace.
- Check desktop, mobile, and browser console.

## Risks

- Live upload may still fail if Supabase Storage bucket/policies/migrations are missing in production.
- Old compositions without `central_photo_id` and without `object_refs.__center_image` will still have no center image.
- The old client-goal flow and plan limits remain intentionally preserved.
