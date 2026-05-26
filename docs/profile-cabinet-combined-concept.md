# Profile Cabinet Combined Concept

Дата: 2026-05-26
Проект: Reiki Yggdrasil
Страница: `/profile`
Статус: design concept / implementation brief

## Цель

Совместить два удачных направления кабинета мастера:

1. **PR #45 как базовый дизайн** — тёплая `Мастерская мандал`: загрузка мандалы, выбор ступени Reiki Yggdrasil, выбор настройки, создание материала, статусы и галерея `Мои мандалы и материалы`.
2. **PR #48–49 как отдельный модуль** — `Место силы`: конструктор мандалы/алтаря/бизнес/ДАО, но показать его как правую переключаемую панель в стиле отдельного atelier-инспектора.

Важно: `Мастерская мандал` и `Место силы` не должны заменять друг друга. Это два разных пользовательских сценария в одном кабинете.

## Исторический контекст

- PR #43: базовое создание материалов в `/profile` для `mandala / artifact / practice`, привязанных к Reiki step/settings.
- PR #45: красивый redesign зоны материалов в `Мастерская мандал` с hero, настройкой потока, алтарём, загрузкой фото, формой материала и галереей сохранённых материалов.
- PR #48: добавил Power Place mandala constructor.
- PR #49: добавил altar mode и 12-position power place layout.
- PR #52/#53: добавили persistence и форматы Business/DAO для Power Place.

## Базовый макет A — PR #45 / Мастерская мандал

Это основной вид кабинета по умолчанию.

Структура:

```text
Кабинет мастера
└─ Мастерская мандал
   ├─ hero/status: Черновики / На модерации / Опубликовано
   ├─ Настройка потока
   │  ├─ Ступень Reiki
   │  └─ Настройка ступени
   ├─ Алтарь мандалы
   │  ├─ preview mandala
   │  ├─ Загрузить фото мандалы
   │  ├─ drag/drop or file input
   │  └─ URL fallback
   ├─ Создание материала
   │  ├─ Мандала / Артефакт / Практика
   │  ├─ Название
   │  ├─ Описание / инструкция
   │  ├─ URL изображения
   │  ├─ Сохранить черновик
   │  └─ Отправить на модерацию
   └─ Мои мандалы и материалы
      ├─ cards gallery
      ├─ image preview
      ├─ type
      ├─ step_id
      ├─ setting_title
      └─ status badge
```

Что сохранить:

- RU-first тексты.
- Связь с `profile_cabinet_publications`.
- `draft / pending / approved` статусы.
- Выбор Reiki step/settings.
- Локальный preview загруженного изображения.
- URL fallback.
- Галерею сохранённых материалов.

## Базовый макет B — Power Place / Место силы

Это не замена мастерской, а правая переключаемая панель.

Визуальная структура по предложенному mockup:

```text
Правая панель
└─ Место силы
   ├─ tabs: Мандала / Алтарь / Бизнес / ДАО / Зодиак
   ├─ large dark mandala preview
   ├─ 12 visible positions around center
   ├─ right mini rail: Подложка места силы
   │  ├─ cover thumbnails
   │  ├─ selected cover
   │  └─ simple arrow/step controls
   ├─ Видимые позиции: 2 / 4 / 6 / 8 / 12
   └─ mode chips:
      ├─ Фото клиента
      ├─ Фото + мандала
      └─ Ресурс без / с мандалой
```

Что сохранить:

- Текущий функционал PR #48–49 и последующих PR: constructor type, geometry, object images, cover, saved compositions, print, resource comparison.
- Существующие handlers/state в `ProfilePage.jsx`.
- Существующие Supabase/data flows.

`Зодиак` можно оставить UI-placeholder, если нет backend-схемы. Не добавлять fake persistence.

## Итоговая архитектура `/profile`

Нужны два независимых переключателя:

### 1. Переключатель рабочей зоны слева/по центру

```text
[Загрузить мандалу] [Чаты]
```

- `Загрузить мандалу`: показывает PR #45 workflow.
- `Чаты`: показывает mockup-style центр действия/чат placeholder без fake backend persistence.

### 2. Переключатель правой панели

```text
[Мои мандалы и материалы] [Место силы]
```

- `Мои мандалы и материалы`: показывает PR #45 gallery.
- `Место силы`: показывает Power Place constructor в стиле mockup.

## Рекомендуемая desktop-композиция

```text
┌──────────────────────────────────────────────────────────────┐
│ Dark hero: Кабинет мастера / Мастерская мандал · Места силы  │
├───────────────┬───────────────────────────┬──────────────────┤
│ LEFT          │ CENTER                    │ RIGHT            │
│               │                           │                  │
│ Work mode     │ If mandala-upload:        │ Switch:          │
│ Mandalas/Chat │ - Flow tuning             │ Materials/Power  │
│               │ - Altar upload            │                  │
│ Quick photos  │ - Material form           │ If materials:    │
│ Mandala list  │                           │ - gallery cards  │
│ Categories    │ If chat:                  │                  │
│               │ - Center action/chat      │ If power-place:  │
│               │                           │ - constructor    │
└───────────────┴───────────────────────────┴──────────────────┘
```

Suggested desktop grid:

```css
grid-template-columns: 320px minmax(420px, 1fr) minmax(420px, 0.95fr);
gap: 18px;
max-width: 1500px;
```

At `<=1180px`, collapse right panel below center. On mobile, single column.

## Левая часть

### В режиме `Загрузить мандалу`

Добавить/сохранить самое левое поле просмотра мандал:

- Все
- Мандалы
- Артефакты
- Практики
- Черновики
- На модерации
- Опубликовано
- optional grouping by Reiki level/step if simple

Показывать quick previews из existing `materials`.

### В режиме `Чаты`

Показывать mockup-style:

- Рабочий режим
- Мандалы / Чаты switch
- Места силы
- Фото клиентов
- Мистерии
- Галерея
- Быстрые фото / мандалы: Клиент / Цель / Вода / Огонь

Чат пока может быть static placeholder. Не добавлять persistence без отдельной задачи.

## Правая часть

### `Мои мандалы и материалы`

Gallery cards:

- image preview
- title
- type label
- step_id
- setting_title
- status badge
- sort: Сначала новые
- empty state

### `Место силы`

Restyle existing constructor:

- compact tabs
- large dark preview
- right substrate/cover rail
- visible positions chips
- compact object controls
- keep save/update/print logic

## Не менять

- Supabase auth/data flows.
- Routes: `/`, `/profile`, `/masters`, `/profile/admin`.
- Vercel rewrites.
- Home page.
- Admin moderation logic.
- Public masters visibility rules.
- Database table names.
- Env values/secrets.

Env names only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

## Качество и проверки

Run:

```bash
npm ci
npm run check
npm run build
```

Manual QA:

- `/` works.
- `/profile` logged-out works.
- `/profile` logged-in works.
- `Загрузить мандалу` shows PR #45 workflow.
- Left mandala browser exists in mandala mode.
- `Чаты` mode shows placeholder, not fake persistence.
- Right panel switches `Мои мандалы и материалы` / `Место силы`.
- Gallery uses real `materials`.
- Save draft works.
- Submit moderation works.
- Image upload preview works.
- Image URL preview works.
- Reiki step selector updates settings.
- Power Place constructor still works.
- `/masters` does not show draft/pending.
- `/profile/admin` works.
- 1280/1366/1440 desktop: no horizontal overflow.
- 390 mobile: stacked and readable.

## Risks

- Большой JSX в `ProfilePage.jsx`; лучше не переписывать бизнес-логику.
- Power Place и Materials используют разные состояния; не смешивать их.
- `Зодиак` может быть только UI-placeholder, если нет schema support.
- Live Supabase verification может быть blocked без env/session.

## Suggested implementation approach

1. Add local UI state:

```js
const [activeWorkMode, setActiveWorkMode] = useState("mandala-upload");
const [activeRightPanel, setActiveRightPanel] = useState("materials");
```

2. Split render into clearly named sections inside the same component or small local render helpers:

- `renderCabinetSidebar()`
- `renderMandalaUploadWorkspace()`
- `renderChatWorkspace()`
- `renderMaterialsGalleryPanel()`
- `renderPowerPlacePanel()`

3. Move existing JSX blocks; do not rewrite handlers.

4. Add CSS classes for combined dashboard layout.

5. Keep PR #45 as default visible experience.
