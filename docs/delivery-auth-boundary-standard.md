# Delivery Auth Boundary Standard

Status: project-local mirror of canonical system rule  
Canonical source: `andylitvinov-design/ai-projects-brain/systems/delivery-auth-boundary-standard.md`  
Applies to: `/delivery`, `/fix-deploy`, production verification, PR final reports

## Rule

Expected Google OAuth, Supabase auth, private cabinet login, account chooser, captcha, browser-not-secure screen, or owner-only session is not by itself a delivery failure.

The delivery loop has three final states:

```txt
STATUS: SUCCESS
STATUS: SUCCESS_WITH_AUTH_LIMITATION
STATUS: BLOCKED
```

Use `STATUS: SUCCESS_WITH_AUTH_LIMITATION` when all implementation/build/PR/deploy/public/login checks pass and the only missing proof is authenticated post-login live verification blocked by expected Google/Supabase/private auth.

## Required safe proof for auth-gated cabinets

Before using `SUCCESS_WITH_AUTH_LIMITATION`, verify:

1. build/checks pass;
2. final commit is deployed;
3. public live route loads without runtime crash;
4. login/auth entry point is visible;
5. protected routes redirect to login/auth instead of crashing;
6. no pre-auth console/runtime errors show a broken app;
7. local dev/demo/mock/fixture/code-level verification covers the post-login change as much as safely possible.

## Forbidden

Do not:

- request or use real Google credentials;
- request or use cookies, refresh tokens, secrets, env values;
- bypass OAuth/security controls;
- retry OAuth endlessly;
- mark delivery as `BLOCKED` only because live production requires human login.

## Required final wording

```txt
AUTHENTICATED LIVE PROOF: SKIPPED_EXPECTED_AUTH_BOUNDARY
Reason: production post-login area is protected by Google/Supabase/private auth, and using real credentials/cookies/secrets is not allowed.
Safe proof completed: build, deployment, public route, login entry, protected-route redirect, and local/demo/code verification where available.
Final status: STATUS: SUCCESS_WITH_AUTH_LIMITATION
```

## True BLOCKED cases

Use `STATUS: BLOCKED` for real failures: build/CI/deploy failure, public route broken, login entry broken, protected route crash, wrong deployed commit, missing permission/secret/env, unsafe production data/security change, or no safe local/demo/code proof for a risky post-login change.

## Precedence

This file overrides older `/delivery` wording that says every missing authenticated live proof must become `BLOCKED`.

```txt
Expected auth boundary + safe public/login/local/code proof = SUCCESS_WITH_AUTH_LIMITATION.
Real app/deploy/runtime/security/data failure = BLOCKED.
```
