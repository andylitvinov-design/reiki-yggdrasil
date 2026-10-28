# mistakes.md

## 2026-06-28 — Courses feature missed real authenticated navigation

Type: mistake  
Memory type: episodic  
Scope: UX / delivery / authenticated profile navigation  
Priority: high  
Status: active  

User signal:
> Live authenticated UI at `https://2mentalica.vercel.app/profile/orders` for `andy.litvinov@gmail.com` showed Profile Lite tabs: “Мои заказы / Мои фото / Чаты / Профиль / Админ”, but not “Мои курсы”.

Evidence:
- Follow-up issue: `https://github.com/andylitvinov-design/reiki-yggdrasil/issues/482`
- Earlier issue #480 implemented courses backend/schema/RLS technically, but the feature was not visible in the real authenticated personal cabinet navigation.

Lesson:
Cabinet feature work is incomplete if it only supports backend/schema/deep-link routes but is missing from the real authenticated navigation visible to the user.

Apply when:
- Implementing any profile/cabinet feature.
- Verifying `/delivery` for authenticated UI.
- Auditing features that have both backend data and visible user navigation.

Check:
- Verify the actual authenticated navigation seen by the user, not only route availability or deep links.
- For profile/cabinet work, check visible tabs from `/profile/orders`, `/profile/photos`, `/profile/chats`, `/profile/profile`, `/profile/admin`, and `/profile/courses` when courses module exists.

Failure if ignored:
- A feature may be technically implemented but invisible to the user, causing a false `STATUS: SUCCESS`.

Required follow-up:
- Add “Мои курсы” tab and route `/profile/courses` to the real Profile Lite personal navigation.
- After implementation, update `STATE.md` and `LOG.md` with the root cause and verification rule.
