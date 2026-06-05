# Release workflow — черновой и чистовой сайт

Last updated: 2026-06-05

## Цель

Сайт должен иметь две живые версии:

1. **Черновая/test-версия** — для Андрея и проверки новых изменений.
2. **Чистовая/client live-версия** — стабильная версия для клиентов.

Главное правило: клиенты не должны видеть незавершённые изменения. Новый функционал сначала проходит проверку на черновом сайте и только потом выпускается в чистовую версию через релиз.

## Термины

### Черновой сайт

- Назначение: ежедневная разработка, проверка Codex-изменений, ручная QA-проверка владельцем.
- Ветка: `main`.
- Vercel project: `2mentalica`.
- Ожидаемый URL: `https://2mentalica.vercel.app`.
- Желательный URL `https://www.2mentalica.vercel.app` — `needs verification` в Vercel Domains.
- Данные: staging/test Supabase, тестовые пользователи, тестовые мандалы, тестовые фото.

### Чистовой сайт

- Назначение: стабильная версия для клиентов.
- Ветка: `production`.
- Vercel project: текущий клиентский production-проект.
- URL: текущий клиентский live-домен, `needs verification` перед переключением.
- Данные: production Supabase, реальные пользователи/клиенты.

## Базовая схема

```text
feature/*
  ↓ PR / merge
main
  ↓ auto-deploy
2mentalica.vercel.app
  ↓ owner QA
release/YYYY-MM-DD
  ↓ final QA
production
  ↓ auto-deploy
client live site
```

## Роли веток

### `main`

`main` — рабочая ветка и источник чернового сайта.

Разрешено:

- обычные задачи Codex;
- UI-фиксы;
- исправления кабинета;
- новые модули;
- проверка на `2mentalica`.

Не считать `main` клиентским production после внедрения этой схемы.

### `production`

`production` — стабильная ветка клиентского live-сайта.

Правила:

- не пушить напрямую;
- не использовать для ежедневной разработки;
- не менять без явной release-задачи;
- обновлять только после ручной проверки владельцем на черновом сайте.

### `release/*`

`release/*` — ветки подготовки релиза.

Примеры:

```text
release/2026-06-05
release/v1.8.0
release/power-place-fixes
```

Используются для:

- заморозки набора изменений;
- финальной QA-проверки;
- мелких release-blocking фиксов;
- подготовки записи в `LOG.md` / `STATE.md`, если нужно.

## Рабочий процесс разработки

1. Codex создаёт feature-ветку от `main` или работает в ветке, которая целится в `main`.
2. Изменения проходят локальные проверки.
3. Изменения попадают в `main`.
4. Vercel project `2mentalica` автоматически обновляет черновой сайт.
5. Андрей открывает `https://2mentalica.vercel.app` и проверяет функционал как обычный живой сайт.
6. Если всё хорошо, создаётся release-ветка.
7. Release-ветка проходит финальную проверку.
8. Release-ветка вливается в `production`.
9. Клиентский live-сайт обновляется.

## Команды релиза

Создать release-ветку от актуального `main`:

```bash
git checkout main
git pull origin main
git checkout -b release/YYYY-MM-DD
git push -u origin release/YYYY-MM-DD
```

Выпустить релиз в `production`:

```bash
git checkout production
git pull origin production
git merge release/YYYY-MM-DD
git push origin production
```

Если в release-ветке были дополнительные фиксы, вернуть их обратно в `main`:

```bash
git checkout main
git pull origin main
git merge release/YYYY-MM-DD
git push origin main
```

## Vercel setup

### Черновой проект

- Project name: `2mentalica`.
- Git repo: `andylitvinov-design/reiki-yggdrasil`.
- Production branch for this Vercel project: `main`.
- Expected URL: `https://2mentalica.vercel.app`.
- Optional desired URL: `https://www.2mentalica.vercel.app` — `needs verification`.

### Чистовой проект

- Existing client-facing Vercel project.
- Production branch: `production`.
- Existing client domain must be preserved.
- Existing rewrites from `vercel.json` must be preserved.

Do not change production domains or production project settings from code unless the owner explicitly asks for a release/deployment setup task.

## Supabase setup

Use separate Supabase environments when possible.

### Черновой Supabase

- Used by `2mentalica`.
- Contains only test data.
- Uses the same schema/migrations as production.
- Has test user(s), test mandalas, test photos.

### Чистовой Supabase

- Used by client live site.
- Contains real users and client data.
- Must not be used for destructive testing.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Never commit env values or secrets.

## Release QA checklist

Before merging a release into `production`, verify:

- `/`
- `/profile`
- `/masters`
- `/profile/admin`
- `/profile/mandalas`
- login/logout
- Google OAuth, if affected
- upload photo
- select saved photo
- inner background
- outer background
- save mandala
- update saved mandala
- saved mandala appears in `Мои мандалы`
- mobile layout
- desktop three-column layout
- no critical browser console errors
- `npm run build`
- `npm run check`, if time/resources allow

For Power Place / mandala tasks, additionally verify:

- all constructor formats still render;
- `Размер окон`, `Размер поля`, `Размер центра`, `Размер фоток` are visible when relevant;
- photo proportions are not distorted;
- saved compositions reopen with the expected values;
- Vercel routing still opens `/profile/mandalas` directly.

## Rollback

Preferred rollback: revert the release merge commit on `production`.

```bash
git checkout production
git pull origin production
git revert -m 1 <release_merge_commit_sha>
git push origin production
```

Emergency reset is allowed only with explicit owner approval:

```bash
git checkout production
git reset --hard <previous_good_commit_sha>
git push --force-with-lease origin production
```

Always record the previous good commit before release.

## Codex rules

Codex must follow this model:

- normal work targets `main`;
- `production` is not touched unless the owner explicitly asks for a release;
- production domains are not changed during normal development;
- production Supabase env values are not changed or exposed;
- release branches are used for client-facing releases;
- after a release-blocking fix in `release/*`, merge that fix back into `main`.

## Report format after release work

Every release task must report:

1. source branch;
2. release branch;
3. target production branch;
4. changed files;
5. checks run;
6. QA pages checked;
7. production URL checked;
8. risks;
9. what was not verified;
10. whether `STATE.md` / `LOG.md` need updates.
