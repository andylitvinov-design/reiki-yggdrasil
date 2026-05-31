# Deploy retry for PR #151

Date: 2026-05-31

Purpose: trigger a new Vercel production deployment after PR #151 merge commit `a81caaa01c32f2ed4ea16a5a09de7c71d1cdea09` failed with `build-rate-limit`.

This file does not change runtime code, routes, Supabase flows, Vercel rewrites, or UI behavior.

Expected live verification after deployment:

- Open `https://mentalica.vercel.app/profile?debugAuth=1`.
- Confirm the debug panel/source contains:
  - `react authStatus`
  - `react user state`
  - `react user id present`
  - `react session state`
  - `react cabinet condition`
  - `react loadingTimedOut`

If these rows are not visible, the PR #151 diagnostics are still not live.
