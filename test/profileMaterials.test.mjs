import assert from "node:assert/strict";

import {
  GRIMOIRE_CATEGORIES,
  MATERIAL_TYPES,
  createEmptyMaterialForm,
  detectMaterialTypeFromFile,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel,
  stripFileExtension
} from "../src/lib/profileMaterialsClient.js";

const empty = createEmptyMaterialForm();

assert.equal(empty.type, "uncategorized");
assert.equal(empty.status, "draft");
assert.equal(empty.image_url, "");

// MATERIAL_TYPES includes uncategorized
assert.ok(MATERIAL_TYPES.some((t) => t.value === "uncategorized"), "MATERIAL_TYPES should include uncategorized");
assert.ok(MATERIAL_TYPES.some((t) => t.value === "photo"), "MATERIAL_TYPES should include photo");
assert.ok(MATERIAL_TYPES.some((t) => t.value === "audio"), "MATERIAL_TYPES should include audio");

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
      image_url: " https://example.com/image.jpg "
    },
    "pending"
  ),
  {
    type: "uncategorized",
    title: "Мандала здоровья",
    description: "Описание",
    image_url: "https://example.com/image.jpg",
    step_id: "RY-L01-S01",
    step_title: "Здоровье",
    setting_title: "Лечение",
    setting_index: 2,
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
assert.equal(materialStatusText("pending"), "на модерации");

// GRIMOIRE_CATEGORIES includes all filter options
assert.ok(Array.isArray(GRIMOIRE_CATEGORIES), "GRIMOIRE_CATEGORIES should be an array");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "all"), "GRIMOIRE_CATEGORIES should include 'all'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "uncategorized"), "GRIMOIRE_CATEGORIES should include 'uncategorized'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "photo"), "GRIMOIRE_CATEGORIES should include 'photo'");
assert.ok(GRIMOIRE_CATEGORIES.some((c) => c.value === "audio"), "GRIMOIRE_CATEGORIES should include 'audio'");

// stripFileExtension
assert.equal(stripFileExtension("image.jpg"), "image");
assert.equal(stripFileExtension("my.practice.pdf"), "my.practice");
assert.equal(stripFileExtension("noextension"), "noextension");

// detectMaterialTypeFromFile
assert.equal(detectMaterialTypeFromFile({ type: "audio/mpeg", name: "track.mp3" }), "audio");
assert.equal(detectMaterialTypeFromFile({ type: "application/pdf", name: "doc.pdf" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "image/jpeg", name: "pic.jpg" }), "photo");
assert.equal(detectMaterialTypeFromFile({ type: "text/plain", name: "note.txt" }), "article");
assert.equal(detectMaterialTypeFromFile({ type: "text/markdown", name: "readme.md" }), "article");
assert.equal(detectMaterialTypeFromFile({ type: "application/msword", name: "file.doc" }), "document");
assert.equal(detectMaterialTypeFromFile({ type: "", name: "unknown.xyz" }), "uncategorized");
assert.equal(detectMaterialTypeFromFile(null), "uncategorized");
