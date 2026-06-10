# /delivery

Follow `docs/delivery-loop-program.md` and `docs/delivery-loop-technical-details.md`.

Act as release owner for this project.

Input format:

Task:
$ARGUMENTS

Project adapter for this repo:
- Repository: andylitvinov-design/reiki-yggdrasil
- Default branch: main
- Target branch: main (features) / production (client releases)
- Package manager: npm
- Framework: Vite + React SPA
- Build: npm run build
- Check: npm run check
- CI: GitHub Actions
- Deployment: Vercel (auto-deploy from GitHub)
- Live URL: https://mentalica.vercel.app
- Legacy URL: https://reiki-yggdrasil.vercel.app

Required final status:

- STATUS: SUCCESS — task implemented, PR merged (or direct-to-main confirmed), deployed, and verified live.
- STATUS: BLOCKED — exact external blocker, evidence, and required user action.

Do not stop after code, PR, checks, merge, or deploy.
SUCCESS requires live proof.
