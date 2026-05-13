# Бесплатные видео и курсы psimaster.net

Source page: `https://psimaster.net/service?shs_term_node_tid_depth=12312`

Status: список собран по пользовательскому скриншоту. Прямые URL отдельных курсов и прямые video/embed URL пока не подтверждены, поэтому видеоокно временно открывает общую страницу списка материалов внутри правой панели. После проверки точных ссылок нужно заменить `courseUrl` / `embedUrl` в `src/data/freeCourseLinks.js`.

## UI placement

Материалы вынесены в отдельную правую вкладку `Бесплатные видео` публичного учебного интерфейса.

Внутри вкладки есть:

- видеоокно `iframe` для выбранного материала;
- подкатегории: `Все`, `Греция`, `Египет`, `Майя`, `Планеты`, `Защита`;
- список материалов внутри выбранной категории;
- кнопка открытия выбранного материала в новой вкладке.

Цель вкладки — дать ученику отдельную бесплатную библиотеку дополнительных материалов Академии без смешивания с упражнениями, мандалами и артефактами.

## Data source

Canonical UI-readable data: `src/data/freeCourseLinks.js`.

Each record uses:

- `id` — stable ID.
- `title` — learner-facing title from the screenshot.
- `type` / `typeLabel` — machine and public material type.
- `category` / `categoryLabel` — right-panel filter category.
- `tradition` — topic/tradition label for the card.
- `description` — short learner-facing description.
- `source` — `psimaster`.
- `sourcePageUrl` — verified source listing URL.
- `courseUrl` — direct course page URL, currently `null` until verified.
- `embedUrl` — direct embeddable video URL, currently `null` until verified.
- `urlStatus` — `needs verification` until direct URL is known.
- `recommendedPlacement` — suggested relation to Reiki Yggdrasil course sections.
- `notes` — verification note.

## Categories

| ID | Label |
| --- | --- |
| `all` | Все |
| `greek` | Греция |
| `egypt` | Египет |
| `maya` | Майя |
| `planets` | Планеты |
| `protection` | Защита |

## Records

| ID | Title | Type | Category | Direct URL status |
| --- | --- | --- | --- | --- |
| `FREE-PSI-DEMETRA` | Курс Греческие Мистерии. Канал Деметры. | course | greek | needs verification |
| `FREE-PSI-PLANETS` | Курс Сила Планет | course | planets | needs verification |
| `FREE-PSI-PROTECTION-MEDITATIONS` | Медитации Силы и Защиты | meditation | protection | needs verification |
| `FREE-PSI-MAYA-ARCHETYPES` | Архетипы Майя (видео) | video | maya | needs verification |
| `FREE-PSI-EGYPT-OSIRIS` | Курс Жречество Египта. Осирис | course | egypt | needs verification |
| `FREE-PSI-DIONYSUS` | Курс Мистерии Диониса | course | greek | needs verification |

## Verification policy

Do not invent direct course or video URLs. Update `courseUrl` and/or `embedUrl` only after verifying the actual course/video page from `psimaster.net` or another author-approved source.

When a direct URL is confirmed:

1. Set `courseUrl` to the exact course page URL.
2. Set `embedUrl` to an embeddable video URL when available and allowed.
3. Change `urlStatus` to `verified`.
4. Update this document.
5. Run `npm run check`.
