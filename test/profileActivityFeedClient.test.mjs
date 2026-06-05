import assert from "node:assert/strict";

import {
  ACTIVITY_FEED_TABS,
  activityTypeLabel,
  buildPublicActivityEventsPath,
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
assert.equal(normalized.imageUrl, "", "unsafe private image refs must be stripped from normalized feed rows");
assert.deepEqual(normalized.tags, ["рэйки", "мандала"]);
assert.equal(normalized.isFeatured, true);

assert.equal(activityTypeLabel("service_updated"), "Услуга обновлена");
assert.equal(activityTypeLabel("unknown"), "Событие");

assert.equal(
  buildPublicActivityEventsPath({ tab: "services", limit: 200 }),
  "/rest/v1/profile_cabinet_activity_events?status=eq.approved&visibility=eq.public_feed&select=id,profile_id,actor_user_id,activity_type,target_table,target_id,title,body,image_url,category,subcategory,tags,status,visibility,is_featured,event_at,created_at,updated_at&order=event_at.desc&limit=60&activity_type=in.(service_created,service_updated)",
  "public feed query should clamp limit and filter service tab types"
);

assert.equal(
  buildPublicActivityEventsPath({ tab: "all", category: " dao ", profileId: " profile-1 ", limit: 12 }),
  "/rest/v1/profile_cabinet_activity_events?status=eq.approved&visibility=eq.public_feed&select=id,profile_id,actor_user_id,activity_type,target_table,target_id,title,body,image_url,category,subcategory,tags,status,visibility,is_featured,event_at,created_at,updated_at&order=event_at.desc&limit=12&category=eq.dao&profile_id=eq.profile-1",
  "public feed query should include only approved public rows plus explicit safe filters"
);

console.log("profileActivityFeedClient: all assertions passed.");
