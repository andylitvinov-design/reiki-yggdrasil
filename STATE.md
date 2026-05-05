# Reiki Yggdrasil — STATE

Last updated: 2026-05-05

## Current verified repo state

- repo: `andylitvinov-design/reiki-yggdrasil`
- default branch: `main`
- live URL from project memory: `https://reiki-yggdrasil.vercel.app`
- hosting from repo config: Vercel / Vite build
- build command: `npm run build`
- output directory: `dist`
- framework: `vite`

## Current app structure

The current `main` branch is a Vite/React public prototype.

Confirmed files:

- `README.md`
- `package.json`
- `vercel.json`
- `index.html`
- `src/main.jsx`
- `src/index.css`
- `package-lock.json`

Not found in current `main` during this audit:

- `AGENTS.md`
- `STATE.md`
- `LOG.md`
- `src/App.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/MastersPage.jsx`
- `src/pages/AdminPage.jsx`
- `src/lib/supabaseClient.js`
- `supabase/migrations/20260428_master_cabinet_mvp.sql`

## Knowledge base state

Branch `codex/reiki-knowledge-base` introduces a GitHub-stored knowledge base for the public Reiki Yggdrasil course structure.

New canonical knowledge files:

- `src/data/reikiKnowledgeBase.js`
- `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
- `scripts/validate-knowledge-base.mjs`
- `.github/workflows/ci.yml`

Coverage now aligned with user screenshots and follow-up corrections:

- 7 levels
- 37 stable records
- Level/step titles follow the latest user corrections from 2026-05-05
- Full descriptions, practices, settings, homework, and expected results still need author-approved content

Canonical level map:

1. `Базовая программа Рейки Иггдрасиль` — 5 items, label `Уровень`
2. `Инструкторский курс` — 6 items, label `Ступень`
3. `Храмовая магия` — 5 items, label `Ступень`
4. `Восточная магия` — 5 items, label `Ступень`
5. `Западноевропейская магия. Каббала и Таро` — 5 items, label `Ступень`
6. `Продвинутая магия рун` — 5 items, label `Ступень`
7. `Высшая магия` — 6 items, label `Ступень`

Latest corrections applied:

- Level 3 renamed/confirmed as `Храмовая магия`.
- Level 3 step 4 = `Толтекская магия`.
- Level 3 step 5 = `Суфизм`.
- Level 4 step 4 = `Кундалини`.
- Level 4 step 5 = `Денежная магия`.
- Level 7 step 4 = `Славянская магия 1`.
- Level 7 step 5 = `Славянская магия 2`.
- Level 7 step 6 = `Цивилизации`.

Stable ID format:

```text
RY-L01-S01
RY-L07-S06
```

## Known mismatch with ai-projects-brain memory

The external project memory currently describes a larger Supabase-backed MVP with `/profile`, `/masters`, `/profile/admin`, and Supabase files. Those files/routes were not found in the current repo `main` during this audit.

Conclusion: project memory likely contains stale or future/planned state and must be updated or split into:

- current verified repo state
- planned Supabase/profile/master/admin roadmap

## Env names

From project memory only; values are not stored and were not verified:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

## Verification status

Verified by GitHub file inspection:

- repo exists and is accessible
- current branch is `main`
- `vercel.json` points to Vite build output `dist`
- current UI is built from `src/main.jsx` and `src/index.css`
- knowledge-base branch adds canonical static data and validation script
- knowledge-base data now defines 7 levels / 37 records aligned with latest user corrections
- left menu now renders the group item count from each level's `stepLabel`, so Level 1 uses `Уровень` wording and Levels 2-7 use `Ступень` wording
- learner UI now hides raw technical `needs_content` / internal status strings and uses a local SVG favicon to avoid preview console 404 noise
- selected long left-menu titles now keep dark readable text over the selected key gradient
- `package.json` declares `"type": "module"` to match existing ESM config files and avoid Node module-type warnings during build/preview
- PR has Vercel success status on a previous head; latest CI/build status still needs observation after the newest commits

Not verified locally:

- `npm ci`
- `npm run validate:knowledge`
- `npm run build`
- Vercel live deployment behavior
- browser console
- desktop/mobile visual QA
- Supabase/auth/data flows

Reason local verification was not completed: current execution container could not resolve `github.com` for clone/npm setup.

## Risks

- The structure is aligned with the latest corrections, but full lesson content is still missing.
- Long Russian titles may need visual QA on narrow mobile screens.
- Expanding all levels in the left panel may affect vertical scroll/spacing and needs visual QA.
- Supabase/profile/admin work should not be resumed until actual repo state is reconciled.

## Next actions

1. Run `npm ci`.
2. Run `npm run validate:knowledge`.
3. Run `npm run build`.
4. Preview `/` locally and check desktop/mobile layout.
5. Check GitHub Actions CI result for this PR.
6. Fill all 37 records with author-approved descriptions/practices/results.
7. Update `ai-projects-brain/projects/reiki-yggdrasil/*` to reflect actual repo state.
