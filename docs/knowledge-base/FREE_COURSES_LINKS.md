# Бесплатные курсы psimaster.net

Source page: `https://psimaster.net/service?shs_term_node_tid_depth=12312`

Status: список перенесен из PR #11 как безопасная библиотека названий. Прямые URL отдельных курсов и прямые video/embed URL пока не подтверждены, поэтому интерфейс показывает статус `ссылка требует проверки`.

## UI placement

Материалы показываются в левом меню главной страницы при выборе верхней кнопки `БЕСПЛАТНЫЕ КУРСЫ`.

PR #11 добавлял отдельную правую вкладку `Бесплатные видео`. Эта ветка не переносит правую вкладку: исправленное требование состоит в том, что верхние кнопки переключают левое меню.

## Data source

Canonical UI-readable data: `src/data/freeCourseLinks.js`.

Each record uses:

- `id` — stable ID.
- `title` — learner-facing title from PR #11.
- `type` / `typeLabel` — machine and public material type.
- `category` / `categoryLabel` — filter/category label retained for later use.
- `tradition` — topic/tradition label for the card.
- `description` — short learner-facing description.
- `source` — `psimaster`.
- `sourcePageUrl` — verified source listing URL.
- `courseUrl` — direct course page URL, currently `null` until verified.
- `embedUrl` — direct embeddable video URL, currently `null` until verified.
- `urlStatus` — `needs verification` until direct URL is known.
- `recommendedPlacement` — suggested relation to the new top menu sections.
- `notes` — verification note.

## Records

| ID | Title | Type | Category | Direct URL status |
| --- | --- | --- | --- | --- |
| `FREE-PSI-DEMETRA` | Курс Греческие Мистерии. Канал Деметры. | course | greek | needs verification |
| `FREE-PSI-PLANETS` | Курс Сила Планет | course | planets | needs verification |
| `FREE-PSI-PROTECTION-MEDITATIONS` | Медитации Силы и Защиты | meditation | protection | needs verification |
| `FREE-PSI-MAYA-ARCHETYPES` | Архетипы Майя | video | maya | needs verification |
| `FREE-PSI-EGYPT-OSIRIS` | Курс Жречество Египта. Осирис | course | egypt | needs verification |
| `FREE-PSI-DIONYSUS` | Курс Мистерии Диониса | course | greek | needs verification |

## Verification policy

Do not invent direct course or video URLs. Update `courseUrl` and/or `embedUrl` only after verifying the actual course/video page from `psimaster.net` or another author-approved source.

When a direct URL is confirmed:

1. Set `courseUrl` to the exact course page URL.
2. Set `embedUrl` to an embeddable video URL when available and allowed.
3. Change `urlStatus` to `verified`.
4. Update this document.
5. Run `npm run validate:free-courses`.
6. Run `npm run check`.
