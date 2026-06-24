import assert from "node:assert/strict";

import {
  DB_SAFE_GRIMOIRE_TYPE,
  GRIMOIRE_CATEGORIES,
  GRIMOIRE_TAXONOMY,
  TAXONOMY_UNCLASSIFIED,
  TAXONOMY_UNCLASSIFIED_LABEL,
  MATERIAL_TYPES,
  createDefaultTaxonomy,
  createEmptyMaterialForm,
  detectMaterialTypeFromFile,
  grimoireTaxonomyCompactLabel,
  grimoireTaxonomyFilterLevelOptions,
  grimoireTaxonomyFromMaterial,
  grimoireTaxonomyLevelOptions,
  isGrimoireTaxonomyUnclassified,
  getGrimoireFeedActionLabel,
  getGrimoireNextVisibilityStatus,
  getGrimoirePhotoGalleryItems,
  getGrimoirePreviewUrl,
  buildMaterialUploadPublicationPayload,
  materialMatchesGrimoireTaxonomyFilter,
  materialStatusText,
  normalizeGrimoireAttachments,
  normalizeMaterialForm,
  publicationTypeLabel,
  stripFileExtension
} from "../src/lib/profileMaterialsClient.js";

const empty = createEmptyMaterialForm();

assert.equal(empty.type, DB_SAFE_GRIMOIRE_TYPE);
assert.equal(empty.status, "draft");
assert.equal(empty.image_url, "");
assert.deepEqual(empty.taxonomy, createDefaultTaxonomy());

assert.deepEqual(
  MATERIAL_TYPES.map((t) => t.label),
  ["Материал", "Фото / образ", "Статья", "Документ", "Аудио", "Артефакт", "Мандала"],
  "MATERIAL_TYPES should expose DB-safe technical material kinds, not user taxonomy labels"
);
assert.ok(!MATERIAL_TYPES.some((t) => t.value === "uncategorized"), "MATERIAL_TYPES should not expose uncategorized in primary inputs");
assert.ok(GRIMOIRE_TAXONOMY.length >= 4, "safe interim Grimoire taxonomy should expose root groups");
assert.deepEqual(
  grimoireTaxonomyLevelOptions(1)[0],
  { value: TAXONOMY_UNCLASSIFIED, label: TAXONOMY_UNCLASSIFIED_LABEL, children: [] },
  "level 1 should include Неразобранно"
);
assert.equal(grimoireTaxonomyLevelOptions(2, { level1: "dao-ri" })[0].label, TAXONOMY_UNCLASSIFIED_LABEL);
assert.equal(grimoireTaxonomyLevelOptions(3, { level1: "dao-ri", level2: "dao-ri-foundation" })[0].label, TAXONOMY_UNCLASSIFIED_LABEL);

// unknown type falls back to uncategorized (not mandala)
assert.deepEqual(
  normalizeMaterialForm(
    {
      type: "unknown",
      step_id: " RY-L01-S01 ",
      step_title: " Здоровье ",
      setting_title: " Лечение ",
      setting_index: "2",
      title: " Мандала здоровья ",
      description: " Описание ",
      image_url: " https://example.com/image.jpg ",
      material_type: " mandala ",
      taxonomy: {
        level1: " dao-ri ",
        level2: " dao-ri-foundation ",
        level3: " dao-ri-practices "
      }
    },
    "pending"
  ),
  {
    type: DB_SAFE_GRIMOIRE_TYPE,
    material_group: "dao-ri-practices",
    material_type: "mandala",
    title: "Мандала здоровья",
    description: "Описание",
    image_url: "https://example.com/image.jpg",
    step_id: "RY-L01-S01",
    step_title: "Здоровье",
    setting_title: "Лечение",
    setting_index: 2,
    category: "dao-ri",
    subcategory: "dao-ri-foundation",
    status: "pending"
  }
);

// normalizeMaterialForm keeps old flat taxonomy labels out of constrained type
assert.equal(
  normalizeMaterialForm({ type: "uncategorized", title: "Запись" }, "draft").type,
  "uncategorized"
);
assert.equal(normalizeMaterialForm({ type: "ri", title: "Запись" }, "draft").type, DB_SAFE_GRIMOIRE_TYPE);

assert.equal(publicationTypeLabel("artifact"), "Артефакт");
assert.equal(publicationTypeLabel("photo"), "Фото / образ");
assert.equal(publicationTypeLabel("audio"), "Аудио");
assert.equal(publicationTypeLabel("document"), "Документ");
assert.equal(publicationTypeLabel("uncategorized"), "Без категории");
assert.equal(publicationTypeLabel("practice"), "Материал");
assert.equal(materialStatusText("pending"), "на модерации");

// GRIMOIRE_CATEGORIES includes all filter options
assert.ok(Array.isArray(GRIMOIRE_CATEGORIES), "GRIMOIRE_CATEGORIES should be an array");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "all"), "GRIMOIRE_CATEGORIES should include 'all'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === TAXONOMY_UNCLASSIFIED), "GRIMOIRE_CATEGORIES should include unclassified");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "dao-ri"), "GRIMOIRE_CATEGORIES should include level-1 taxonomy");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "clients"), "GRIMOIRE_CATEGORIES should include 'clients'");

assert.deepEqual(
  grimoireTaxonomyFromMaterial({ category: "dao-ri", subcategory: "dao-ri-foundation", material_group: "dao-ri-practices" }),
  { level1: "dao-ri", level2: "dao-ri-foundation", level3: "dao-ri-practices" }
);
assert.equal(
  grimoireTaxonomyCompactLabel({ category: "dao-ri", subcategory: "dao-ri-foundation", material_group: "dao-ri-practices" }),
  "РИ / База РИ / Практики"
);
assert.equal(grimoireTaxonomyCompactLabel({}), "");
assert.equal(isGrimoireTaxonomyUnclassified({ category: "dao-ri", subcategory: "unclassified", material_group: "dao-ri-practices" }), true);

assert.ok(grimoireTaxonomyFilterLevelOptions(1)[0].value === "all" && grimoireTaxonomyFilterLevelOptions(1)[0].label === "Все", "feed level 1 filter should include Все");
assert.ok(grimoireTaxonomyFilterLevelOptions(1).some((option) => option.value === TAXONOMY_UNCLASSIFIED && option.label === TAXONOMY_UNCLASSIFIED_LABEL), "feed level 1 filter should include Неразобранно");
assert.ok(grimoireTaxonomyFilterLevelOptions(2, { level1: "dao-ri" }).some((option) => option.value === "dao-ri-foundation"), "feed level 2 filter should depend on level 1");
assert.ok(!grimoireTaxonomyFilterLevelOptions(2, { level1: "dao-ri" }).some((option) => option.value === "client-work"), "feed level 2 filter should hide other level 1 branches");
assert.ok(grimoireTaxonomyFilterLevelOptions(3, { level1: "dao-ri", level2: "dao-ri-foundation" }).some((option) => option.value === "dao-ri-practices"), "feed level 3 filter should depend on level 2");
assert.equal(
  materialMatchesGrimoireTaxonomyFilter(
    { category: "dao-ri", subcategory: "dao-ri-foundation", material_group: "dao-ri-practices" },
    { level1: "dao-ri", level2: "dao-ri-foundation", level3: "dao-ri-practices" }
  ),
  true,
  "classified rows should match all selected taxonomy levels"
);
assert.equal(
  materialMatchesGrimoireTaxonomyFilter(
    { category: "dao-ri", subcategory: "dao-ri-foundation", material_group: "dao-ri-practices" },
    { level1: "channels", level2: "all", level3: "all" }
  ),
  false,
  "level 1 mismatch should hide classified rows"
);
assert.equal(materialMatchesGrimoireTaxonomyFilter({ title: "old row", type: "ri" }, { level1: "all", level2: "all", level3: "all" }), true, "legacy rows without taxonomy stay visible under Все");
assert.equal(materialMatchesGrimoireTaxonomyFilter({ title: "old row", type: "ri" }, { level1: TAXONOMY_UNCLASSIFIED, level2: "all", level3: "all" }), true, "legacy rows without taxonomy match Неразобранно");

// stripFileExtension
assert.equal(stripFileExtension("image.jpg"), "image");
assert.equal(stripFileExtension("my.practice.pdf"), "my.practice");
assert.equal(stripFileExtension("noextension"), "noextension");

// detectMaterialTypeFromFile
assert.equal(detectMaterialTypeFromFile({ type: "audio/mpeg", name: "track.mp3" }), "audio");
assert.equal(detectMaterialTypeFromFile({ type: "application/pdf", name: "doc.pdf" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "image/jpeg", name: "pic.jpg" }), "photo");
assert.equal(detectMaterialTypeFromFile({ type: "text/plain", name: "note.txt" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "text/markdown", name: "readme.md" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "application/msword", name: "file.doc" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "", name: "unknown.xyz" }), DB_SAFE_GRIMOIRE_TYPE);
assert.equal(detectMaterialTypeFromFile(null), DB_SAFE_GRIMOIRE_TYPE);

assert.equal(
  getGrimoirePreviewUrl({ display_url: "https://signed.example/img.jpg", image_url: "storage://profile-cabinet-media/p/img.jpg" }),
  "https://signed.example/img.jpg",
  "Grimoire cards should render the hydrated signed URL for private storage media"
);
assert.equal(
  getGrimoirePreviewUrl({ signed_url: "https://signed.example/from-signed.jpg", image_url: "storage://profile-cabinet-media/p/img.jpg" }),
  "https://signed.example/from-signed.jpg",
  "Grimoire cards should accept signed_url when display_url is not present"
);
assert.equal(
  getGrimoirePreviewUrl({ image_url: "storage://profile-cabinet-media/p/img.jpg" }),
  "",
  "Grimoire cards must not render raw private storage refs as image URLs"
);
assert.equal(
  getGrimoirePreviewUrl({ image_url: "https://cdn.example/img.jpg" }),
  "https://cdn.example/img.jpg",
  "Legacy public image URLs should still render"
);
assert.deepEqual(
  normalizeGrimoireAttachments([
    { image_url: "storage://profile-cabinet-media/p/a.jpg", signed_url: "https://signed.example/a.jpg", title: "A" },
    { imageUrl: "https://cdn.example/b.jpg", displayUrl: "https://display.example/b.jpg", name: "B" },
    null,
    { image_url: "" }
  ]),
  [
    {
      image_url: "storage://profile-cabinet-media/p/a.jpg",
      display_url: "",
      signed_url: "https://signed.example/a.jpg",
      title: "A",
      type: "photo"
    },
    {
      image_url: "https://cdn.example/b.jpg",
      display_url: "https://display.example/b.jpg",
      signed_url: "",
      title: "B",
      type: "photo"
    }
  ],
  "Grimoire attachments should normalize mixed API/local fields and drop empty rows"
);
assert.deepEqual(
  getGrimoirePhotoGalleryItems({
    image_url: "storage://profile-cabinet-media/p/parent.jpg",
    display_url: "https://signed.example/parent.jpg",
    attachments: [
      { image_url: "storage://profile-cabinet-media/p/a.jpg", signed_url: "https://signed.example/a.jpg", title: "A" },
      { image_url: "storage://profile-cabinet-media/p/b.jpg", signed_url: "https://signed.example/b.jpg", title: "B" },
      { image_url: "storage://profile-cabinet-media/p/c.jpg" }
    ]
  }).map((item) => item.display_url),
  ["https://signed.example/a.jpg", "https://signed.example/b.jpg"],
  "Gallery should prefer valid attachment display URLs and never expose raw private storage refs"
);
assert.deepEqual(
  getGrimoirePhotoGalleryItems({ image_url: "https://cdn.example/legacy.jpg", title: "Legacy" }).map((item) => item.display_url),
  ["https://cdn.example/legacy.jpg"],
  "Legacy single-photo material should still render as a one-item gallery"
);
assert.equal(getGrimoireFeedActionLabel({ status: "approved" }), "Спрятать");
assert.equal(getGrimoireNextVisibilityStatus({ status: "approved" }), "draft");
assert.equal(getGrimoireFeedActionLabel({ status: "draft" }), "Добавить в ленту");
assert.equal(getGrimoireNextVisibilityStatus({ status: "draft" }), "approved");

const moneyChannelUpload = buildMaterialUploadPublicationPayload({
  profileId: "profile-1",
  file: { type: "image/png", name: "money-channel.png" },
  title: "money-channel.png",
  imageUrl: "storage://profile-cabinet-media/profile-1/material/money-channel.png",
  material: {
    group: "channels",
    category: "Деньги",
    subcategory: "Все каналы",
    step_id: "all-channels",
    step_title: "Все каналы",
    setting_title: "Все каналы",
    setting_index: null,
    type: "photo"
  }
});

assert.equal(moneyChannelUpload.type, DB_SAFE_GRIMOIRE_TYPE);
assert.equal(moneyChannelUpload.material_type, "photo");
assert.equal(moneyChannelUpload.material_group, "channels");
assert.equal(moneyChannelUpload.category, "Деньги");
assert.equal(moneyChannelUpload.subcategory, "Все каналы");
assert.equal(moneyChannelUpload.step_id, "all-channels");
assert.equal(moneyChannelUpload.step_title, "Все каналы");
assert.equal(moneyChannelUpload.setting_title, "Все каналы");
assert.equal(moneyChannelUpload.setting_index, null);
assert.equal(moneyChannelUpload.status, "draft");
assert.equal(moneyChannelUpload.image_url, "storage://profile-cabinet-media/profile-1/material/money-channel.png");
assert.ok(!["photo", "channels", "money", "all-channels"].includes(moneyChannelUpload.type));
