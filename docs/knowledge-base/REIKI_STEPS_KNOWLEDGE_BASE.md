# Reiki Steps Knowledge Base

## Purpose

This document describes how the Reiki Yggdrasil learning-step knowledge base is stored, validated, and safely expanded inside this GitHub repository.

The goal is to keep the public course structure and learning content versioned in GitHub instead of leaving it only inside React component state.

## Current status

- status: `course_structure_verified_from_screenshots_content_partial`
- canonical data source: `src/data/reikiKnowledgeBase.js`
- UI consumer: `src/main.jsx`
- validator: `scripts/validate-knowledge-base.mjs`
- validation command: `npm run validate:knowledge`
- build command: `npm run build`
- full check command: `npm run check`

## Coverage

| Area | Status |
| --- | --- |
| Levels | 7 levels defined |
| Steps/items | 37 stable records defined |
| Structure source | user-provided screenshots, 2026-05-05 |
| Step titles | aligned with screenshots |
| Full descriptions/practices/results | still need author-approved content |
| Supabase-backed content CMS | needs verification / not confirmed in current `main` |

## Level map

| Level | Name | Count | Label | Items |
| --- | --- | ---: | --- | --- |
| 1 | Базовая программа Рейки Иггдрасиль | 5 | Уровень | Здоровье · Интуиция · Защита; Очищение · Денежная активация; Предопределение · Сила; Сверхчувственное видение; Уровень мастера |
| 2 | Инструкторский курс | 6 | Ступень | Целительство; Золотой телец; Мужчина и женщина; Жизненная сила; Сексуальная энергетика; Файербол. Управление энергией |
| 3 | Храмовая терапия | 4 | Ступень | Работа с эгрегорами; Египетская магия; Греческая магия. Зодиак; Индуистская магия. Кундалини |
| 4 | Восточная магия | 6 | Ступень | Китайская медицина 1. Элементы; Китайская медицина 2. Сила; Китайское прогнозирование. И Цзин; Славянская магия 1; Славянская магия 2; Цивилизации. Мифы и легенды |
| 5 | Западноевропейская магия. Каббала и Таро | 5 | Ступень | Великие арканы Таро; Силы стихий; Дерево Сефирот; Высшие арканы Таро; Предсказания в Таро |
| 6 | Продвинутая магия рун | 5 | Ступень | Руны и руническая традиция; Миры Древа Иггдрасиль; Круг силы; Руническое предсказание; Руническое исцеление |
| 7 | Высшая магия | 6 | Ступень | Телепорт. Астральный полет. Ясновидение; Машинный зал. Укрепление видения; Ифриты. Создание помощников; Суфизм; Денежная магия; Магия толтеков |

## Stable IDs

Every record must keep a stable ID:

```text
RY-L01-S01
RY-L01-S02
RY-L02-S01
...
RY-L07-S06
```

Pattern:

```text
RY-L{two-digit-level}-S{two-digit-step}
```

Do not rename existing IDs after content, progress, links, comments, or future database rows start depending on them.

## Canonical data shape

Each level record should include:

```js
{
  id: 1,
  name: "Базовая программа Рейки Иггдрасиль",
  count: 5,
  stepLabel: "Уровень",
  theme: "...",
  steps: []
}
```

Each step record should include:

```js
{
  id: "RY-L01-S01",
  levelId: 1,
  number: 1,
  label: "Уровень",
  title: "Здоровье · Интуиция · Защита",
  status: "structure_verified_from_screenshot",
  intro: "...",
  meaning: "...",
  opens: ["..."],
  skills: ["..."],
  result: "...",
  contentStatus: "needs_content"
}
```

## Content statuses

| Status | Meaning |
| --- | --- |
| `structure_verified_from_screenshot` | Level/step title and order are aligned with user screenshots. |
| `needs_content` | Structural record exists, but full text/practice/result still needs author content. |
| `needs_review` | Content exists but must be reviewed by the course author. |
| `verified` | Reserved for content explicitly reviewed and approved by the course author. |

## Safe editing workflow

1. Read `AGENTS.md`, `STATE.md`, `LOG.md`, this document, and `src/data/reikiKnowledgeBase.js` first.
2. Edit `src/data/reikiKnowledgeBase.js` for canonical public course structure/content.
3. Use `needs_content` when full author material is missing.
4. Run:

```bash
npm run validate:knowledge
npm run build
```

5. Check the public UI:
   - `/`
   - desktop three-column layout
   - mobile layout below 980px
   - level/step switching across all 7 levels
   - no console errors

6. Update `STATE.md` and `LOG.md` after meaningful changes.

## Open questions / needs verification

- Full descriptions, practices, settings, homework, and expected results for each of the 37 records.
- Whether step content should later move to Supabase CMS or remain static in GitHub.
- Whether `/profile`, `/masters`, and `/profile/admin` are planned routes or from stale project memory.
- Whether the live Vercel deployment points to the current `main` branch and latest commit.

## Next content tasks

1. Add author-approved descriptions for each record.
2. Add fields only when needed, for example: `practice`, `videoUrl`, `audioUrl`, `mandalaPrompt`, `teacherNotesPublic`, `recommendedDuration`, `homework`.
3. Keep private/master-only fields outside the public static data unless a proper access model exists.
