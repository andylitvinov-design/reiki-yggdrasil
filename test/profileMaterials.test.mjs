import assert from "node:assert/strict";

import {
  GRIMOIRE_CATEGORIES,
  MATERIAL_TYPES,
  createEmptyMaterialForm,
  detectMaterialTypeFromFile,
  getGrimoireFeedActionLabel,
  getGrimoireNextVisibilityStatus,
  getGrimoirePreviewUrl,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel,
  stripFileExtension
} from "../src/lib/profileMaterialsClient.js";

const empty = createEmptyMaterialForm();

assert.equal(empty.type, "ri");
assert.equal(empty.status, "draft");
assert.equal(empty.image_url, "");

assert.deepEqual(
  MATERIAL_TYPES.map((t) => t.label),
  ["РИ", "Каналы", "Боги", "Клиенты"],
  "MATERIAL_TYPES should expose exactly the primary Grimoire categories"
);
assert.ok(!MATERIAL_TYPES.some((t) => t.value === "uncategorized"), "MATERIAL_TYPES should not expose uncategorized in primary inputs");

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
      material_group: " channels ",
      material_type: " mandala ",
      category: " Reiki 1 ",
      subcategory: " Лечение "
    },
    "pending"
  ),
  {
    type: "ri",
    material_group: "channels",
    material_type: "mandala",
    title: "Мандала здоровья",
    description: "Описание",
    image_url: "https://example.com/image.jpg",
    step_id: "RY-L01-S01",
    step_title: "Здоровье",
    setting_title: "Лечение",
    setting_index: 2,
    category: "Reiki 1",
    subcategory: "Лечение",
    status: "pending"
  }
);

// normalizeMaterialForm accepts uncategorized
assert.equal(
  normalizeMaterialForm({ type: "uncategorized", title: "Запись" }, "draft").type,
  "uncategorized"
);

assert.equal(publicationTypeLabel("artifact"), "Артефакт");
assert.equal(publicationTypeLabel("photo"), "Фото / образ");
assert.equal(publicationTypeLabel("audio"), "Аудио");
assert.equal(publicationTypeLabel("document"), "Документ");
assert.equal(publicationTypeLabel("uncategorized"), "Без категории");
assert.equal(publicationTypeLabel("ri"), "РИ");
assert.equal(publicationTypeLabel("channels"), "Каналы");
assert.equal(publicationTypeLabel("gods"), "Боги");
assert.equal(publicationTypeLabel("clients"), "Клиенты");
assert.equal(materialStatusText("pending"), "на модерации");

// GRIMOIRE_CATEGORIES includes all filter options
assert.ok(Array.isArray(GRIMOIRE_CATEGORIES), "GRIMOIRE_CATEGORIES should be an array");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "all"), "GRIMOIRE_CATEGORIES should include 'all'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "uncategorized"), "GRIMOIRE_CATEGORIES should include 'uncategorized'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "ri"), "GRIMOIRE_CATEGORIES should include 'ri'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "clients"), "GRIMOIRE_CATEGORIES should include 'clients'");

// stripFileExtension
assert.equal(stripFileExtension("image.jpg"), "image");
assert.equal(stripFileExtension("my.practice.pdf"), "my.practice");
assert.equal(stripFileExtension("noextension"), "noextension");

// detectMaterialTypeFromFile
assert.equal(detectMaterialTypeFromFile({ type: "audio/mpeg", name: "track.mp3" }), "channels");
assert.equal(detectMaterialTypeFromFile({ type: "application/pdf", name: "doc.pdf" }), "ri");
assert.equal(detectMaterialTypeFromFile({ type: "image/jpeg", name: "pic.jpg" }), "clients");
assert.equal(detectMaterialTypeFromFile({ type: "text/plain", name: "note.txt" }), "ri");
assert.equal(detectMaterialTypeFromFile({ type: "text/markdown", name: "readme.md" }), "ri");
assert.equal(detectMaterialTypeFromFile({ type: "application/msword", name: "file.doc" }), "ri");
assert.equal(detectMaterialTypeFromFile({ type: "", name: "unknown.xyz" }), "ri");
assert.equal(detectMaterialTypeFromFile(null), "ri");

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
assert.equal(getGrimoireFeedActionLabel({ status: "approved" }), "Спрятать");
assert.equal(getGrimoireNextVisibilityStatus({ status: "approved" }), "draft");
assert.equal(getGrimoireFeedActionLabel({ status: "draft" }), "Добавить в ленту");
assert.equal(getGrimoireNextVisibilityStatus({ status: "draft" }), "approved");
