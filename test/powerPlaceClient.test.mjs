import assert from "node:assert/strict";

import {
  getPlanLimits,
  normalizeAccountPlan,
  normalizeClientGoalPhoto,
  normalizePowerPlaceComposition,
  normalizeTraditionAsset
} from "../src/lib/powerPlaceClient.js";

assert.equal(normalizeAccountPlan("pro"), "pro");
assert.equal(normalizeAccountPlan("unknown"), "start");

assert.deepEqual(getPlanLimits("start"), { compositions: 7, clientPhotos: 10 });
assert.deepEqual(getPlanLimits("pro"), { compositions: 20, clientPhotos: 30 });
assert.deepEqual(getPlanLimits("enterprise"), { compositions: 7, clientPhotos: 10 });

assert.deepEqual(
  normalizeClientGoalPhoto({
    profile_id: "profile-1",
    title: " Фото цели ",
    image_url: " https://example.com/client.jpg ",
    notes: " Задача клиента "
  }),
  {
    profile_id: "profile-1",
    title: "Фото цели",
    image_url: "https://example.com/client.jpg",
    notes: "Задача клиента"
  }
);

assert.throws(
  () => normalizeClientGoalPhoto({ profile_id: "profile-1", title: "Без фото", image_url: "" }),
  /Добавьте ссылку/
);

assert.deepEqual(
  normalizeTraditionAsset({
    profile_id: "profile-1",
    tradition_id: " greek ",
    tradition_title: " Греческие мистерии ",
    title: " Символ ",
    image_url: " https://example.com/tradition.png ",
    notes: " Для алтаря "
  }),
  {
    profile_id: "profile-1",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии",
    title: "Символ",
    image_url: "https://example.com/tradition.png",
    notes: "Для алтаря"
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Алтарь цели ",
    constructor_type: "altar",
    geometry: 99,
    altar_center_ratio: "3",
    cover_ref: { id: "cover-gold", type: "placeholder" },
    object_refs: { "altar-top-3": "https://example.com/object.jpg" },
    central_photo_id: "photo-1",
    tradition_id: "greek",
    tradition_title: " Греческие мистерии "
  }),
  {
    profile_id: "profile-1",
    title: "Алтарь цели",
    constructor_type: "altar",
    geometry: null,
    altar_center_ratio: "3",
    cover_ref: { id: "cover-gold", type: "placeholder" },
    object_refs: { "altar-top-3": "https://example.com/object.jpg" },
    central_photo_id: "photo-1",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии"
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "",
    constructor_type: "client",
    geometry: "12",
    altar_center_ratio: "bad",
    cover_ref: null,
    object_refs: null,
    central_photo_id: "photo-2"
  }),
  {
    profile_id: "profile-1",
    title: "Место силы",
    constructor_type: "client",
    geometry: 12,
    altar_center_ratio: "1",
    cover_ref: null,
    object_refs: {},
    central_photo_id: "photo-2",
    tradition_id: "",
    tradition_title: ""
  }
);
