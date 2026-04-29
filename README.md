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
