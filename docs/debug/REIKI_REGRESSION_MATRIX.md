# Reiki Yggdrasil — Regression Matrix

Status: v1.
Purpose: protect core Reiki Yggdrasil flows from regressions after UI, Auth, Supabase, Storage, or service-order fixes.

## 1. Core route regression matrix

| Route | Public | Auth needed | Desktop 1366 | Mobile 390 | Must preserve |
| --- | --- | --- | --- | --- | --- |
| `/` | yes | no | required | required | public home, RU default, course navigation, right rail safety |
| `/profile` | partial | yes for workspace | required | required | login fallback, profile workspace, Power Place/Mandala flows |
| `/masters` | yes | no | required | required | public-safe catalog fields |
| `/profile/admin` | no public data | yes/admin | required | required | safe unauth/non-admin fallback, admin boundary |

## 2. Global invariants

Every regression pass must confirm or mark `needs verification`:

- RU-default interface remains.
- Public home page remains available.
- Core routes remain available.
- Desktop three-column structure remains where applicable.
- Mobile fallback below `980px` remains usable.
- No env values or secrets are exposed.
- No private `storage://profile-cabinet-media/...` refs are visible on public pages.
- Supabase/Auth/Storage flows are not claimed verified without a real live session.

## 3. UI regression checks

### Desktop

Check at minimum 1366px. For layout-sensitive changes also check 1280, 1440, 1710.

| Area | Expected | Status |
| --- | --- | --- |
| Public shell | left/center/right layout remains readable | pass/fail/needs verification |
| Profile workspace | accepted panel structure preserved | pass/fail/needs verification |
| Right rail | does not overlap or disappear unexpectedly | pass/fail/needs verification |
| Action buttons | save/download/print/CTA reachable | pass/fail/needs verification |
| Cards/forms | no clipping or unreadable text | pass/fail/needs verification |

### Mobile

Check 390px.

| Area | Expected | Status |
| --- | --- | --- |
| Horizontal overflow | none | pass/fail/needs verification |
| Block order | usable, source/workspace order intentional | pass/fail/needs verification |
| Popups | fit viewport | pass/fail/needs verification |
| CTA/buttons | reachable | pass/fail/needs verification |
| Text | readable, no critical truncation | pass/fail/needs verification |

## 4. Auth/data regression checks

| Flow | Expected | Status |
| --- | --- | --- |
| Unauth `/profile` | safe login/fallback | pass/fail/needs verification |
| Google login | starts and returns correctly | pass/fail/needs verification |
| Expired session | cleared or handled safely | pass/fail/needs verification |
| Admin route | safe for unauth/non-admin | pass/fail/needs verification |
| Admin access | only verified admin sees moderation | pass/fail/needs verification |
| Public reads | only public-safe fields | pass/fail/needs verification |
| Private writes | require authenticated owner/admin path | pass/fail/needs verification |

## 5. Storage/media regression checks

| Flow | Expected | Status |
| --- | --- | --- |
| Upload preview | image appears before save when expected | pass/fail/needs verification |
| Durable save | saves durable ref, not accidental temporary preview | pass/fail/needs verification |
| Reload | resolves saved private refs via signed URL where needed | pass/fail/needs verification |
| Public card | uses safe placeholder or public URL, no raw private ref | pass/fail/needs verification |
| Print/download | safe fallback; no overclaiming image/PDF support | pass/fail/needs verification |

## 6. Service order regression checks

Only required when the task touches services/orders/auth intent.

| Flow | Expected | Status |
| --- | --- | --- |
| Service profile | opens from service feed | pass/fail/needs verification |
| Format select | `signature`, `no_signature`, `both` selectable | pass/fail/needs verification |
| Authenticated CTA | opens order creation | pass/fail/needs verification |
| Unauthenticated CTA | starts Google auth | pass/fail/needs verification |
| Intent persistence | `service_id` and `format` survive OAuth | pass/fail/needs verification |
| Order form | service/format prefilled | pass/fail/needs verification |
| Submit | creates expected request/order state | pass/fail/needs verification |

## 7. Knowledge/content regression checks

| Flow | Expected | Status |
| --- | --- | --- |
| Knowledge base validator | passes or known warnings documented | pass/fail/needs verification |
| Reiki IDs | stable `RY-Lxx-Sxx` IDs preserved | pass/fail/needs verification |
| Unknown content | marked `needs_content` or `needs verification` | pass/fail/needs verification |
| Video/free course links | validators run when related fields changed | pass/fail/needs verification |

## 8. Test command matrix

| Change type | Required commands |
| --- | --- |
| Debug docs only | `npm run verify:debug-contract` if snapshot/verifier touched; otherwise docs review |
| Snapshot/verifier/package | `npm run verify:debug-contract`, `npm run check`, `npm run build` |
| UI/layout | `npm run check`, `npm run build`, browser desktop/mobile QA |
| Supabase client | targeted client tests, `npm run check`, live session QA if possible |
| Storage/media | `npm run test:profile-media`, `npm run check`, authenticated upload/reload QA |
| Services/orders | `npm run test:profile-services`, `npm run check`, auth intent QA |
| Knowledge/content | relevant validators, `npm run check` |

## 9. Regression report template

```text
Change summary:
Commit/PR:
Vercel status:
Commands run:
Core routes:
Desktop/mobile:
Auth/data:
Storage/media:
Service orders:
Knowledge/content:
Public safety:
Regressions found:
Needs verification:
Next action:
```

## 10. Stop rule

If a regression is found in public route access, private data exposure, auth redirect, or Vercel deployment, stop further feature work and run the Codex repair loop.
