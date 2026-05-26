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
3. Apply `supabase/migrations/20260526_profile_cabinet_publication_step_fields.sql`.
4. Apply `supabase/migrations/20260526_profile_cabinet_security_lints.sql`.
5. Apply `supabase/migrations/20260526_power_place_persistence.sql`.
6. Add these auth redirect URLs in Supabase:
   - `https://reiki-yggdrasil.vercel.app/profile`
   - `https://reiki-yggdrasil.vercel.app/profile/admin`
7. Add the Vercel production env vars named above.
8. After the first admin login, insert that user's `user_id` and email into `profile_cabinet_admins`.

Use the production `VITE_ADMIN_EMAIL` value in the placeholder below. Do not commit or paste the real email into the repo:

```sql
insert into public.profile_cabinet_admins (user_id, email)
select id, email
from auth.users
where email = '<VITE_ADMIN_EMAIL value>'
on conflict (user_id) do update set email = excluded.email;
```

Google OAuth setup:

1. Enable the Google provider in Supabase Auth.
2. Configure Google OAuth credentials in the Supabase dashboard.
3. Add the Supabase callback URL from the Supabase dashboard to Google Cloud OAuth redirect URIs.
4. Add these auth redirect URLs in Supabase:
   - `https://reiki-yggdrasil.vercel.app/profile`
   - `https://reiki-yggdrasil.vercel.app/profile/admin`
5. For preview deployments, add the relevant Vercel preview URL if testing OAuth on preview.

Power Place persistence setup:

- `20260526_power_place_persistence.sql` adds the profile `account_plan`, client/goal photo references, tradition image references, and saved Power Place compositions.
- Account limits are profile-level only: Start allows 7 saved compositions and 10 client/goal photos; Pro allows 20 saved compositions and 30 client/goal photos.
- File uploads to Supabase Storage are still needs verification. The current UI persists URL/metadata references and filters local `data:image` previews out of saved composition payloads.

## Deploy

The repository includes:

- `vercel.json` for Vercel deployment
- `.github/workflows/deploy-pages.yml` for GitHub Pages deployment
