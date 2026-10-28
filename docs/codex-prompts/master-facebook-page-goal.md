# Codex Goal Prompt — Facebook-like Master Page

Copy this whole prompt into Codex.

```text
/goal
Repo: andylitvinov-design/reiki-yggdrasil
Target branch: main. Do not push to production.

Goal:
Implement the first visible MVP of a public Master Page that looks and feels like a calm Facebook page for a Reiki Yggdrasil/Mentalica master. The result I want to visually check: I open a master page and see a Facebook-like practitioner page with header/profile info, composer-like/publication area or post list, cards for notes/articles/mandalas/services, and a news-feed feeling.

Before coding, read and follow:
- AGENTS.md
- README.md
- STATE.md
- LOG.md
- docs/product/MASTER_CABINET_PLATFORM_STRUCTURE.md
- docs/product/COMMUNITY_FEED_CONCEPT.md
- docs/concepts/master-feed-grimoire.md
- docs/PROFILE_SERVICES_ROADMAP.md
- package.json
- vercel.json
- src/main.jsx
- src/App.jsx
- src/index.css
- src/pages/MastersPage.jsx
- src/pages/ProfilePage.jsx
- src/pages/ProfileLitePage.jsx if present
- src/pages/FeedPage.jsx if present
- src/lib/supabaseClient.js
- src/lib/profileServicesClient.js
- src/lib/profileMaterialsClient.js
- src/lib/profileMediaClient.js
- relevant supabase/migrations/*

Product model:
- Public Master Page = Facebook-like page of one master.
- Master publishes notes, articles, mandalas, settings, services and public-safe materials.
- All public-safe master publications can later become the community/home news feed.
- /profile + Grimoire are private backstage for sorting posts/materials into workshop materials/services/courses.
- Do not implement full social network now. No likes/comments/follows unless already trivial placeholders.

Minimum implementation:
1. Inspect current routing and MastersPage. Determine if there is a master detail route. If not, add the safest route, e.g. /masters/:id or another pattern consistent with current RootRouter.
2. Create/add a public Master Page UI with:
   - cover/header area;
   - avatar/fallback;
   - master name, role, short bio;
   - action buttons: Мой кабинет, Каталог мастеров, Услуги/Записаться if safe;
   - tabs/filters: Все, Заметки, Статьи, Мандалы, Услуги, Материалы;
   - post/feed cards similar to Facebook page cards, but calm ritual/academy style.
3. Use existing real data if safe: profile_cabinet_profiles, profile_cabinet_publications, profile_cabinet_services. If data/schema is not enough, use safe demo/empty-state cards clearly isolated as fallback, not fake persisted records.
4. Add/adjust a small feed preview on the home page only if it can be done without breaking current design. If too risky, report it as next step.
5. Keep public cards public-safe only. Do not expose storage://, signed URLs, object_refs, private media, client photos, private reports, private Grimoire notes or composition JSON.
6. Keep RU-default interface.
7. Preserve routes: /, /profile, /profile/mandalas, /profile/services, /masters, /profile/admin.
8. Preserve Vercel rewrites and current auth/data flows.
9. Do not add risky Supabase migrations unless absolutely necessary. Prefer UI + existing data first.

Suggested files, adapt after repo inspection:
- src/pages/MasterPublicPage.jsx
- src/pages/masters/MasterPageHeader.jsx
- src/pages/masters/MasterPageFeed.jsx
- src/pages/masters/MasterPagePostCard.jsx
- src/components/HomeCommunityFeed.jsx only if home preview is safe
- src/lib/profilePublicationsClient.js only if existing clients do not cover it
- src/main.jsx for route wiring
- vercel.json for route rewrite if needed
- scoped CSS in src/index.css or existing CSS file with masterPage* prefixes.

Design acceptance:
- The page should visually read as a Facebook-like master page: cover, profile identity, tabs, central feed, publication cards.
- It must be beautiful, calm, Russian-first, not an admin table.
- Desktop should be clean and spacious; mobile should not overflow.

Checks:
- npm install if needed
- npm run check
- npm run build
- run available tests for profile/masters/feed/services.

Manual QA:
- / opens
- /masters opens
- a master page route opens and visually looks like a Facebook-like page
- /profile opens
- /profile/services opens
- /profile/admin opens
- mobile below 980px has no horizontal overflow
- public DOM/text contains no private refs or signed URLs.

Report:
- files read
- route chosen for Master Page
- files changed
- what data is real vs fallback
- checks run
- what was not verified
- risks
- next step for Grimoire/workshop integration.
```
