import assert from "node:assert/strict";

import {
  GRIMOIRE_CATEGORIES,
  createEmptyMaterialForm,
  detectMaterialTypeFromFile,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel,
  stripFileExtension
} from "../src/lib/profileMaterialsClient.js";

const empty = createEmptyMaterialForm();

assert.equal(empty.type, "mandala");
assert.equal(empty.status, "draft");
assert.equal(empty.image_url, "");

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
    type: "mandala",
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

assert.equal(publicationTypeLabel("artifact"), "Артефакт");
assert.equal(publicationTypeLabel("photo"), "Фото / образ");
assert.equal(publicationTypeLabel("audio"), "Аудио");
assert.equal(publicationTypeLabel("document"), "Документ");
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
assert.equal(detectMaterialTypeFromFile({ type: "text/plain", name: "note.txt" }), "document");
assert.equal(detectMaterialTypeFromFile(null), "mandala");
