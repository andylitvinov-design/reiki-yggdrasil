import assert from "node:assert/strict";

import {
  createEmptyMaterialForm,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel
} from "../src/lib/profileMaterialsClient.js";

const empty = createEmptyMaterialForm();

assert.equal(empty.type, "mandala");
assert.equal(empty.status, "draft");

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
assert.equal(materialStatusText("pending"), "на модерации");
