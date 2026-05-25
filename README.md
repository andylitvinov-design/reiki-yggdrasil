# Reiki Yggdrasil Prototype

React/Vite prototype for the Reiki Yggdrasil piano-style learning platform.

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Profile cabinet setup

The profile cabinet MVP is routed at `/profile`, `/masters`, and `/profile/admin`.
It uses Supabase public REST/auth with frontend env names only:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAIL=
```

Do not put env values or service-role keys in the repository or frontend.

Supabase setup steps:

1. Apply `supabase/migrations/20260524_profile_cabinet_mvp.sql`.
2. Apply `supabase/migrations/20260524_profile_cabinet_rls_followup.sql`.
3. Add these auth redirect URLs in Supabase:
   - `https://reiki-yggdrasil.vercel.app/profile`
   - `https://reiki-yggdrasil.vercel.app/profile/admin`
4. Add the Vercel production env vars named above.
5. After the first admin login, insert that user's `user_id` and email into `profile_cabinet_admins`:

```sql
insert into public.profile_cabinet_admins (user_id, email)
select id, email
from auth.users
where email = '<VITE_ADMIN_EMAIL value>'
on conflict (user_id) do update set email = excluded.email;
```

Do not commit or publish the real admin email value.

## Deploy

The repository includes:

- `vercel.json` for Vercel deployment
- `.github/workflows/deploy-pages.yml` for GitHub Pages deployment
