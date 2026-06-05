import assert from "node:assert/strict";

import {
  __testPowerPlaceClient,
  createPowerPlaceCompositionWithDependencies,
  getPlanLimits,
  normalizeAccountPlan,
  normalizeClientGoalPhoto,
  normalizeCoverRef,
  normalizePowerPlaceComposition,
  normalizeTraditionAsset
} from "../src/lib/powerPlaceClient.js";

const { buildCompositionDbPayload, DB_COMPOSITION_COLUMNS } = __testPowerPlaceClient;

const storageRefs = {
  slot: "storage://profile-cabinet-media/profile-1/power-place/draft/chess-1.png",
  center: "storage://profile-cabinet-media/profile-1/client-goal/center.png",
  legacyCover: "storage://profile-cabinet-media/profile-1/underlays/legacy.png",
  innerCover: "storage://profile-cabinet-media/profile-1/underlays/inner.png",
  outerCover: "storage://profile-cabinet-media/profile-1/underlays/outer.png"
};

const compositionRefs = __testPowerPlaceClient.collectCompositionStorageRefs({
    object_refs: {
      "chess-1": storageRefs.slot,
      __center_image: storageRefs.center,
      __profile_lite_report: { added: true },
      __slot_scale: "1.08",
      __inner_field_scale: "82",
      __center_image_scale: "1.22",
      "chess-2": "https://example.com/public.jpg"
    },
  cover_ref: {
    id: "custom-cover",
    type: "image",
    src: storageRefs.legacyCover,
    inner: { id: "custom-cover", type: "image", src: storageRefs.innerCover },
    outer: { id: "custom-outer-cover", type: "image", src: storageRefs.outerCover }
  }
});

assert.deepEqual(
  compositionRefs.sort(),
  [storageRefs.center, storageRefs.innerCover, storageRefs.legacyCover, storageRefs.outerCover, storageRefs.slot].sort(),
  "composition hydration should collect only string storage refs from object_refs and all cover layers"
);

const hydratedComposition = __testPowerPlaceClient.hydrateCompositionRowsWithSignedUrls([
  {
    id: "composition-1",
    object_refs: {
      "chess-1": storageRefs.slot,
      __center_image: storageRefs.center,
      __profile_lite_report: { added: true }
    },
    cover_ref: {
      id: "custom-cover",
      type: "image",
      src: storageRefs.legacyCover,
      inner: { id: "custom-cover", type: "image", src: storageRefs.innerCover },
      outer: { id: "custom-outer-cover", type: "image", src: storageRefs.outerCover }
    }
  }
], {
  [storageRefs.slot]: "https://signed.example/slot.png",
  [storageRefs.center]: "https://signed.example/center.png",
  [storageRefs.legacyCover]: "https://signed.example/legacy.png",
  [storageRefs.innerCover]: "https://signed.example/inner.png",
  [storageRefs.outerCover]: "https://signed.example/outer.png"
})[0];

assert.deepEqual(
  hydratedComposition.object_ref_urls,
  {
    [storageRefs.slot]: "https://signed.example/slot.png",
    [storageRefs.center]: "https://signed.example/center.png",
    [storageRefs.legacyCover]: "https://signed.example/legacy.png",
    [storageRefs.innerCover]: "https://signed.example/inner.png",
    [storageRefs.outerCover]: "https://signed.example/outer.png"
  },
  "object_ref_urls should be a storageRef -> signedUrl map, not a slotId -> signedUrl map"
);
assert.equal(hydratedComposition.cover_ref.display_src, "https://signed.example/legacy.png");
assert.equal(hydratedComposition.cover_ref.inner.display_src, "https://signed.example/inner.png");
assert.equal(hydratedComposition.cover_ref.outer.display_src, "https://signed.example/outer.png");

const createBasePayload = {
  profile_id: "profile-1",
  title: "Место силы",
  constructor_type: "client",
  geometry: 4,
  object_refs: {}
};
const testSession = { access_token: "test-token" };

await assert.rejects(
  () => createPowerPlaceCompositionWithDependencies(
    createBasePayload,
    "start",
    testSession,
    {
      countRows: async () => {
        throw new Error("count network down");
      },
      insertRows: async () => [{ id: "should-not-insert" }],
      hydrateRows: async (rows) => rows
    }
  ),
  (error) => {
    assert.equal(error.details?.stage, "countRows");
    assert.match(error.message, /Не удалось проверить лимит сохранённых мандал/);
    return true;
  },
  "countRows failure should be surfaced as the count stage, before POST"
);

await assert.rejects(
  () => createPowerPlaceCompositionWithDependencies(
    createBasePayload,
    "start",
    testSession,
    {
      countRows: async () => 0,
      insertRows: async () => {
        throw new Error("insert blocked");
      },
      hydrateRows: async (rows) => rows
    }
  ),
  (error) => {
    assert.equal(error.details?.stage, "POST");
    assert.match(error.message, /Не удалось сохранить мандалу в Supabase/);
    return true;
  },
  "POST failure should be surfaced distinctly from countRows failure"
);

{
  const stages = [];
  const created = await createPowerPlaceCompositionWithDependencies(
    createBasePayload,
    "start",
    testSession,
    {
      countRows: async () => 0,
      insertRows: async () => [{ id: "composition-raw-1", title: "Raw row" }],
      hydrateRows: async () => {
        throw new Error("signed URL service stalled");
      },
      onStage: (stage) => stages.push(stage)
    }
  );

  assert.deepEqual(stages, ["countRows", "POST", "insertReturned", "hydrate"]);
  assert.equal(created.id, "composition-raw-1");
  assert.equal(created.__hydration_warning, true);
  assert.match(created.__hydration_error, /signed URL service stalled/);
}

assert.equal(normalizeAccountPlan("pro"), "pro");
assert.equal(normalizeAccountPlan("unknown"), "start");

assert.deepEqual(getPlanLimits("start"), { compositions: 7, clientPhotos: 25 });
assert.deepEqual(getPlanLimits("pro"), { compositions: 20, clientPhotos: 30 });
assert.deepEqual(getPlanLimits("enterprise"), { compositions: 7, clientPhotos: 25 });

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
    object_refs: {
      "altar-top-3": "https://example.com/object.jpg",
      __inner_field_scale: "82",
      __center_image_scale: "1.22",
      __profile_lite_report: {
        mode: "with_report",
        added: true,
        situation: " Клиент просит ясность ",
        mandala_effect: " Мандала собирает фокус ",
        extra_help: " Практика дыхания ",
        master_note: " paid pro "
      }
    },
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
    object_refs: {
      "altar-top-3": "https://example.com/object.jpg",
      __inner_field_scale: "82",
      __center_image_scale: "1.22",
      __profile_lite_report: {
        mode: "with_report",
        added: true,
        situation: "Клиент просит ясность",
        mandala_effect: "Мандала собирает фокус",
        extra_help: "Практика дыхания",
        master_note: ""
      },
      __field_layout: "square"
    },
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
    title: " Новый черновик ",
    constructor_type: "client",
    geometry: "4",
    object_refs: {
      __profile_lite_report: {}
    },
    central_photo_id: "photo-new"
  }).object_refs.__profile_lite_report,
  {
    mode: "without_report",
    added: false,
    situation: "",
    mandala_effect: "",
    extra_help: "",
    master_note: ""
  },
  "empty Profile Lite report refs should normalize to Без отчёта for new drafts"
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: " Сохранённый отчёт ",
    constructor_type: "client",
    geometry: "4",
    object_refs: {
      __profile_lite_report: {
        added: true,
        situation: " Есть описание "
      }
    },
    central_photo_id: "photo-existing"
  }).object_refs.__profile_lite_report,
  {
    mode: "with_report",
    added: true,
    situation: "Есть описание",
    mandala_effect: "",
    extra_help: "",
    master_note: ""
  },
  "saved report bodies without an explicit mode should remain report-enabled"
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
    object_refs: {
      __field_layout: "square"
    },
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
      "business-structure-3": "https://example.com/structure.jpg",
      __field_layout: "square"
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
      "dao-earth": "storage://profile-cabinet-media/profile-1/power-place/draft/dao-earth-uuid-earth.png",
      __field_layout: "square"
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
      "source-1": "https://example.com/old-source.jpg",
      __field_layout: "square"
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
      "zodiac-12": "https://example.com/fish.jpg",
      __field_layout: "square"
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
      "star-2": "storage://profile-cabinet-media/profile-1/power-place/draft/star-2-uuid.png",
      __field_layout: "square"
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
      "star-3": "https://example.com/star-left.jpg",
      __field_layout: "square"
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
      "source-1": "https://example.com/source.jpg",
      __field_layout: "square"
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
      "source-1": "https://example.com/source.jpg",
      __field_layout: "square"
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
      "chess-8": "storage://profile-cabinet-media/profile-1/power-place/draft/chess-8.png",
      __field_layout: "square"
    },
    central_photo_id: "photo-9",
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
    title: " Фото-макет 1 ",
    constructor_type: "client",
    geometry: 9,
    object_refs: {
      __mandala_template_id: "stone-mosaic-01",
      "client-1": "https://example.com/client-1.jpg",
      "client-9": "storage://profile-cabinet-media/profile-1/power-place/draft/client-9.webp",
      "client-local": "data:image/png;base64,local"
    },
    central_photo_id: ""
  }),
  {
    profile_id: "profile-1",
    title: "Фото-макет 1",
    constructor_type: "client",
    geometry: 9,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      __mandala_template_id: "stone-mosaic-01",
      "client-1": "https://example.com/client-1.jpg",
      "client-9": "storage://profile-cabinet-media/profile-1/power-place/draft/client-9.webp",
      __field_layout: "square"
    },
    central_photo_id: null,
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: ""
  },
  "photo mandala template should preserve geometry 9, template id, and durable client refs"
);

assert.equal(
  normalizePowerPlaceComposition({ constructor_type: "chess", chess_variant: "wide" }).chess_variant,
  "classic-14"
);

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Вертикальный макет",
    constructor_type: "client",
    geometry: 4,
    field_layout: "vertical",
    object_refs: {},
    central_photo_id: "photo-layout"
  }).object_refs.__field_layout,
  "vertical",
  "valid field_layout should be persisted into object_refs.__field_layout"
);

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Неверный макет",
    constructor_type: "client",
    geometry: 4,
    field_layout: "invalid-layout",
    object_refs: {},
    central_photo_id: "photo-layout-invalid"
  }).object_refs.__field_layout,
  "square",
  "invalid field_layout should fall back to square"
);

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Макет по умолчанию",
    constructor_type: "client",
    geometry: 4,
    object_refs: {},
    central_photo_id: "photo-layout-default"
  }).object_refs.__field_layout,
  "square",
  "missing field_layout should persist the square fallback"
);

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Макет из object_refs",
    constructor_type: "client",
    geometry: 4,
    object_refs: { __field_layout: "horizontal" },
    central_photo_id: "photo-layout-ref"
  }).object_refs.__field_layout,
  "horizontal",
  "object_refs.__field_layout should be preserved when loading/saving"
);

const normalizedServiceRefsComposition = normalizePowerPlaceComposition({
  profile_id: "profile-1",
  title: "Служебные настройки",
  constructor_type: "client",
  geometry: 4,
  field_layout: "vertical",
  object_refs: {
    "__center_image": storageRefs.center,
    "__center_frame_scale": "1.24",
    "__center_image_scale": "1.18",
    "__center_shape": "circle",
    "__inner_cover_offset_x": "35",
    "__inner_cover_offset_y": "64",
    "__outer_cover_offset_x": "44",
    "__outer_cover_offset_y": "57",
    "client-1": "data:image/png;base64,local-slot",
    "client-2": "https://example.com/client-2.jpg"
  },
  central_photo_id: ""
});

assert.deepEqual(
  normalizedServiceRefsComposition.object_refs,
  {
    "__center_image": storageRefs.center,
    "__center_frame_scale": "1.24",
    "__center_image_scale": "1.18",
    "__center_shape": "circle",
    "__inner_cover_offset_x": "35",
    "__inner_cover_offset_y": "64",
    "__outer_cover_offset_x": "44",
    "__outer_cover_offset_y": "57",
    "client-2": "https://example.com/client-2.jpg",
    __field_layout: "vertical"
  },
  "safe service refs should persist while data:image image slot refs are stripped"
);

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Центр из enhanced draft",
    constructor_type: "client",
    geometry: 4,
    __center_frame_scale: 1.16,
    object_refs: {}
  }).object_refs.__center_frame_scale,
  "1.16",
  "top-level __center_frame_scale should be persisted into object_refs for save/load"
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Неверные служебные настройки",
    constructor_type: "client",
    geometry: 4,
    object_refs: {
      "__center_frame_scale": "9",
      "__center_image_scale": "bad",
      "__center_shape": "triangle",
      "__inner_cover_offset_x": "-20",
      "__inner_cover_offset_y": "120",
      "__outer_cover_offset_x": "bad",
      "__outer_cover_offset_y": "50"
    },
    central_photo_id: ""
  }).object_refs,
  {
    "__center_frame_scale": "1.4",
    "__center_image_scale": "1",
    "__center_shape": "square",
    "__inner_cover_offset_x": "20",
    "__inner_cover_offset_y": "80",
    "__outer_cover_offset_x": "50",
    "__outer_cover_offset_y": "50",
    __field_layout: "square"
  },
  "invalid numeric service refs should clamp or fall back safely"
);

const compactChessComposition = normalizePowerPlaceComposition({
  profile_id: "profile-1",
  title: " Компактные шахматы ",
  constructor_type: "chess",
  chess_variant: "compact-5",
  slot_scale: 1.14,
  object_refs: {
    "chess-1": "https://example.com/chess-1.jpg"
  },
  central_photo_id: "photo-compact"
});

assert.equal(compactChessComposition.chess_variant, "compact-5", "compact-5 should remain a saved technical chess variant");
assert.equal(compactChessComposition.object_refs.__slot_scale, "1.14", "shared slot scale should persist inside object_refs without requiring a schema migration");

assert.equal(
  normalizePowerPlaceComposition({
    constructor_type: "chess",
    chess_variant: "plus-8",
    object_refs: { __slot_scale: "9" }
  }).object_refs.__slot_scale,
  "1.18",
  "shared slot scale persisted in object_refs should be clamped"
);

// ── buildCompositionDbPayload whitelist tests ────────────────────────────────

{
  const clientOnlyFields = [
    "field_layout", "zodiac_variant", "chess_slot_scale", "slot_scale",
    "field_scale", "__center_image_scale", "__center_frame_scale",
    "object_ref_urls", "display_src", "id", "created_at", "updated_at"
  ];
  const compositionWithClientFields = {
    profile_id: "profile-1",
    title: "Test",
    constructor_type: "client",
    geometry: 4,
    zodiac_visible_count: 12,
    altar_center_ratio: "1",
    business_vertex_zone_count: 1,
    star_variant: "closed",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: { __field_layout: "square" },
    central_photo_id: null,
    tradition_id: "",
    tradition_title: "",
    resource_comparison_mode: "client_photo",
    resource_without_mandala_comment: "",
    resource_with_mandala_comment: "",
    // client-only fields that must be stripped:
    field_layout: "vertical",
    zodiac_variant: "classic-12",
    chess_slot_scale: 1.2,
    slot_scale: 1.1,
    field_scale: 82,
    __center_image_scale: 1.18,
    __center_frame_scale: 1.24,
    object_ref_urls: { "storage://x": "https://signed.example/x.png" },
    display_src: "https://signed.example/cover.png",
    id: "should-be-stripped",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z"
  };

  const dbPayload = buildCompositionDbPayload(compositionWithClientFields);

  for (const field of clientOnlyFields) {
    assert.equal(
      Object.hasOwn(dbPayload, field),
      false,
      `buildCompositionDbPayload must strip client-only field: ${field}`
    );
  }

  for (const col of DB_COMPOSITION_COLUMNS) {
    assert.equal(
      Object.hasOwn(dbPayload, col),
      true,
      `buildCompositionDbPayload must preserve DB column: ${col}`
    );
  }
}

{
  const normalized = normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Whitelist test",
    constructor_type: "chess",
    chess_variant: "compact-5",
    object_refs: { __field_layout: "vertical" },
    central_photo_id: null
  });
  const dbPayload = buildCompositionDbPayload(normalized);

  assert.equal(Object.hasOwn(dbPayload, "chess_variant"), true, "chess_variant must be in DB payload");
  assert.equal(Object.hasOwn(dbPayload, "field_layout"), false, "field_layout must not be top-level in DB payload");
  assert.equal(dbPayload.object_refs.__field_layout, "vertical", "field_layout persists inside object_refs");
}

{
  const normalized = normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Cover strip test",
    constructor_type: "client",
    geometry: 4,
    cover_ref: {
      id: "custom-cover",
      type: "image",
      src: storageRefs.legacyCover,
      display_src: "https://signed.example/should-be-stripped.png",
      inner: {
        id: "custom-cover",
        type: "image",
        src: storageRefs.innerCover,
        display_src: "https://signed.example/inner-stripped.png"
      }
    },
    object_refs: { object_ref_urls: { "storage://x": "https://signed.example/x.png" } },
    central_photo_id: null
  });
  const dbPayload = buildCompositionDbPayload(normalized);

  assert.equal(Object.hasOwn(dbPayload, "object_ref_urls"), false, "object_ref_urls must be stripped from top-level DB payload");
}

assert.equal(
  normalizePowerPlaceComposition({
    profile_id: "profile-1",
    constructor_type: "client",
    geometry: 9,
    object_refs: {},
    central_photo_id: null
  }).geometry,
  9,
  "geometry 9 (photo-mandala template) must be preserved by normalization"
);

console.log("powerPlaceClient tests passed");
