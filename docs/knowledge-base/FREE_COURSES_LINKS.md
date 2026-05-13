# Бесплатные курсы и медитации psimaster.net

Source page: `https://psimaster.net/service?shs_term_node_tid_depth=12312`

Status: список собран по пользовательскому скриншоту. Прямые URL отдельных курсов пока не подтверждены, поэтому в UI используется ссылка на общую страницу списка материалов.

## UI placement

Блок выводится в правой колонке публичного учебного интерфейса, во вкладках `Упражнения` и `Мастера`, сразу после списка упражнений.

Цель блока — дать ученику быстрый доступ к бесплатной библиотеке дополнительных материалов Академии без изменения основной структуры курса Рейки Иггдрасиль.

## Data source

Canonical UI-readable data: `src/data/freeCourseLinks.js`.

Each record uses:

- `id` — stable ID.
- `title` — learner-facing title from the screenshot.
- `type` / `typeLabel` — machine and public material type.
- `tradition` — topic/tradition label for the card.
- `source` — `psimaster`.
- `sourcePageUrl` — verified source listing URL.
- `courseUrl` — direct course URL, currently `null` until verified.
- `urlStatus` — `needs verification` until direct URL is known.
- `recommendedPlacement` — suggested relation to Reiki Yggdrasil course sections.
- `notes` — verification note.

## Records

| ID | Title | Type | Tradition | Direct URL status |
| --- | --- | --- | --- | --- |
| `FREE-PSI-DEMETRA` | Курс Греческие Мистерии. Канал Деметры. | course | Греческие мистерии | needs verification |
| `FREE-PSI-PLANETS` | Курс Сила Планет | course | Планетарная магия | needs verification |
| `FREE-PSI-PROTECTION-MEDITATIONS` | Медитации Силы и Защиты | meditation | Сила и защита | needs verification |
| `FREE-PSI-MAYA-ARCHETYPES` | Архетипы Майя (видео) | video | Архетипы Майя | needs verification |
| `FREE-PSI-EGYPT-OSIRIS` | Курс Жречество Египта. Осирис | course | Египетские мистерии | needs verification |
| `FREE-PSI-DIONYSUS` | Курс Мистерии Диониса | course | Греческие мистерии | needs verification |

## Verification policy

Do not invent direct course URLs. Update `courseUrl` only after verifying the actual course page from `psimaster.net` or another author-approved source.

When a direct URL is confirmed:

1. Set `courseUrl` to the exact URL.
2. Change `urlStatus` to `verified`.
3. Update this document.
4. Run `npm run check`.
