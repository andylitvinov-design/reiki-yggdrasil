# 2026-06-14 — Power Place cover-none fix record

## Summary

PR #359 fixed the Profile Lite / Power Place constructor bug where choosing `Без фона` could still leave a golden circular fill in the mandala preview.

- PR: #359
- Issue: #357
- Merged to: `main`
- Merge commit: `19fdc972745b9d6cb847c3443c105b08287a0967`
- Scope: `/profile/mandalas` Power Place constructor UI and style contracts only.

## Root cause

`no-cover` had no `tone`, while the render classes used a fallback pattern like:

```jsx
cover-${innerCover?.tone || "gold"}
```

That meant `Без фона` / `no-cover` could resolve to `cover-gold`, which reintroduced the unwanted golden circle/fill.

## Changed files in PR #359

- `src/pages/profile-lite/ProfileLitePowerPlaceModuleBase.jsx`
- `src/profileMandalaWorkspace.css`
- `test/profileLiteCabinetContract.test.mjs`
- `test/powerPlaceStyleContract.test.mjs`

## Verified checks

All reported passing:

- `npm run test:power-place`
- `npm run test:profile-lite`
- `npm run test:profile-media`
- `npm run build`
- `npm run check`
- `git diff --check`
- PR CI `validate-and-build`
- Vercel deploy statuses for `2mentalica` and `reiki-yggdrasil`

## Manual QA notes

- Live `/profile/mandalas` rendered in headless Chrome with no console errors and no horizontal overflow.
- Mock-authenticated local `/profile/mandalas` rendered saved `DAO1`.
- `DAO1` selected successfully.
- DAO wrapper class was `daoMandalaSheet cover-none`.
- Computed background before hiding field: `rgba(0, 0, 0, 0)`, image `none`.
- After toggling inline `Размер поля`, panel had `power-place-hide-inner-cover`; background stayed transparent, image `none`.
- Inline toggles found: `3`.
- Old right-side visibility panel found: `0`.
- Outer-cover toggle found beside cover selector: `1`.

## Risks / not verified

- Real production authenticated user data was not touched.
- Google OAuth / real Supabase save flow was not retested.

## Follow-up note

This record is docs-only and does not change app code, Supabase migrations, env values, Vercel config, public homepage, `/masters`, or `/profile/admin`.
