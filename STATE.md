# STATE

- current task: add secure wallet-backed Supabase migration runner
- repo used: `/Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil`
- branch: `codex/reiki-supabase-migration-runner`
- wallet dependency: `/Users/andriilitvinov/projects/MYPROJECTS/codex-links` Local Secret Vault, section `Reiki Yggdrasil / Supabase`

## 2026-05-26 Supabase Migration Runner

- restored committed migration files for Power Place persistence, Business/DAO upgrade, and Zodiac/chat upgrade
- added `npm run supabase:migrations:apply` for the action `Apply Reiki Supabase migrations`
- runner reads only `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` from the local wallet and passes them as child-process env vars
- runner dry-runs `supabase db push --linked --dry-run` before applying, allows only the three 20260526 migration files, and refuses uncommitted migration files
- schema verification checks `account_plan`, goal photos, tradition assets, power-place compositions, zodiac visibility, and chat tables through the Supabase Management API read-only query endpoint
- safety status: no secret values committed, no frontend-bundled migration secrets, no reset/drop/repair command path

## Remaining Verification

- real migration apply still requires the local wallet to contain valid `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`
- schema verification may return `needs_permission` if the token lacks Management API read-only database query access
