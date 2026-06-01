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
    image_bucket: "profile-cabinet-media",
    image_path: "",
    mime_type: "",
    file_size_bytes: 0,
    notes: "Задача клиента"
  }
);

assert.deepEqual(
  normalizeClientGoalPhoto({
    profile_id: "profile-1",
    title: " Storage фото ",
    image_path: "profile-1/client-goal/uuid-client.jpg",
    mime_type: "image/jpeg",
    file_size_bytes: 1234,
    notes: " Durable "
  }),
  {
    profile_id: "profile-1",
    title: "Storage фото",
    image_url: "",
    image_bucket: "profile-cabinet-media",
    image_path: "profile-1/client-goal/uuid-client.jpg",
    mime_type: "image/jpeg",
    file_size_bytes: 1234,
    notes: "Durable"
  }
);

assert.throws(
  () => normalizeClientGoalPhoto({ profile_id: "profile-1", title: "Без фото", image_url: "" }),
  /Добавьте фото/
);

assert.throws(
  () => normalizeClientGoalPhoto({ profile_id: "profile-1", title: "Local", image_url: "data:image/png;base64,local" }),
  /Добавьте фото/
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
    image_bucket: "profile-cabinet-media",
    image_path: "",
    mime_type: "",
    file_size_bytes: 0,
    notes: "Для алтаря"
  }
);

assert.deepEqual(
  normalizeTraditionAsset({
    profile_id: "profile-1",
    tradition_id: " greek ",
    tradition_title: " Греческие мистерии ",
    title: " Storage символ ",
    image_path: "profile-1/traditions/greek/uuid-symbol.webp",
    mime_type: "image/webp",
    file_size_bytes: 2048,
    notes: " Для алтаря "
  }),
  {
    profile_id: "profile-1",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии",
    title: "Storage символ",
    image_url: "",
    image_bucket: "profile-cabinet-media",
    image_path: "profile-1/traditions/greek/uuid-symbol.webp",
    mime_type: "image/webp",
    file_size_bytes: 2048,
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
    star_variant: "closed",
    chess_variant: "classic-14",
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
    star_variant: "closed",
    chess_variant: "classic-14",
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
    star_variant: "closed",
    chess_variant: "classic-14",
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
      "dao-fire": "https://example.com/fire.jpg",
      "dao-earth": "storage://profile-cabinet-media/profile-1/power-place/draft/dao-earth-uuid-earth.png",
      "dao-metal": "data:image/png;base64,local"
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
    star_variant: "closed",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      "dao-water": "https://example.com/water.jpg",
      "dao-fire": "https://example.com/fire.jpg",
      "dao-earth": "storage://profile-cabinet-media/profile-1/power-place/draft/dao-earth-uuid-earth.png"
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
    star_variant: "closed",
    chess_variant: "classic-14",
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
    star_variant: "closed",
    chess_variant: "classic-14",
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

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Звезда цели ",
    constructor_type: "star",
    geometry: 8,
    zodiac_visible_count: 6,
    star_variant: "open",
    object_refs: {
      "star-1": " https://example.com/star-top.jpg ",
      "star-2": "storage://profile-cabinet-media/profile-1/power-place/draft/star-2-uuid.png",
      "star-5": "data:image/png;base64,local"
    },
    central_photo_id: "photo-7",
    tradition_id: "greek",
    tradition_title: "Греческие мистерии"
  }),
  {
    profile_id: "profile-1",
    title: "Звезда цели",
    constructor_type: "star",
    geometry: null,
    zodiac_visible_count: 6,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "open",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      "star-1": "https://example.com/star-top.jpg",
      "star-2": "storage://profile-cabinet-media/profile-1/power-place/draft/star-2-uuid.png"
    },
    central_photo_id: "photo-7",
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
    title: " Звезда fallback ",
    constructor_type: "star",
    star_variant: "wide",
    object_refs: {
      "star-3": "https://example.com/star-left.jpg"
    },
    central_photo_id: "photo-8"
  }),
  {
    profile_id: "profile-1",
    title: "Звезда fallback",
    constructor_type: "star",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      "star-3": "https://example.com/star-left.jpg"
    },
    central_photo_id: "photo-8",
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
    title: " Центр из мандалы ",
    constructor_type: "client",
    geometry: 4,
    object_refs: {
      "__center_image": "storage://profile-cabinet-media/profile-1/materials/uuid-center.webp",
      "source-1": "https://example.com/source.jpg"
    },
    central_photo_id: ""
  }),
  {
    profile_id: "profile-1",
    title: "Центр из мандалы",
    constructor_type: "client",
    geometry: 4,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      "__center_image": "storage://profile-cabinet-media/profile-1/materials/uuid-center.webp",
      "source-1": "https://example.com/source.jpg"
    },
    central_photo_id: null,
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
    title: " Шахматы силы ",
    constructor_type: "chess",
    chess_variant: "plus-8",
    object_refs: {
      "chess-top-1": " https://example.com/top-1.jpg ",
      "chess-1": "https://example.com/cross-top.jpg",
      "chess-8": "storage://profile-cabinet-media/profile-1/power-place/draft/chess-8.png",
      "chess-9": "data:image/png;base64,local"
    },
    central_photo_id: "photo-9"
  }),
  {
    profile_id: "profile-1",
    title: "Шахматы силы",
    constructor_type: "chess",
    geometry: null,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    chess_variant: "plus-8",
    cover_ref: null,
    object_refs: {
      "chess-top-1": "https://example.com/top-1.jpg",
      "chess-1": "https://example.com/cross-top.jpg",
      "chess-8": "storage://profile-cabinet-media/profile-1/power-place/draft/chess-8.png"
    },
    central_photo_id: "photo-9",
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  }
);

assert.equal(
  normalizePowerPlaceComposition({ constructor_type: "chess", chess_variant: "wide" }).chess_variant,
  "classic-14"
);
