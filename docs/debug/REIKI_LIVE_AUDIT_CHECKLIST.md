# Reiki Yggdrasil — Live Audit Checklist

Status: v1.
Purpose: standardize live/preview/production verification after every Reiki Yggdrasil change.

## 1. Audit metadata

Record before testing:

```text
Date:
Auditor:
Commit SHA:
Branch:
PR:
Vercel status:
Preview URL:
Legacy live URL: https://reiki-yggdrasil.vercel.app
Target live URL: https://mentalica.vercel.app
Browser/device:
Auth state:
```

## 2. Deployment checks

| Check | Status | Notes |
| --- | --- | --- |
| Commit exists on GitHub | pass/fail/needs verification | |
| Commit is on `main` or merged PR | pass/fail/needs verification | |
| Vercel status is `success` | pass/fail/needs verification | |
| Preview URL opens | pass/fail/needs verification | |
| Legacy live domain opens | pass/fail/needs verification | |
| Target domain opens, if active | pass/fail/needs verification | |
| User is checking the same URL | pass/fail/needs verification | |

If any deployment check fails, classify as `DEPLOY_MISMATCH` and stop UI debugging.

## 3. Route checks

Check legacy live first unless the task specifically targets the new domain.

| Route | Expected | Status | Notes |
| --- | --- | --- | --- |
| `/` | public home opens | pass/fail/needs verification | |
| `/profile` | safe login or authenticated workspace | pass/fail/needs verification | |
| `/masters` | public masters/catalog route opens | pass/fail/needs verification | |
| `/profile/admin` | safe unauth/non-admin fallback or admin UI | pass/fail/needs verification | |

For each route, record:

```text
HTTP/browser status:
Console errors:
Visible error text:
Route refresh works:
```

## 4. Layout checks

### Desktop

Check at minimum:

- 1366px width

For layout-sensitive work, also check:

- 1280px
- 1440px
- 1710px

Record:

| Route | 1366 | 1280 | 1440 | 1710 | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` | pass/fail/n/a | | | | |
| `/profile` | pass/fail/n/a | | | | |
| `/masters` | pass/fail/n/a | | | | |
| `/profile/admin` | pass/fail/n/a | | | | |

Expected desktop rule:

- preserve accepted three-column structure where applicable;
- no horizontal overflow;
- right rail/context panel remains readable;
- buttons remain reachable.

### Mobile

Check:

- 390px width

Expected mobile rule:

- no horizontal overflow;
- source/workspace order is usable;
- popups fit viewport;
- save/download/print controls remain reachable;
- text and CTA are readable.

## 5. Auth checks

Only mark pass when tested with a real configured auth session.

| Flow | Status | Notes |
| --- | --- | --- |
| `/profile` unauthenticated fallback safe | pass/fail/needs verification | |
| Google login starts | pass/fail/needs verification | |
| Google login returns to expected route | pass/fail/needs verification | |
| Expired session does not block login UI | pass/fail/needs verification | |
| `/profile/admin` non-admin safe | pass/fail/needs verification | |
| `/profile/admin` admin access verified | pass/fail/needs verification | |

Never record real emails, tokens, or env values.

## 6. Supabase/data checks

Only mark pass with a real live session/data fixture.

| Flow | Status | Notes |
| --- | --- | --- |
| Profile loads existing data | pass/fail/needs verification | |
| Material save works | pass/fail/needs verification | |
| Material list reloads | pass/fail/needs verification | |
| Power Place composition save works | pass/fail/needs verification | |
| Power Place reload restores state | pass/fail/needs verification | |
| Admin moderation reads expected rows | pass/fail/needs verification | |
| Public approved materials show safely | pass/fail/needs verification | |

## 7. Media/storage checks

| Flow | Status | Notes |
| --- | --- | --- |
| Client/goal photo uploads | pass/fail/needs verification | |
| Uploaded image appears immediately | pass/fail/needs verification | |
| Uploaded image appears after reload | pass/fail/needs verification | |
| Private signed URLs display in profile only | pass/fail/needs verification | |
| Public pages do not expose `storage://` refs | pass/fail/needs verification | |
| `data:image` previews are not persisted | pass/fail/needs verification | |
| Print/download handles images safely | pass/fail/needs verification | |

## 8. Service order checks

For service/order tasks only:

| Flow | Status | Notes |
| --- | --- | --- |
| Service profile opens | pass/fail/needs verification | |
| Format selection works: `signature` | pass/fail/needs verification | |
| Format selection works: `no_signature` | pass/fail/needs verification | |
| Format selection works: `both` | pass/fail/needs verification | |
| Authenticated CTA opens order creation | pass/fail/needs verification | |
| Unauthenticated CTA starts Google auth | pass/fail/needs verification | |
| `service_id` survives OAuth | pass/fail/needs verification | |
| `format` survives OAuth | pass/fail/needs verification | |
| Order form prefilled correctly | pass/fail/needs verification | |
| Submit creates expected order status | pass/fail/needs verification | |

## 9. Public safety checks

| Check | Status | Notes |
| --- | --- | --- |
| No env values visible in page source/UI | pass/fail/needs verification | |
| No tokens/service keys in repo diff | pass/fail/needs verification | |
| No raw private Storage refs in public UI | pass/fail/needs verification | |
| No private user data in public cards | pass/fail/needs verification | |
| Approved-only public material behavior | pass/fail/needs verification | |

## 10. Final live audit report

```text
Commit:
Vercel status:
Environment checked:
Routes checked:
Desktop checked:
Mobile checked:
Auth checked:
Supabase/data checked:
Media/storage checked:
Service order checked:
Public safety checked:
Passed:
Failed:
Needs verification:
Next action:
```

## 11. Stop conditions

Stop and do not claim completion if:

- Vercel status is not `success`;
- route refresh returns 404;
- console has a blocking runtime error;
- public route exposes private refs/data;
- auth redirects to an unexpected domain;
- user is checking a different URL than the deployed URL;
- checks were not run and the task requires them.
