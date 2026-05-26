# Reiki Yggdrasil Prototype

React/Vite prototype for the Reiki Yggdrasil platform.

## Local run

```bash
npm install
npm run dev
```

## Env

Create `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL=andy.litvinov@gmail.com
```

## Supabase SQL

Run in Supabase SQL Editor:

1. `supabase/migrations/20260428_master_cabinet_mvp.sql`
2. `supabase/seed.sql`

## Apply Reiki Supabase migrations

Action name: `Apply Reiki Supabase migrations`

The migration runner reads these values from the local `codex-links` Secret Vault and exposes them only to the child Supabase CLI process:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Add both values in the wallet UI:

```bash
cd /Users/andriilitvinov/projects/MYPROJECTS/codex-links
SECRET_VAULT_PORT=8790 npm run secrets:local
```

Open `http://127.0.0.1:8790/secrets`, then save both entries:

1. `Reiki Yggdrasil / Supabase - SUPABASE_ACCESS_TOKEN`
2. `Reiki Yggdrasil / Supabase - SUPABASE_PROJECT_REF`

Presence-only status check:

```bash
cd /Users/andriilitvinov/projects/MYPROJECTS/codex-links
npm run secrets:reiki:supabase:status
```

Apply committed pending migrations:

```bash
npm run supabase:migrations:apply
```

The runner allowlists only these committed migration files:

1. `supabase/migrations/20260526_power_place_persistence.sql`
2. `supabase/migrations/20260526_power_place_upgrade_5_business_dao.sql`
3. `supabase/migrations/20260526_power_place_upgrade_6_zodiac_chat.sql`

Safety rules:

- runs `supabase db push --dry-run` before applying
- aborts if pending migrations include any non-allowlisted file
- never calls `supabase db reset`, `supabase migration repair`, or drop/reset helpers
- reports only secret names and `configured|missing`
- sanitizes CLI/API errors before printing
- verifies the expected profile, power-place, zodiac, and chat schema after apply when the token has read permission

## Routes

- `/` main page (existing UI)
- `/profile` master cabinet (auth/profile/content/services)
- `/profile/admin` admin moderation (only `VITE_ADMIN_EMAIL`)
- `/masters` public masters catalog

## Verify `/profile`

1. Sign in via Google or email/password.
2. Fill profile form (`name`, `bio`, `training_info`).
3. Confirm content sections unlock after profile completion.
4. Upload media with required `level + attunement`.
5. Add bonus/paid services and verify level-based UI restrictions.
6. Login as admin email and open `/profile/admin`.

## Build

```bash
npm run build
```
