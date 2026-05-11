# Global Autonomous Project Rules

Before working in this repository, read and apply the shared project-brain rules:

- `https://raw.githubusercontent.com/andylitvinov-design/ai-projects-brain/main/systems/autonomous-project-executor.md`
- `https://raw.githubusercontent.com/andylitvinov-design/ai-projects-brain/main/systems/agent-rules.md`
- `https://raw.githubusercontent.com/andylitvinov-design/ai-projects-brain/main/systems/codex-project-workflow.md`
- `https://raw.githubusercontent.com/andylitvinov-design/ai-projects-brain/main/projects/reiki-yggdrasil/PROJECT.md`

Default mode: work autonomously for safe read-only, docs, diagnosis, planning, branch, patch, test, and PR work. Ask only before risky actions: secrets/env changes, deletion, merge to `main`, production deploy, financial/account/access changes, irreversible changes, or broad rewrites.

---

# AGENTS.md — Reiki Yggdrasil

## Project boundary

Canonical repo: `andylitvinov-design/reiki-yggdrasil`.
Live URL: `https://reiki-yggdrasil.vercel.app`.
Framework: Vite + React.
Hosting: Vercel, `npm run build`, output `dist`.

## Context-first rules

Before changing this repo, read:

1. `AGENTS.md`
2. `README.md`
3. `STATE.md`
4. `LOG.md`
5. `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`
6. `src/data/reikiKnowledgeBase.js`
7. `src/main.jsx`
8. `src/index.css`
9. `package.json`
10. `vercel.json`

If a file is missing, report `not found`.

## Knowledge-base rules

- Store reusable learning/course content in GitHub, not only inline inside React components.
- Canonical UI-readable knowledge records live in `src/data/reikiKnowledgeBase.js`.
- Human-readable architecture lives in `docs/knowledge-base/REIKI_STEPS_KNOWLEDGE_BASE.md`.
- Every Reiki step must have a stable ID in the form `RY-L01-S01`.
- Unknown content must be marked as `needs_content` or `needs verification`; do not invent sacred/course details.
- Preserve existing Russian-first copy unless explicitly asked to translate.
- Do not store secrets, API keys, student data, private initiations, or private master notes in this repo.

## UI safety rules

- Preserve the current public home page unless explicitly changing it.
- Preserve the desktop three-column structure: left levels, center stage, right practice panel.
- Preserve mobile single-column fallback.
- Keep RU default interface.
- Do not rewrite the whole project when a small additive change is enough.

## Data and env safety

Current repo state has no confirmed Supabase implementation in `main`.
Known env names from project memory only, values must never be committed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

If Supabase/profile/master/admin flows are added or restored, verify exact code and migrations first.

## Verification

Run:

```bash
npm install
npm run build
```

If UI changes are made, also run local preview and check:

- `/`
- desktop layout
- mobile layout below 980px
- no console errors
- no broken imports

## Report format

After work, report:

- changed files
- exact checks run
- what was verified
- what was not verified
- risks
- whether `STATE.md` / `LOG.md` need updates
