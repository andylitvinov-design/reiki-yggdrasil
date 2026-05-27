import assert from "node:assert/strict";

import {
  getPlanLimits,
  normalizeAccountPlan,
  normalizeClientGoalPhoto,
  normalizeCoverRef,
  normalizePowerPlaceComposition,
  normalizeTraditionAsset
} from "../src/lib/powerPlaceClient.js";

assert.equal(normalizeAccountPlan("pro"), "pro");
assert.equal(normalizeAccountPlan("unknown"), "start");

assert.deepEqual(getPlanLimits("start"), { compositions: 7, clientPhotos: 10 });
assert.deepEqual(getPlanLimits("pro"), { compositions: 20, clientPhotos: 30 });
assert.deepEqual(getPlanLimits("enterprise"), { compositions: 7, clientPhotos: 10 });

assert.deepEqual(
  normalizeCoverRef({
    id: "custom-cover",
    label: " Своё изображение ",
    type: "image",
    tone: "",
    src: "data:image/png;base64,cover"
  }),
  {
    id: "custom-cover",
    label: "Своё изображение",
    type: "image",
    tone: "",
    src: "data:image/png;base64,cover"
  }
);

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
    business_vertex_zone_count: 3,
    cover_ref: { id: "cover-gold", label: "Заставка места силы", type: "placeholder", tone: "", src: "" },
    object_refs: { "altar-top-3": "https://example.com/object.jpg" },
    central_photo_id: "photo-1",
    tradition_id: "greek",
    tradition_title: " Греческие мистерии ",
    resource_comparison_mode: "photo_mandala",
    resource_without_mandala_comment: " До: мало сил ",
    resource_with_mandala_comment: " После: яснее цель "
  }),
  {
    profile_id: "profile-1",
    title: "Алтарь цели",
    constructor_type: "altar",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "3",
    business_vertex_zone_count: 3,
    cover_ref: { id: "cover-gold", label: "Заставка места силы", type: "placeholder", tone: "", src: "" },
    object_refs: { "altar-top-3": "https://example.com/object.jpg" },
    central_photo_id: "photo-1",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии",
    resource_comparison_mode: "photo_mandala",
    resource_without_mandala_comment: "До: мало сил",
    resource_with_mandala_comment: "После: яснее цель"
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
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    cover_ref: null,
    object_refs: {},
    central_photo_id: "photo-2",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Бизнес-цель ",
    constructor_type: "business",
    geometry: 8,
    altar_center_ratio: "2",
    business_vertex_zone_count: "3",
    object_refs: {
      "business-goal-1": "https://example.com/goal.jpg",
      "business-function-2": "data:image/png;base64,local",
      "business-structure-3": " https://example.com/structure.jpg "
    },
    central_photo_id: "photo-3",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "Фото без поддержки",
    resource_with_mandala_comment: "Фото с мандалой"
  }),
  {
    profile_id: "profile-1",
    title: "Бизнес-цель",
    constructor_type: "business",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "2",
    business_vertex_zone_count: 3,
    cover_ref: null,
    object_refs: {
      "business-goal-1": "https://example.com/goal.jpg",
      "business-structure-3": "https://example.com/structure.jpg"
    },
    central_photo_id: "photo-3",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "Фото без поддержки",
    resource_with_mandala_comment: "Фото с мандалой"
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " ДАО ",
    constructor_type: "dao",
    business_vertex_zone_count: 2,
    object_refs: {
      "dao-water": "https://example.com/water.jpg",
      "dao-fire": "https://example.com/fire.jpg"
    },
    central_photo_id: "photo-4",
    resource_comparison_mode: "bad"
  }),
  {
    profile_id: "profile-1",
    title: "ДАО",
    constructor_type: "dao",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    cover_ref: null,
    object_refs: {
      "dao-water": "https://example.com/water.jpg",
      "dao-fire": "https://example.com/fire.jpg"
    },
    central_photo_id: "photo-4",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Зодиак цели ",
    constructor_type: "zodiac",
    geometry: 4,
    zodiac_visible_count: "8",
    object_refs: {
      "zodiac-1": " https://example.com/aries.jpg ",
      "zodiac-2": "data:image/png;base64,local",
      "source-1": "https://example.com/old-source.jpg"
    },
    central_photo_id: "photo-5",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии"
  }),
  {
    profile_id: "profile-1",
    title: "Зодиак цели",
    constructor_type: "zodiac",
    geometry: null,
    zodiac_visible_count: 8,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    cover_ref: null,
    object_refs: {
      "zodiac-1": "https://example.com/aries.jpg",
      "source-1": "https://example.com/old-source.jpg"
    },
    central_photo_id: "photo-5",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Зодиак fallback ",
    constructor_type: "zodiac",
    zodiac_visible_count: 5,
    object_refs: {
      "zodiac-12": "https://example.com/fish.jpg"
    },
    central_photo_id: "photo-6"
  }),
  {
    profile_id: "profile-1",
    title: "Зодиак fallback",
    constructor_type: "zodiac",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    cover_ref: null,
    object_refs: {
      "zodiac-12": "https://example.com/fish.jpg"
    },
    central_photo_id: "photo-6",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);
