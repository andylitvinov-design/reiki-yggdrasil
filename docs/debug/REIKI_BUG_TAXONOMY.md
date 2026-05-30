# Reiki Yggdrasil — Bug Taxonomy

Status: v1.

Use this taxonomy before writing any Codex prompt. Pick one primary class and, if needed, secondary classes.

## DEPLOY_MISMATCH

Symptoms:
- Codex says done, but live has no change.
- Preview differs from production.
- PR is open but not merged.
- Production domain points to another commit/project.

Likely checks:
- PR state, branch, latest commit, Vercel deployment, live URL, target URL.
- Compare `https://reiki-yggdrasil.vercel.app` and `https://mentalica.vercel.app` when domain migration is relevant.

Likely files:
- `vercel.json`
- `.github/workflows/*`
- `README.md`
- `STATE.md`
- deployment metadata/debug status files if present

Minimal safe fix pattern:
- Do not change UI first. Verify merge/deploy/alias/commit alignment.

Risks:
- Mistaking preview success for live success.
- Debugging old production code instead of current branch code.

## ROUTING

Symptoms:
- `/profile`, `/masters`, or `/profile/admin` returns 404.
- Refreshing a nested route breaks.
- Vercel preview works locally but not live.

Likely files:
- `vercel.json`
- `src/main.jsx`
- route switch/router helpers

First checks:
- Confirm Vercel rewrites preserve SPA fallback.
- Confirm route string names are unchanged.

Risks:
- Breaking the public home page while fixing a cabinet route.

## AUTH

Symptoms:
- Google login does not start.
- User returns to the wrong route after OAuth.
- Expired session blocks login UI.
- Admin route denies the expected admin.

Likely files:
- `src/lib/supabaseClient.js`
- `src/pages/ProfilePage.jsx`
- `src/pages/AdminPage.jsx`
- Supabase auth setup docs/migrations

First checks:
- Env presence by name only: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`.
- Supabase redirect URLs for target and legacy domains.
- `window.location.origin` redirect behavior.

Risks:
- Hardcoding one domain and breaking preview/legacy auth.
- Exposing real env values or admin email.

## SUPABASE_RLS

Symptoms:
- UI loads but reads/writes fail.
- Upload/save works for one user but not another.
- Admin moderation does not see expected rows.

Likely files:
- `src/lib/*Client.js`
- `supabase/migrations/*`
- `src/pages/ProfilePage.jsx`
- `src/pages/AdminPage.jsx`

First checks:
- Which table/bucket/action fails.
- anon vs authenticated vs admin path.
- Whether migration is applied live.

Risks:
- Masking an RLS problem as a UI issue.
- Making policies too permissive.

## STORAGE_MEDIA

Symptoms:
- Images disappear after reload.
- Saved mandala shows placeholder instead of photo.
- Private `storage://` refs appear in public HTML.
- Signed URLs expire or fail.

Likely files:
- `src/lib/profileMediaClient.js`
- `src/lib/profileMaterialsClient.js`
- `src/pages/ProfilePage.jsx`
- `src/profileMandalaWorkspace.css`
- `supabase/migrations/*media*storage*.sql`

First checks:
- Distinguish `storage://`, signed URL, external URL, and `data:image` preview.
- Confirm saved payload does not persist temporary previews.
- Confirm display path resolves signed URLs only in authenticated context.

Risks:
- Leaking private storage refs.
- Persisting `data:image` previews.

## UI_LAYOUT_DESKTOP

Symptoms:
- Accepted three-column layout collapses on desktop.
- Right rail moves below center unexpectedly.
- Source/menu blocks overflow.

Likely files:
- `src/main.jsx`
- `src/index.css`
- `src/pages/ProfilePage.jsx`
- `src/profileCabinet.css`
- `src/profileMandalaWorkspace.css`

First checks:
- Desktop widths: 1280, 1366, 1440, 1710.
- Preserve left / center / right structure.

Risks:
- Fixing one widget by breaking global layout.

## UI_LAYOUT_MOBILE

Symptoms:
- Horizontal overflow at 390px.
- Wrong block order under `980px`.
- Buttons or popup controls become unreachable.

Likely files:
- CSS files above
- component render order in `ProfilePage.jsx`

First checks:
- Mobile width 390.
- Component order and overflow constraints.

Risks:
- Mobile fix overriding desktop layout.

## STATE_MANAGEMENT

Symptoms:
- Selected service/format is lost after auth.
- Active tab resets incorrectly.
- Picker opens with the wrong category.
- Save/update edits the wrong composition.

Likely files:
- `src/pages/ProfilePage.jsx`
- `src/lib/profileServicesClient.js`
- localStorage/session helpers

First checks:
- State owner, persistence boundary, reset path, auth callback path.

Risks:
- Clearing useful state on sign-in/sign-out.

## DATA_CONTRACT

Symptoms:
- UI fields do not match Supabase columns.
- Order status or publication status is inconsistent.
- Safe public fields and private fields are mixed.

Likely files:
- `src/lib/*Client.js`
- `supabase/migrations/*`
- docs/contracts

First checks:
- Table name, column name, allowed statuses, public/private boundary.

Risks:
- Adapting frontend to an assumed schema that is not applied live.

## COURSE_CONTENT

Symptoms:
- Missing Reiki step text.
- Wrong level/step title.
- Menu and knowledge base disagree.
- Validation warnings.

Likely files:
- `src/data/reikiKnowledgeBase.js`
- `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
- `scripts/validate-knowledge-base.mjs`

First checks:
- Stable IDs `RY-L01-S01` style.
- `needs_content` / `needs_review` flags.

Risks:
- Inventing sacred/course details instead of marking `needs verification`.

## ADMIN_MODERATION

Symptoms:
- Admin route opens for non-admin or blocks admin.
- Moderation list is empty unexpectedly.
- Approved public content does not appear.

Likely files:
- `src/pages/AdminPage.jsx`
- `src/lib/profileMaterialsClient.js`
- Supabase migrations/admin table policies

First checks:
- Admin email env presence by name only.
- Admin table membership.
- Publication status filters.

Risks:
- Exposing private rows to public users.

## SERVICE_ORDER_FLOW

Symptoms:
- Service format selection is lost.
- Google auth returns user to profile but not order creation.
- `service_id` and `format` are not prefilled.
- Upload/reference fields fail on submit.

Likely files:
- `src/lib/profileServicesClient.js`
- `src/pages/ProfilePage.jsx`
- service/order migrations

First checks:
- Selected service and format persistence before OAuth.
- Order draft vs submitted state.
- Auth callback route.

Risks:
- Creating duplicate orders.
- Losing unauthenticated intent during OAuth.

## PRINT_DOWNLOAD_EXPORT

Symptoms:
- Printed/downloaded mandala misses images or metadata.
- Export includes private refs or temporary previews.
- HTML fallback differs from visible UI.

Likely files:
- `src/pages/ProfilePage.jsx`
- Power Place export/download helpers
- media resolver helpers

First checks:
- Visible state vs persisted refs.
- Which image source is used for export.
- Public/private boundary.

Risks:
- Leaking signed/private URLs.
- Claiming full PNG/JPEG export when only HTML fallback exists.
