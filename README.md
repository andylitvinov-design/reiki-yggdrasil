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

## Supabase profile cabinet setup

Configure these Vercel env names without committing values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

Apply profile-cabinet migrations in this order:

1. `supabase/migrations/20260524_profile_cabinet_mvp.sql`
2. `supabase/migrations/20260524_profile_publication_step_links.sql`

The second migration adds step and setting links for profile publications, so it must run after the profile cabinet tables exist.

## Deploy

The repository includes:

- `vercel.json` for Vercel deployment
- `.github/workflows/deploy-pages.yml` for GitHub Pages deployment
