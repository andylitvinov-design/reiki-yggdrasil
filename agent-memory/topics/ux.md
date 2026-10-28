# ux memory

## 2026-06-28 — Verify real authenticated cabinet navigation

Type: ux_decision  
Memory type: semantic  
Scope: UX / authenticated profile navigation  
Priority: high  
Status: active  

Evidence:
- `https://github.com/andylitvinov-design/reiki-yggdrasil/issues/482`
- Courses functionality existed technically after #480 but was not visible in the real Profile Lite tabs.

Lesson:
For cabinet/profile features, user-visible navigation is part of the feature. Do not consider feature delivery complete until the real authenticated navigation exposes it.

Apply when:
- Adding or auditing profile/cabinet modules.
- Working on orders, photos, chats, profile, admin, courses, services, clients, or master cabinet features.

Check:
- Log in as a real authenticated user when possible.
- Verify visible Profile Lite tabs, not only direct URLs.
- Confirm the feature appears in the same navigation surface the user actually uses.

Failure if ignored:
- A module may exist as backend/schema/route but remain invisible in the user's cabinet.
