# Reiki Yggdrasil — UI Contract

Status: v1.
Scope: public site and profile/admin routes.

## Global UI rules

- RU is the default interface language.
- The public home page must be preserved unless the task explicitly targets it.
- Desktop public learning UI keeps the accepted three-column pattern: left navigation, center learning stage/workspace, right contextual/practice panel.
- Mobile fallback below `980px` must remain usable and must not introduce horizontal overflow.
- Fixes should be minimal and route/component scoped.
- Do not replace project structure or redesign the whole app for a local UI bug.

## Route `/`

Expected:
- Public learning/home UI opens without auth.
- DAO/Reiki course navigation remains available.
- Right rail can show contextual materials when implemented, but must not expose private storage refs.
- Public copy remains Russian-first.

Do not change without explicit task:
- Main home structure.
- Global public navigation labels except requested copy fixes.
- Public route availability.

Debug checks:
- Desktop 1366: left/center/right layout remains readable.
- Mobile 390: no horizontal overflow.
- Browser console: no broken imports or runtime crash.

## Route `/profile`

Expected:
- Unauthenticated users see a safe login/auth path.
- Authenticated users see profile cabinet workspace.
- Profile top-level areas can include `Место силы`, `Мои мандалы`, `Чаты`, `Профиль` depending on current implementation state.
- Power Place / Mandala workspace preserves accepted desktop structure and mobile ordering.
- `Источники силы` / source panel behavior must remain consistent with current taxonomy.
- Save/update/download/print controls must remain reachable.
- Private media uses storage refs internally and signed URLs for display when needed.

Do not change without explicit task:
- Supabase auth/data flow.
- Accepted desktop three-column structure.
- RU-first labels.
- Existing save/update/print/download persistence semantics.
- Storage private/public boundary.

Debug checks:
- Desktop widths: 1280, 1366, 1440, 1710.
- Mobile width: 390.
- No horizontal overflow.
- Active tab defaults and reset paths match current STATE/LOG.
- Media picker, upload, save, reload, print/download are tested or marked `needs verification`.

## Route `/masters`

Expected:
- Public masters catalog opens without breaking public site shell.
- Only public-safe master fields and approved/public content are shown.
- No private storage refs or private user data are rendered.

Do not change without explicit task:
- Public route availability.
- Safe field boundary.
- Masters card data contract.

Debug checks:
- Route opens on direct URL and refresh.
- Empty states are readable.
- Public thumbnails do not expose `storage://profile-cabinet-media/...` text.

## Route `/profile/admin`

Expected:
- Admin route preserves auth/admin boundary.
- Non-admin or unauthenticated state must not expose moderation data.
- Admin moderation, if configured, uses safe authenticated/admin flows.

Do not change without explicit task:
- Admin access logic.
- `VITE_ADMIN_EMAIL` handling by name only.
- Supabase RLS/admin table expectations.

Debug checks:
- Unauthenticated state is safe.
- Authenticated non-admin state is safe.
- Admin state requires live verification when actual credentials/session are needed.

## Layout regression matrix

For UI tasks, report these states:

| Route | Desktop 1366 | Mobile 390 | Auth needed | Notes |
| --- | --- | --- | --- | --- |
| `/` | required | required | no | public home preserved |
| `/profile` | required | required | yes for workspace | unauth fallback acceptable |
| `/masters` | required | required | no | safe public catalog |
| `/profile/admin` | required | required | yes for admin | non-admin fallback safe |

## Completion standard

A UI task is complete only when:

- affected route(s) verified locally or in preview;
- desktop/mobile checks run when layout changed;
- live verification is done after merge/deploy, or explicitly marked `needs verification`;
- changed files and risks are reported;
- no secrets/private refs are exposed.
