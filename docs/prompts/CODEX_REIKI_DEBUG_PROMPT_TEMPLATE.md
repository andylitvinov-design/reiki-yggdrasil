# Codex Reiki Debug Prompt Template

Use this template for future Reiki Yggdrasil bug fixes.

```text
Repo: https://github.com/andylitvinov-design/reiki-yggdrasil
Target branch: codex/<short-task-name>
Live URL: https://reiki-yggdrasil.vercel.app
Target production URL: https://mentalica.vercel.app
Framework: Vite + React
Hosting: Vercel, npm run build, output dist

Task type:
- bug / design_mismatch / live_mismatch / auth_data_flow / content_issue / quality_audit / feature_change

Bug class:
- DEPLOY_MISMATCH / ROUTING / AUTH / SUPABASE_RLS / STORAGE_MEDIA / UI_LAYOUT_DESKTOP / UI_LAYOUT_MOBILE / STATE_MANAGEMENT / DATA_CONTRACT / COURSE_CONTENT / ADMIN_MODERATION / SERVICE_ORDER_FLOW / PRINT_DOWNLOAD_EXPORT

Affected route(s):
- /
- /profile
- /masters
- /profile/admin

Affected viewport(s):
- desktop 1280 / 1366 / 1440 / 1710
- mobile 390

Expected behavior:
<describe exact expected behavior>

Actual behavior/evidence:
<describe exact actual behavior, screenshot notes, live/preview/branch/PR evidence>

First read:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- package.json
- vercel.json
- docs/debug/REIKI_DEBUGGER_PLAYBOOK.md
- docs/debug/REIKI_BUG_TAXONOMY.md
- docs/ui-contracts/REIKI_PROFILE_UI_CONTRACT.md
- docs/supabase/REIKI_SUPABASE_CONTRACT.md
- docs/media/REIKI_MEDIA_STORAGE_CONTRACT.md
- src/lib/reikiDebugSnapshot.js
- relevant src/pages and src/lib files

Likely files:
- <file 1>
- <file 2>

Minimal safe fix:
- Make the smallest scoped change that fixes the confirmed bug.
- Do not rewrite the project.
- Do not change unrelated UI/routes/data flows.

Do not change:
- public home page unless explicitly targeted
- RU-default interface
- accepted desktop three-column layout
- mobile fallback below 980px
- Supabase auth/data flows unless the task targets them
- Vercel rewrites unless route bug requires it
- env values/secrets
- private storage/public data boundaries

Checks to run:
- npm run verify:debug-contract
- npm run check
- npm run build
- additional targeted tests if relevant

Manual QA:
- verify affected route(s)
- verify desktop/mobile viewports if UI changed
- verify live only after merge/deploy
- mark Supabase/auth/storage checks as needs verification if no live session was used

Report format:
- Summary
- Changed files
- Checks run
- What was verified
- What was not verified
- Risks
- Live/preview status
- STATE.md / LOG.md update suggestion
```
