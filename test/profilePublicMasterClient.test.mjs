import assert from "node:assert/strict";

import {
  MASTER_PAGE_TABS,
  buildApprovedMasterProfilePath,
  buildPublicMasterPublicationsPath,
  buildPublicMasterServicesPath,
  normalizePublicMasterProfile,
  normalizePublicMasterPublication,
  normalizePublicMasterService
} from "../src/lib/profilePublicMasterClient.js";

assert.deepEqual(
  MASTER_PAGE_TABS.map((tab) => tab.label),
  ["Все", "Заметки", "Статьи", "Мандалы", "Услуги", "Материалы"],
  "public master page tabs should keep RU MVP labels in order"
);

assert.equal(
  buildApprovedMasterProfilePath(" master-1 "),
  "/rest/v1/profile_cabinet_profiles?id=eq.master-1&status=eq.approved&select=id,display_name,bio,city,country,telegram,website,avatar_url,status,created_at,updated_at&limit=1",
  "profile query should load only approved public profile fields"
);

assert.equal(
  buildPublicMasterPublicationsPath({ profileId: " master-1 ", limit: 72 }),
  "/rest/v1/profile_cabinet_publications?profile_id=eq.master-1&status=eq.approved&select=id,profile_id,type,title,description,image_url,step_id,step_title,setting_title,status,created_at,updated_at&order=created_at.desc&limit=48",
  "publication query should be scoped to one approved master and clamp limit"
);

assert.equal(
  buildPublicMasterServicesPath({ profileId: " master-1 ", limit: 6 }),
  "/rest/v1/profile_cabinet_services?profile_id=eq.master-1&status=eq.published&select=id,profile_id,title,description,image_url,price_amount,price_currency,status,created_at,updated_at&order=updated_at.desc&limit=6",
  "service query should be scoped to one published master without private media columns"
);

const profile = normalizePublicMasterProfile({
  id: " master-1 ",
  display_name: " Елена Северная ",
  bio: " Практика мягких настроек ",
  city: " Барселона ",
  country: " Испания ",
  telegram: "@mentalica_master",
  website: "https://mentalica.example/path",
  avatar_url: "storage://profile-cabinet-media/master/avatar.jpg",
  status: "approved"
});

assert.equal(profile.displayName, "Елена Северная");
assert.equal(profile.avatarUrl, "", "public master profile should strip private storage avatar refs");
assert.equal(profile.telegramUrl, "https://t.me/mentalica_master");
assert.equal(profile.websiteUrl, "https://mentalica.example/path");

const article = normalizePublicMasterPublication({
  id: " pub-1 ",
  profile_id: " master-1 ",
  type: "article",
  title: " О настройке потока ",
  description: " Публичная заметка ",
  image_url: "https://cdn.example.com/article.jpg",
  status: "approved"
});

assert.equal(article.kind, "article");
assert.equal(article.imageUrl, "https://cdn.example.com/article.jpg");

const mandala = normalizePublicMasterPublication({
  id: " pub-2 ",
  profile_id: " master-1 ",
  type: "mandala",
  title: " Мандала ",
  image_url: "https://demo.supabase.co/storage/v1/object/sign/profile-cabinet-media/private.jpg?token=secret"
});

assert.equal(mandala.kind, "mandala");
assert.equal(mandala.imageUrl, "", "public master page should strip signed storage URLs");

const service = normalizePublicMasterService({
  id: " service-1 ",
  profile_id: " master-1 ",
  title: " Индивидуальная мандала ",
  image_url: "data:image/png;base64,abc",
  price_amount: "45",
  price_currency: "EUR",
  status: "published"
});

assert.equal(service.kind, "service");
assert.equal(service.imageUrl, "", "public master service cards should not render data URLs");
assert.equal(service.priceAmount, 45);

console.log("profilePublicMasterClient: all assertions passed.");
