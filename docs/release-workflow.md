# Release workflow — черновой и чистовой сайт

Last updated: 2026-06-05

## 1. Цель

Сайт должен иметь две живые версии:

1. **Черновая/test-версия** — для Андрея и проверки новых изменений.
2. **Чистовая/client live-версия** — стабильная версия для клиентов.

Главное правило: клиенты не должны видеть незавершённые изменения. Новый функционал сначала проходит проверку на черновом сайте и только потом выпускается в чистовую версию через релиз.

## 2. Короткая схема

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
  ↓ auto-deploy / fallback deploy if needed
client live site
```

## 3. Термины и роли

### Черновой сайт

- Назначение: ежедневная разработка, проверка Codex-изменений, ручная QA-проверка владельцем.
- Ветка: `main`.
- Vercel project: `2mentalica`.
- Ожидаемый URL: `https://2mentalica.vercel.app`.
- Желательный URL `https://www.2mentalica.vercel.app` — `needs verification` в Vercel Domains.
- Данные: staging/test Supabase, тестовые пользователи, тестовые мандалы, тестовые фото.
- Статус: target model, dashboard setup still `needs verification`.

### Чистовой сайт

- Назначение: стабильная версия для клиентов.
- Ветка: `production`.
- Vercel project: текущий клиентский production-проект.
- URL: текущий клиентский live-домен, `needs verification` перед переключением.
- Дополнительный client/live URL: `https://supermindnet.vercel.app` — added in Vercel and HTTP route QA passed; Supabase Auth redirects and Google OAuth still need dashboard verification.
- Данные: production Supabase, реальные пользователи/клиенты.
- Статус: target model, production branch/dashboard setup still `needs verification`.

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
- обновлять только после ручной проверки владельцем на черновом сайте;
- защищать через GitHub branch protection.

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

## 4. Важное переходное состояние

На момент создания этого документа текущий repo всё ещё имеет `main` как default branch. Dashboard-настройки Vercel/Supabase/GitHub branch protection не подтверждены из кода.

Пока production-branch migration не завершена, каждый deploy-related агент обязан явно различать:

```text
Documented target model != verified dashboard state
```

Нельзя утверждать, что `main` уже деплоится в `2mentalica`, а `production` уже деплоится клиентам, пока это не проверено в Vercel/GitHub.

## 5. Программа внедрения

### Phase 0 — зафиксировать текущее стабильное состояние

1. Найти текущий клиентский live URL.
2. Найти текущий Vercel project, который обслуживает клиентский live.
3. Найти SHA, который сейчас считается стабильным.
4. Проверить, что текущий live открывает:
   - `/`
   - `/profile`
   - `/masters`
   - `/profile/admin`
   - `/profile/mandalas`
5. Зафиксировать SHA как `previous_good_commit` в release-задаче или LOG.

### Phase 1 — создать ветку `production`

Сначала проверить, существует ли `production` на GitHub:

```bash
git ls-remote --heads origin production
```

Если команда ничего не выводит, `production` ещё не создана.

Не создавать `production` вслепую из текущего `main`. Сначала выбрать stable SHA: последний commit, который прошёл owner/live QA для клиентского сайта. Текущий `origin/main` может быть кандидатом только после такой проверки.

Точная команда создания после подтверждения stable SHA:

```bash
cd /Users/andriilitvinov/projects/MYPROJECTS/reiki-yggdrasil
git status --short
git branch --show-current
git worktree list
git fetch origin --prune
git ls-remote --heads origin production
git rev-parse <stable_sha>^{commit}
git branch production <stable_sha>
git push -u origin production
```

Если текущий `main` уже содержит непроверенные изменения, нельзя автоматически создавать `production` из него. Нужно выбрать последний стабильный SHA и создать `production` от него.

### Phase 2 — защитить `production` в GitHub

В GitHub Settings → Branches добавить rule для `production`:

```text
Require a pull request before merging
Block direct pushes if available
Block force pushes
Require status checks if available
Require conversation resolution if available
```

Правило: Codex не пушит напрямую в `production`.

### Phase 3 — создать Vercel project `2mentalica`

В Vercel:

```text
Add New Project
Import repo: andylitvinov-design/reiki-yggdrasil
Project name: 2mentalica
Production branch: main
Install command: npm install
Build command: npm run build
Output directory: dist
Framework: Vite
```

Ожидаемый результат:

```text
https://2mentalica.vercel.app
```

`https://www.2mentalica.vercel.app` — проверить отдельно в Domains. Пока статус: `needs verification`.

### Phase 4 — перевести клиентский Vercel project на `production`

В существующем клиентском Vercel project:

```text
Settings → Git → Production Branch → production
```

Нельзя менять клиентский домен без отдельной задачи и проверки.

После переключения проверить, что клиентский live продолжает открываться и не потерял auth redirects.

Dashboard steps:

```text
1. Open the existing client-facing Vercel project.
2. Confirm it is connected to repo andylitvinov-design/reiki-yggdrasil.
3. Preserve the existing production/client domains.
4. Settings → Git → Production Branch → production.
5. Confirm env names are present for the Production environment only:
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_ADMIN_EMAIL
6. Do not paste or expose env values.
7. Trigger/observe a deployment only from production after release approval.
```

### Phase 4a — добавить client/live domain `supermindnet`

Это dashboard/domain setup, не UI rewrite.

В существующем клиентском Vercel project:

```text
1. Open the intended client-facing Vercel project.
2. Confirm it is connected to repo andylitvinov-design/reiki-yggdrasil.
3. Confirm Production Branch is production if release workflow is active; otherwise mark needs verification.
4. Settings -> Domains -> confirm supermindnet.vercel.app is assigned to the client-facing project.
5. If Vercel rejects supermindnet.vercel.app as unavailable/reserved, record that exact result and stop. Do not invent a workaround.
6. Current known result from 2026-06-06: Vercel CLI added supermindnet.vercel.app to project reiki-yggdrasil, and HTTP route QA passed. Keep OAuth status needs verification until Supabase redirects and Google OAuth are checked.
7. Confirm Production env names exist, without printing values:
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_ADMIN_EMAIL
```

Supabase Auth redirect checklist:

```text
Add:
https://supermindnet.vercel.app/profile
https://supermindnet.vercel.app/profile/admin

Keep:
https://mentalica.vercel.app/profile
https://mentalica.vercel.app/profile/admin
https://reiki-yggdrasil.vercel.app/profile
https://reiki-yggdrasil.vercel.app/profile/admin
```

For `2mentalica` staging, keep staging references if OAuth is tested there:

```text
https://2mentalica.vercel.app/profile
https://2mentalica.vercel.app/profile/admin
```

Do not remove old redirect URLs during the migration window. Do not hardcode any domain in frontend code; OAuth redirects must continue using `window.location.origin`. Env values must not be printed, committed, or pasted into docs/logs.

### Phase 5 — настроить Supabase staging для `2mentalica`

Рекомендуется отдельный Supabase project:

```text
Production Supabase → client live
Staging Supabase → 2mentalica
```

В staging Supabase:

- создать отдельный staging project для `2mentalica`;
- применить актуальные migrations из `supabase/migrations/*` в порядке имён файлов;
- подтвердить, что private bucket `profile-cabinet-media` создан migration `20260527120000_profile_cabinet_media_storage.sql`;
- проверить RLS policies для profile/admin/publications, Power Place compositions, media storage, services/orders, and chat tables;
- создать тестового пользователя;
- создать тестового admin user/email и строку в `profile_cabinet_admins`;
- добавить OAuth redirect URLs для `2mentalica`, если Google OAuth нужен на черновом сайте:
  - `https://2mentalica.vercel.app/profile`
  - `https://2mentalica.vercel.app/profile/admin`
- не копировать реальные клиентские данные без отдельного решения.

Env names only:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
```

Значения никогда не коммитить.

### Phase 6 — проверить оба сайта

Проверить черновой сайт:

```text
https://2mentalica.vercel.app/
https://2mentalica.vercel.app/profile
https://2mentalica.vercel.app/masters
https://2mentalica.vercel.app/profile/admin
https://2mentalica.vercel.app/profile/mandalas
```

Проверить чистовой сайт:

```text
current client live /
current client live /profile
current client live /masters
current client live /profile/admin
current client live /profile/mandalas
```

For `supermindnet.vercel.app`, verify:

```text
https://supermindnet.vercel.app/
https://supermindnet.vercel.app/profile
https://supermindnet.vercel.app/masters
https://supermindnet.vercel.app/profile/admin
https://supermindnet.vercel.app/profile/mandalas
```

Also verify Google OAuth from `/profile` and `/profile/admin` on `supermindnet.vercel.app` after Supabase redirects are configured.

## 6. Рабочий процесс разработки

1. Codex создаёт feature-ветку от `main` или работает в ветке, которая целится в `main`.
2. Изменения проходят локальные проверки.
3. Изменения попадают в `main`.
4. Vercel project `2mentalica` автоматически обновляет черновой сайт.
5. Андрей открывает `https://2mentalica.vercel.app` и проверяет функционал как обычный живой сайт.
6. Если всё хорошо, создаётся release-ветка.
7. Release-ветка проходит финальную проверку.
8. Release-ветка вливается в `production`.
9. Клиентский live-сайт обновляется.

## 7. Команды релиза

Создать release-ветку от актуального `main`:

```bash
git checkout main
git pull origin main
git checkout -b release/YYYY-MM-DD
git push -u origin release/YYYY-MM-DD
```

Выпустить релиз в `production`:

```bash
gh pr create --base production --head release/YYYY-MM-DD --title "Release YYYY-MM-DD" --body "Release after owner QA on 2mentalica."
gh pr merge --merge --delete-branch
```

Если GitHub branch protection ещё не включён и нужен временный manual merge, это требует явного owner approval. Codex не должен использовать direct push в `production` как обычный путь.

Если в release-ветке были дополнительные фиксы, вернуть их обратно в `main`:

```bash
gh pr create --base main --head release/YYYY-MM-DD --title "Back-merge release YYYY-MM-DD into main" --body "Return release-blocking fixes to main."
gh pr merge --merge
```

## 8. Когда нужен release branch, а когда достаточно main

### Достаточно `main`

- рабочая проверка UI;
- черновой прототип;
- исправление, которое должен увидеть только Андрей;
- задача ещё не готова для клиентов.

### Нужен `release/*`

- функционал готов для клиентов;
- нужно зафиксировать стабильный набор изменений;
- были изменения Supabase/auth/storage;
- были изменения `/profile`, `/masters`, `/profile/admin`, `/profile/mandalas`;
- нужен rollback path.

### Нельзя сразу в `production`

- если не было owner QA на `2mentalica`;
- если неизвестно, какие env values использовались;
- если не проверены роуты;
- если есть console errors;
- если `npm run build` или релевантные тесты не проходили.

## 9. Release QA checklist

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

## 10. Vercel setup checklist

### Черновой project `2mentalica`

- [ ] Vercel project exists.
- [ ] Repo is `andylitvinov-design/reiki-yggdrasil`.
- [ ] Production branch is `main`.
- [ ] Build command is `npm run build`.
- [ ] Output directory is `dist`.
- [ ] URL `https://2mentalica.vercel.app` opens.
- [ ] Env names exist with staging values.
- [ ] Auth redirect URLs include `2mentalica` if OAuth is tested there.

### Чистовой client project

- [ ] Existing project identified.
- [ ] Existing client domain preserved.
- [x] Client/live domain `https://supermindnet.vercel.app` added to Vercel project `reiki-yggdrasil` on 2026-06-06.
- [ ] Production branch is `production`.
- [ ] Env names exist with production values.
- [ ] Rewrites from `vercel.json` are not broken.
- [ ] Fallback deploy uses `production`, not `main`.

## 11. Supabase setup checklist

### Staging Supabase

- [ ] Separate project exists, or shared-production exception is explicitly accepted.
- [ ] Migrations applied.
- [ ] Storage buckets created.
- [ ] RLS policies checked.
- [ ] Test user created.
- [ ] Test admin configured.
- [ ] Test media upload works.
- [ ] Test saved mandala flow works.
- [ ] No real client data is required.

### Production Supabase

- [ ] Production env values are not exposed.
- [ ] Production data is not used for destructive tests.
- [ ] Redirect URLs include client live domain.
- [ ] Redirect URLs include `https://supermindnet.vercel.app/profile` and `https://supermindnet.vercel.app/profile/admin` if the domain is added.
- [ ] Existing redirects are kept during migration window.

## 12. Rollback

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

## 13. Deploy fallback

Production fallback workflow:

```text
.github/workflows/deploy-production.yml
```

Under this release model, fallback production deploy normally uses:

```text
ref=production
```

Not:

```text
ref=main
```

Use `main` only if the production-branch migration is not implemented yet or the owner explicitly approves bypassing the release flow.

More details: `docs/deploy-fallback.md`.

## 14. Codex rules

Codex must follow this model:

- normal work targets `main`;
- `production` is not touched unless the owner explicitly asks for a release;
- production domains are not changed during normal development;
- production Supabase env values are not changed or exposed;
- release branches are used for client-facing releases;
- fallback production deploy normally uses `production`;
- after a release-blocking fix in `release/*`, merge that fix back into `main`.

## 15. Report format after release work

Every release task must report:

1. source branch;
2. release branch;
3. target production branch;
4. changed files;
5. checks run;
6. QA pages checked;
7. test site checked;
8. production URL checked;
9. risks;
10. what was not verified;
11. whether `STATE.md` / `LOG.md` need updates.

## 16. Known risks / needs verification

- Vercel project `2mentalica` — `needs verification`.
- URL `https://2mentalica.vercel.app` — `needs verification` until project exists.
- URL `https://www.2mentalica.vercel.app` — `needs verification`; may not be available as desired.
- Branch `production` — `needs verification` until created in GitHub.
- Client Vercel project production branch switch to `production` — `needs verification`.
- Client/live URL `https://supermindnet.vercel.app` — added in Vercel and HTTP route QA passed on 2026-06-06; OAuth still needs verification.
- Supabase Auth redirects for `https://supermindnet.vercel.app/profile` and `https://supermindnet.vercel.app/profile/admin` — `needs verification`.
- Separate staging Supabase — `needs verification`.
- GitHub branch protection for `production` — `needs verification`.
- Exact client live domain — `needs verification` before final migration.
