# LOG

## 2026-05-26

- Restored `supabase/migrations/20260526_power_place_persistence.sql`, `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`, and `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql` from existing git history.
- Added `scripts/apply-reiki-supabase-migrations.mjs` and package action `npm run supabase:migrations:apply`.
- The runner reads `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` from the local `codex-links` wallet project `Reiki Yggdrasil / Supabase`, then passes them only as Supabase CLI child-process environment variables.
- The runner blocks missing wallet values, untracked/dirty migration files, unclear dry-run output, and pending migrations outside the three-file allowlist.
- Added README instructions for adding the token/ref in the Local Secret Vault UI, checking presence without values, and running the migration action.
