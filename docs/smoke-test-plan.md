# Smoke test plan — `reiki-yggdrasil`

Use this checklist after Cloud, local, or live changes. It is not full QA; it catches obvious breakage.

## 1. Build and script checks

Minimum:

```bash
npm ci
npm run build
```

Broader, when reasonable:

```bash
npm run check
npm run delivery:checks
npm run delivery:status
```

If these fail because of disk space (`ENOSPC`), proxy/network, or wrong workspace, report the blocker and stop.

## 2. Repository/workspace check

For app-code tasks, confirm the workspace is the real app repo:

```bash
pwd
find /workspace -maxdepth 2 -type d -name .git -print
cat package.json | head
```

Wrong workspace example:

```text
/workspace/psitrends-work
```

Correct action: stop and ask the user to start the task in `andylitvinov-design/reiki-yggdrasil`.

## 3. Mobile UI check

Viewports to check when possible:

```text
375 x 667   small iPhone
390 x 844   common iPhone
430 x 932   large iPhone
768 x 1024  tablet
1440 x 900  desktop
```

Check:

- no white screen;
- header/top navigation visible;
- main actions clickable;
- bottom bars do not cover content;
- page scrolls correctly;
- inputs remain usable when iOS keyboard opens;
- mobile fix does not break desktop.

## 4. Auth/profile smoke check

Manual/local/live required. Cloud cannot fully verify this.

Check:

- login button appears;
- Supabase/Google login starts;
- successful login returns to `/profile`;
- private cabinet pages stay private when logged out;
- profile/settings pages open when logged in;
- refresh keeps or restores session correctly;
- no dev/mock auth is active in production.

## 5. AI intake / results history

Check:

- primary intake opens;
- answers can be entered;
- primary result is saved as baseline;
- repeat intake saves dated history;
- repeat intake does not overwrite baseline unless explicitly intended;
- comparison/history view remains available.

## 6. DAO / talisman / mandala editor

Check:

- editor opens;
- saved mandala/talisman loads;
- show/hide toggles hide the intended layer;
- internal/external background can be set to no background;
- center photo is not squeezed;
- background/field size sliders affect intended layers;
- DAO styles pick up selected backgrounds;
- circle/square shape changes do not leave unwanted hidden fills;
- export/preview still works if implemented.

## 7. Vercel preview/live

After PR/merge:

- Vercel build/deploy succeeds;
- app opens on preview/live URL;
- main routes open;
- auth callback URL is allowed in Supabase/Google config;
- mobile screen works on a real phone;
- no blocking console errors.

Do not treat Vercel build success as proof that auth or mobile UI was fully tested.

## 8. Final acceptance checklist

```text
[ ] Correct repo/workspace: reiki-yggdrasil
[ ] npm ci passed or blocker reported
[ ] npm run build passed or blocker reported
[ ] Changed files are relevant
[ ] No unrelated redesign
[ ] Routes preserved
[ ] Auth not weakened
[ ] Saved data not destroyed
[ ] Mobile/manual checks listed when needed
[ ] Limitations stated clearly
```
