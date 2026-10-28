# Ezohata Mandala Store — техническое ТЗ

Дата: 2026-06-27
Проект: ezohata.com / каталог продаж мандал
Цель: превратить раздел мандал в удобный магазин-каталог, где каждая мандала является отдельным товаром/услугой, доступна для просмотра, добавления в избранное, корзину и оформления заказа.

---

## 1. Ключевая идея

Нужно сделать не просто страницу с текстовыми описаниями, а полноценный каталог-магазин мандал:

- мандалы отсортированы по категориям и подкатегориям;
- структура берется из Excel-документа с описаниями мандал;
- каждая мандала хранится как отдельный товар/услуга;
- администратор может добавлять и редактировать мандалы через админку;
- фото реальной мандалы загружается в админке, но публично показывается только в защищенном preview: размытое примерно на 50%, с водяным знаком/оверлеем;
- пользователь может смотреть каталог двумя режимами: карточки в 2 колонки и горизонтальный список;
- пользователь может добавить мандалу в избранное или корзину;
- корзина должна поддерживать редактирование, удаление, «отложить на потом» и рекомендации похожих мандал.

---

## 2. Источник данных: Excel

Сейчас структура и описания мандал находятся в Excel-документе.

Нужно реализовать импорт из Excel и перенести данные в базу.

### 2.1. Ожидаемые колонки Excel

Если текущий Excel отличается, адаптировать импортер под фактические колонки, но в базе привести данные к такой структуре:

| Поле | Назначение |
| --- | --- |
| category | Основная категория |
| subcategory | Подкатегория |
| title | Название мандалы |
| slug | URL-идентификатор, можно генерировать автоматически |
| short_description | Краткое описание для карточки |
| full_description | Полное описание для раскрытия/страницы товара |
| price | Цена |
| currency | Валюта |
| tags | Темы через запятую: деньги, здоровье, защита, стресс и т.п. |
| status | published / draft / hidden |
| sort_order | Ручной порядок сортировки |
| image_file / image_url | Фото мандалы, если есть |

### 2.2. Требования к импорту

Импорт должен:

- читать `.xlsx` / `.xls`;
- создавать категории;
- создавать подкатегории;
- создавать товары-мандалы;
- не плодить дубликаты при повторном импорте;
- обновлять существующие записи по `slug`, `external_id` или нормализованному `title + category`;
- логировать строки с ошибками;
- показывать админу отчет: сколько создано, сколько обновлено, сколько пропущено, сколько ошибок.

### 2.3. Страница импорта

Админский путь:

```txt
/admin/mandalas/import
```

На странице:

- upload Excel-файла;
- preview первых 20 строк;
- кнопка «Проверить файл»;
- кнопка «Импортировать»;
- результат импорта.

---

## 3. Категории и навигация

### 3.1. Публичная структура страницы

Основная страница:

```txt
/mandalas
```

Структура сверху вниз:

1. Header сайта.
2. Горизонтальная панель основных категорий.
3. Горизонтальная панель подкатегорий выбранной категории.
4. Основная зона каталога.
5. Правая колонка со статьями и навигацией.

### 3.2. Основные категории

Фактические категории нужно взять из Excel.

Минимальный ориентир:

- Мандалы;
- Чистка стрессов и комплексов;
- Магические мандалы;
- Деньги / бизнес;
- Здоровье;
- Защита;
- Привлекательность / молодость;
- Развитие навыков;
- Дополнительная энергия;
- Подарочные / бесплатные;
- Другое.

Также учесть текущую структуру ezohata.com, где уже встречаются:

- Мандалы привлекательности;
- Бизнес-Мандалы;
- Магические Мандалы;
- Мандалы: Общее описание;
- Мандалы — Дополнительная энергия;
- Мандалы развития навыков;
- Мандалы — Системы защиты;
- Мандалы для здоровья;
- Подарок — Мандала от Коронавируса.

---

## 4. База данных

Если проект использует Supabase/Postgres, добавить миграции.

### 4.1. Таблица `mandala_categories`

```sql
create table if not exists public.mandala_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.2. Таблица `mandala_subcategories`

```sql
create table if not exists public.mandala_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.mandala_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, slug)
);
```

### 4.3. Таблица `mandala_products`

```sql
create table if not exists public.mandala_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.mandala_categories(id) on delete set null,
  subcategory_id uuid references public.mandala_subcategories(id) on delete set null,
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  tags text[] not null default '{}',
  original_image_path text,
  preview_image_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'archived')),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  external_source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.4. Таблица `mandala_favorites`

```sql
create table if not exists public.mandala_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.mandala_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
```

### 4.5. Таблица `mandala_cart_items`

```sql
create table if not exists public.mandala_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  product_id uuid not null references public.mandala_products(id) on delete cascade,
  quantity integer not null default 1,
  status text not null default 'active' check (status in ('active', 'saved_for_later', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_owner_check check (user_id is not null or session_id is not null)
);
```

### 4.6. Таблица `mandala_orders`

```sql
create table if not exists public.mandala_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_email text,
  customer_name text,
  customer_phone text,
  status text not null default 'new' check (status in ('new', 'paid', 'processing', 'completed', 'cancelled')),
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.7. Таблица `mandala_order_items`

```sql
create table if not exists public.mandala_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.mandala_orders(id) on delete cascade,
  product_id uuid references public.mandala_products(id) on delete set null,
  title_snapshot text not null,
  price_snapshot numeric(12,2) not null,
  currency_snapshot text not null default 'EUR',
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);
```

---

## 5. Storage и защита изображений

Ключевое требование: реальная мандала не должна публично утекать в оригинальном виде.

### 5.1. Storage buckets

Создать два bucket:

```txt
mandalas-originals
mandalas-previews
```

`mandalas-originals`:

- private;
- доступ только админу;
- хранит оригиналы.

`mandalas-previews`:

- public или signed URL;
- хранит только размытые preview;
- используется в каталоге.

### 5.2. Генерация preview

При загрузке оригинала:

1. сохранить оригинал в `mandalas-originals`;
2. сгенерировать preview:
   - resize до безопасного размера, например 900px по ширине;
   - blur примерно 50%;
   - overlay 35–50%;
   - watermark `ezohata.com` или полупрозрачный паттерн;
3. сохранить preview в `mandalas-previews`;
4. в `mandala_products.preview_image_path` записать путь preview;
5. в `mandala_products.original_image_path` записать путь оригинала.

Важно: публичный frontend не должен знать и получать `original_image_path`.

---

## 6. RLS / безопасность

Если Supabase:

### 6.1. Публичное чтение

Обычный пользователь может читать только:

- опубликованные категории;
- опубликованные подкатегории;
- опубликованные мандалы;
- только `preview_image_path`, без оригинала.

### 6.2. Админ

Админ может:

- читать все товары;
- видеть черновики;
- загружать изображения;
- видеть оригиналы;
- создавать/редактировать/архивировать мандалы;
- импортировать Excel.

### 6.3. Избранное и корзина

Пользователь может видеть и менять только свои записи.

Для гостей использовать `session_id` в localStorage/cookie и синхронизировать при логине.

---

## 7. Публичные страницы

### 7.1. Каталог

```txt
/mandalas
```

Функции:

- загрузка категорий;
- загрузка подкатегорий;
- фильтрация по категории и подкатегории;
- поиск;
- сортировка;
- переключение вида: cards/list;
- добавление в избранное;
- добавление в корзину;
- раскрытие описания;
- правая колонка статей.

### 7.2. Страница мандалы

```txt
/mandalas/:slug
```

На странице:

- preview-изображение;
- название;
- категория/подкатегория;
- краткое описание;
- полное описание;
- цена;
- кнопки «В избранное», «В корзину»/«Заказать»;
- связанные мандалы;
- блок статей по теме.

### 7.3. Корзина

```txt
/cart
```

На странице:

- активные товары;
- цена по каждому товару;
- итоговая сумма;
- удалить;
- отложить;
- блок `saved_for_later`;
- рекомендации по тегам;
- кнопка оформления заказа.

### 7.4. Избранное

```txt
/favorites
```

На странице:

- список избранных мандал;
- добавить в корзину;
- удалить из избранного.

---

## 8. Админские страницы

### 8.1. Список мандал

```txt
/admin/mandalas
```

Функции:

- таблица мандал;
- фильтр по статусу;
- фильтр по категории;
- поиск;
- быстрые действия: publish/hide/archive;
- ссылка редактирования.

### 8.2. Создание

```txt
/admin/mandalas/new
```

Поля:

- title;
- slug;
- category;
- subcategory;
- short_description;
- full_description;
- price;
- currency;
- tags;
- upload image;
- status;
- sort_order;
- is_featured.

### 8.3. Редактирование

```txt
/admin/mandalas/:id/edit
```

То же, плюс:

- просмотр оригинала для админа;
- просмотр публичного preview;
- кнопка регенерации preview.

### 8.4. Импорт Excel

```txt
/admin/mandalas/import
```

Функции описаны в разделе импорта.

---

## 9. UI каталога

### 9.1. Режим карточек

Вариант А: карточки в две колонки.

Desktop:

- сетка 2 колонки;
- карточка с мягкой тенью;
- изображение сверху;
- название;
- краткое описание;
- цена;
- кнопки.

Mobile:

- 1 колонка;
- кнопки на всю ширину или крупные;
- короткое описание ограничено по высоте.

Состояния кнопки корзины:

- если товара нет в корзине: `В корзину`;
- если товар уже в корзине: `Заказать`;
- `Заказать` ведет в `/cart`.

### 9.2. Режим горизонтального списка

Вариант Б:

- изображение слева;
- справа название, описание, цена, кнопки;
- удобно для просмотра длинного каталога;
- на мобильном превращается в обычную вертикальную карточку.

### 9.3. Описание

На карточке:

- показывать `short_description`;
- если есть `full_description`, добавить `Показать больше`;
- после раскрытия показывать расширенный текст;
- не ломать сетку.

---

## 10. Правая навигация / статьи

На desktop справа должна быть колонка:

- Как правильно выбрать мандалу;
- Как работают мандалы;
- Мандалы для денег;
- Мандалы для здоровья;
- Мандалы защиты;
- Как заказать персональную мандалу;
- статьи ezohata.com про мандалы.

На mobile:

- переносить ниже каталога;
- или сворачивать в блок «Полезные статьи».

Если статьи уже есть в проекте — подтянуть реальные.
Если нет — сделать структуру/заготовку.

---

## 11. Корзина

Корзина должна быть не примитивной, а как у маркетплейса.

### 11.1. Активная корзина

Для каждого товара:

- preview;
- название;
- краткое описание;
- цена;
- удалить;
- отложить на потом;
- перейти к товару.

### 11.2. Отложенные товары

Блок:

```txt
Отложено на потом
```

Для каждого товара:

- вернуть в корзину;
- удалить;
- перейти к товару.

### 11.3. Рекомендации

Блок внизу:

```txt
Добавить еще одну мандалу по вашей теме
```

Алгоритм:

1. собрать теги активных товаров корзины;
2. найти опубликованные мандалы с пересечением тегов;
3. исключить уже добавленные;
4. отсортировать по количеству совпадений тегов, `is_featured`, `sort_order`;
5. показать 3–6 товаров.

Пример:

- в корзине деньги → рекомендовать деньги/бизнес;
- здоровье → здоровье/энергия;
- защита → защитные;
- стресс/комплексы → чистка стрессов и комплексов;
- несколько тем → смешанные рекомендации.

---

## 12. Дизайн

Дизайн должен быть близок к ezohata.com, но лучше:

- мягкий эзотерический стиль;
- премиальное ощущение;
- теплые золотистые, песочные, темно-синие/фиолетовые или глубокие нейтральные акценты;
- аккуратные карточки;
- много воздуха;
- современная типографика;
- без перегруза;
- без дешевого «магического» визуального шума;
- каталог должен выглядеть как магазин услуг/артефактов, а не как старая текстовая страница.

Ключевой стиль:

- древние традиции;
- мандалы;
- мягкая магическая эстетика;
- доверие;
- чистота;
- удобство заказа.

---

## 13. API / frontend hooks

Реализовать или адаптировать функции:

```ts
getMandalaCategories()
getMandalaSubcategories(categorySlug?: string)
getMandalaProducts(filters)
getMandalaProductBySlug(slug)
addMandalaToFavorites(productId)
removeMandalaFromFavorites(productId)
getMandalaFavorites()
addMandalaToCart(productId)
removeMandalaFromCart(itemId)
saveMandalaForLater(itemId)
moveMandalaBackToCart(itemId)
getMandalaCart()
getMandalaRecommendations(cartItems)
createMandalaOrder(payload)
```

---

## 14. Компоненты

Ожидаемые компоненты:

```txt
MandalaCatalogPage
MandalaCategoryTabs
MandalaSubcategoryTabs
MandalaSearchBar
MandalaFilters
MandalaViewToggle
MandalaCard
MandalaHorizontalItem
MandalaDescriptionToggle
MandalaFavoriteButton
MandalaCartButton
MandalaArticlesSidebar
MandalaProductPage
MandalaCartPage
MandalaCartItem
MandalaSavedForLater
MandalaRecommendations
AdminMandalaListPage
AdminMandalaForm
AdminMandalaImageUploader
AdminMandalaImportPage
```

---

## 15. UX-сценарии для проверки

### Сценарий 1: каталог

1. Открыть `/mandalas`.
2. Увидеть категории.
3. Выбрать категорию «Деньги».
4. Увидеть подкатегории.
5. Увидеть список мандал.
6. Добавить товар в корзину.
7. Убедиться, что кнопка стала «Заказать».

### Сценарий 2: режимы просмотра

1. Открыть каталог.
2. Включить режим карточек.
3. Проверить 2 колонки на desktop.
4. Включить горизонтальный список.
5. Проверить, что фильтры и категория сохранились.

### Сценарий 3: описание

1. Открыть карточку с длинным описанием.
2. Нажать «Показать больше».
3. Убедиться, что текст раскрылся аккуратно.

### Сценарий 4: админка

1. Зайти как админ.
2. Открыть `/admin/mandalas/new`.
3. Создать мандалу.
4. Загрузить оригинал.
5. Проверить, что админ видит оригинал.
6. Проверить, что публичный пользователь видит только blur-preview.

### Сценарий 5: корзина

1. Добавить 2 мандалы в корзину.
2. Открыть `/cart`.
3. Проверить цены и итог.
4. Отложить один товар.
5. Вернуть товар обратно.
6. Проверить рекомендации.

---

## 16. Definition of Done

Задача считается завершенной, когда:

- данные мандал можно импортировать из Excel;
- категории и подкатегории отображаются горизонтальными строками;
- каталог работает в двух режимах: карточки и горизонтальный список;
- каждая мандала является отдельным товаром/услугой;
- у каждой мандалы есть отдельная страница;
- есть избранное;
- есть корзина;
- в корзине есть удалить/отложить/вернуть;
- есть рекомендации по тегам;
- админ может создать/редактировать мандалу;
- админ может загрузить оригинальное фото;
- публично показывается только размытое preview;
- оригинал не доступен обычному пользователю;
- дизайн адаптивен;
- мобильный вид проверен;
- нет ошибок в консоли;
- проходят lint/typecheck/build, если они настроены;
- есть краткий отчет по измененным файлам и проверкам.

---

## 17. Команды проверки

Перед финальным отчетом выполнить доступные команды проекта:

```bash
npm run lint
npm run typecheck
npm run build
```

Если каких-то команд нет — указать это в отчете.

Также проверить вручную:

```txt
/mandalas
/mandalas/:slug
/cart
/favorites
/admin/mandalas
/admin/mandalas/new
/admin/mandalas/import
```

---

## 18. Важные замечания

1. Не делать просто статичную страницу.
2. Не хранить все мандалы hardcoded в JSX.
3. Не показывать оригинальные фото публично.
4. Не делать только CSS blur поверх оригинала — это небезопасно.
5. Не ломать текущую корзину/заказы, если они уже есть в проекте.
6. Если уже есть общая модель services/products — лучше переиспользовать ее, добавив тип `mandala`, а не дублировать логику без необходимости.
7. Если текущая архитектура проекта отличается от предложенной, сохранить смысл требований, но встроить реализацию в существующий стиль проекта.
