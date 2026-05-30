# Reiki Yggdrasil — Root Cause Matrix

Status: v1.
Purpose: help the debugger agent move from symptom to probable root cause without guessing.

## How to use

1. Start with the user-visible symptom.
2. Pick the matching row below.
3. Verify causes in the listed order.
4. Do not write a Codex fix prompt until at least one file, component, command, route, or deployment fact is confirmed.

## Matrix

| Symptom | First classification | Verify in this order | Likely files/areas | Avoid |
| --- | --- | --- | --- | --- |
| Change is not visible on live | `DEPLOY_MISMATCH` | commit exists → merged/main → Vercel success → correct domain → route/auth/data visibility | Vercel status, PR/commit, `vercel.json`, route files | CSS/UI fix before deploy chain is confirmed |
| Route returns 404 after refresh | `ROUTING` | Vercel rewrite → SPA fallback → route switch → path typo | `vercel.json`, `src/main.jsx` | Removing routes or hardcoding domain |
| Login starts but returns wrong page | `AUTH` + `STATE_MANAGEMENT` | redirect URL → origin logic → pre-auth intent storage → callback consume/reset path | `src/lib/supabaseClient.js`, `src/pages/ProfilePage.jsx`, order/profile state | Hardcoding only one production domain |
| Admin route empty | `ADMIN_MODERATION` + `SUPABASE_RLS` | auth state → admin membership/env presence → status filters → RLS → live data exists | `src/pages/AdminPage.jsx`, Supabase migrations, admin client helpers | Loosening RLS broadly |
| Photo works immediately but disappears after reload | `STORAGE_MEDIA` | saved ref type → `data:image` leak → signed URL resolver → Storage policy → migration applied | `profileMediaClient`, `ProfilePage`, media migrations | Saving signed URLs or making bucket public |
| Public page shows private ref text | `STORAGE_MEDIA` + `DATA_CONTRACT` | public query fields → card render → thumbnail fallback → storage ref filtering | `profileMaterialsClient`, `src/main.jsx`, card components | Rendering raw `storage://` values |
| Mobile has horizontal overflow | `UI_LAYOUT_MOBILE` | viewport width → recent CSS changes → grid/flex min-width → media query scope → popup/card widths | CSS files, `ProfilePage` layout | Global desktop layout rewrite |
| Desktop columns collapse | `UI_LAYOUT_DESKTOP` | width → grid template → column wrappers → changed CSS → route-specific class scope | `src/index.css`, `profileCabinet.css`, `profileMandalaWorkspace.css` | Fixing desktop with mobile-only assumptions |
| Service order loses format after Google login | `SERVICE_ORDER_FLOW` + `AUTH` | selected format state → save intent before redirect → callback restore → order page prefill → stale intent cleanup | `profileServicesClient`, `ProfilePage`, order flow helpers | Duplicate orders or clearing intent too early |
| Save/update edits wrong mandala | `STATE_MANAGEMENT` | active item id → form state owner → tab switch reset → persistence payload → update vs create branch | `ProfilePage`, composition helpers | Clearing all workspace state as quick fix |
| Print/download misses images | `PRINT_DOWNLOAD_EXPORT` + `STORAGE_MEDIA` | export mode → visible state vs persisted refs → signed URL availability → safe fallback | export/download helpers in `ProfilePage` | Claiming full image/PDF export when only HTML fallback exists |
| Knowledge validator fails | `COURSE_CONTENT` | failing ID → knowledge record → docs source → link/video field → validator expectation | `src/data/reikiKnowledgeBase.js`, validators, docs | Inventing course details |

## Cause confidence rules

Use these labels in reports:

- `confirmed`: directly verified by file/runtime/deployment evidence.
- `likely`: supported by evidence but not fully reproduced.
- `possible`: hypothesis only; needs repo/runtime check.
- `needs verification`: cannot be confirmed with available access.

## Minimal root-cause report

```text
Symptom:
Primary class:
Evidence level:
Root cause candidate:
Confidence:
Verified facts:
Ruled out:
Still needs verification:
Minimal fix:
Regression risk:
```

## Anti-patterns

Do not:

- treat “not visible on live” as a CSS bug first;
- treat Supabase errors as UI bugs without checking RLS/auth/env;
- treat screenshot layout issues as global CSS bugs before checking viewport and route;
- patch more than one layer at once unless evidence proves the bug crosses layers;
- claim live verification from local/preview evidence.
