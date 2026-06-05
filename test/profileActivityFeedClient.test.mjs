import assert from "node:assert/strict";

import {
  ACTIVITY_FEED_TABS,
  activityTypeLabel,
  buildActivityEventDuplicatePath,
  buildPublicActivityEventsPath,
  buildSafeActivityEventPayload,
  feedActivityTypeForMaterial,
  isPublicSafeFeedImageUrl,
  normalizeActivityEvent
} from "../src/lib/profileActivityFeedClient.js";

assert.deepEqual(
  ACTIVITY_FEED_TABS.map((tab) => tab.label),
  ["Все", "Новости", "Мандалы", "Фото", "Услуги", "Практики"],
  "feed tabs should keep the RU MVP labels in order"
);

assert.equal(isPublicSafeFeedImageUrl("https://example.com/cover.jpg"), true);
assert.equal(isPublicSafeFeedImageUrl("http://example.com/cover.jpg"), true);
assert.equal(isPublicSafeFeedImageUrl("storage://profile-cabinet-media/profile/private.jpg"), false);
assert.equal(isPublicSafeFeedImageUrl("data:image/png;base64,abc"), false);
assert.equal(isPublicSafeFeedImageUrl("https://demo.supabase.co/storage/v1/object/sign/profile-cabinet-media/private.jpg?token=secret"), false);
assert.equal(isPublicSafeFeedImageUrl("https://demo.supabase.co/storage/v1/object/public/profile-cabinet-media/private.jpg"), false);

const normalized = normalizeActivityEvent({
  id: " event-1 ",
  profile_id: " profile-1 ",
  actor_user_id: " user-1 ",
  activity_type: "mandala_published",
  target_table: "profile_cabinet_publications",
  target_id: " target-1 ",
  title: " Золотая мандала ",
  body: " Описание ",
  image_url: "storage://profile-cabinet-media/profile/private.jpg",
  category: "reiki",
  subcategory: "level-1",
  tags: [" рэйки ", "", "мандала"],
  status: "approved",
  visibility: "public_feed",
  is_featured: true,
  event_at: "2026-06-05T12:00:00Z"
});

assert.equal(normalized.id, "event-1");
assert.equal(normalized.activityType, "mandala_published");
assert.equal(normalized.title, "Золотая мандала");
assert.equal(Object.hasOwn(normalized, "actorUserId"), false, "normalized public feed rows must not expose actorUserId");
assert.equal(normalized.imageUrl, "", "unsafe private image refs must be stripped from normalized feed rows");
assert.deepEqual(normalized.tags, ["рэйки", "мандала"]);
assert.equal(normalized.isFeatured, true);

assert.equal(activityTypeLabel("service_updated"), "Услуга обновлена");
assert.equal(activityTypeLabel("unknown"), "Событие");
assert.equal(feedActivityTypeForMaterial({ type: "mandala" }), "mandala_published");
assert.equal(feedActivityTypeForMaterial({ type: "artifact" }), "artifact_published");
assert.equal(feedActivityTypeForMaterial({ type: "practice" }), "practice_published");
assert.equal(feedActivityTypeForMaterial({ type: "photo" }), "");

assert.equal(
  buildPublicActivityEventsPath({ tab: "services", limit: 200 }),
  "/rest/v1/profile_cabinet_activity_events?status=eq.approved&visibility=eq.public_feed&select=id,profile_id,activity_type,target_table,target_id,title,body,image_url,category,subcategory,tags,status,visibility,is_featured,event_at,created_at,updated_at&order=event_at.desc&limit=60&activity_type=in.(service_created,service_updated)",
  "public feed query should clamp limit and filter service tab types"
);

assert.equal(
  buildActivityEventDuplicatePath({
    target_table: "profile_cabinet_publications",
    target_id: "target-1",
    activity_type: "mandala_published"
  }),
  "/rest/v1/profile_cabinet_activity_events?target_table=eq.profile_cabinet_publications&target_id=eq.target-1&activity_type=eq.mandala_published&status=in.(draft,pending,approved)&select=id,profile_id,activity_type,target_table,target_id,title,body,image_url,category,subcategory,tags,status,visibility,is_featured,event_at,created_at,updated_at&order=updated_at.desc&limit=1",
  "duplicate query should use target table, target id, activity type, and active statuses"
);

assert.deepEqual(
  buildSafeActivityEventPayload({
    profile_id: " profile-1 ",
    activity_type: "mandala_published",
    target_table: "profile_cabinet_publications",
    target_id: " target-1 ",
    title: " Мандала ",
    body: " Публичное описание ",
    image_url: "storage://profile-cabinet-media/private.jpg",
    category: " reiki ",
    tags: " мандала, рэйки, , тест ",
    status: "pending",
    visibility: "public_feed"
  }),
  {
    profile_id: "profile-1",
    activity_type: "mandala_published",
    target_table: "profile_cabinet_publications",
    target_id: "target-1",
    title: "Мандала",
    body: "Публичное описание",
    image_url: "",
    image_bucket: null,
    image_path: null,
    category: "reiki",
    subcategory: "",
    tags: ["мандала", "рэйки", "тест"],
    status: "pending",
    visibility: "public_feed",
    is_featured: false
  },
  "safe feed payload should strip private media refs and normalize public fields only"
);

assert.equal(
  buildPublicActivityEventsPath({ tab: "all", category: " dao ", profileId: " profile-1 ", limit: 12 }),
  "/rest/v1/profile_cabinet_activity_events?status=eq.approved&visibility=eq.public_feed&select=id,profile_id,activity_type,target_table,target_id,title,body,image_url,category,subcategory,tags,status,visibility,is_featured,event_at,created_at,updated_at&order=event_at.desc&limit=12&category=eq.dao&profile_id=eq.profile-1",
  "public feed query should include only approved public rows plus explicit safe filters"
);

console.log("profileActivityFeedClient: all assertions passed.");
