import assert from "node:assert/strict";

import { supabaseEnv } from "../src/lib/supabaseClient.js";
import {
  __testPowerPlaceClient,
  clonePowerPlaceCompositionForOrder,
  createPowerPlaceCompositionWithDependencies,
  deletePowerPlaceComposition,
  filterMasterPowerPlaceCompositions,
  getPlanLimits,
  getPowerPlaceClientWorkMeta,
  normalizeAccountPlan,
  normalizeClientGoalPhoto,
  normalizeCoverRef,
  normalizePowerPlaceComposition,
  normalizeTraditionAsset,
  updateClientGoalPhotoCategory
} from "../src/lib/powerPlaceClient.js";

const storageRefs = {
  slot: "storage://profile-cabinet-media/profile-1/power-place/draft/chess-1.png",
  center: "storage://profile-cabinet-media/profile-1/client-goal/center.png",
  legacyCover: "storage://profile-cabinet-media/profile-1/underlays/legacy.png",
  innerCover: "storage://profile-cabinet-media/profile-1/underlays/inner.png",
  outerCover: "storage://profile-cabinet-media/profile-1/underlays/outer.png"
};
const DEFAULT_MOTION_SETTINGS = {
  mode: "photo",
  count: 1,
  direction: "clockwise",
  step_seconds: 2,
  video_background_ref: ""
};

function normalizePowerPlaceCompositionWithoutDefaultMotion(composition) {
  const normalized = normalizePowerPlaceComposition(composition);
  delete normalized.object_refs.__motion_settings;
  return normalized;
}

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

assert.deepEqual(
  normalizePowerPlaceComposition({ object_refs: {} }).object_refs.__motion_settings,
  DEFAULT_MOTION_SETTINGS,
  "old compositions should load with default Фото motion settings"
);

assert.deepEqual(
  normalizePowerPlaceComposition({
    object_refs: {
      __motion_settings: {
        mode: "video",
        count: 4,
        direction: "counterclockwise",
        step_seconds: 3,
        video_background_ref: storageRefs.innerCover
      }
    }
  }).object_refs.__motion_settings,
  {
    mode: "video",
    count: 4,
    direction: "counterclockwise",
    step_seconds: 3,
    video_background_ref: storageRefs.innerCover
  },
  "valid motion settings should survive normalization inside object_refs.__motion_settings"
);

assert.deepEqual(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    object_refs: {
      __slot_transforms: {
        "chess-1": { x: 42, y: 58, zoom: 1.2, rotate: 90 },
        "chess-2": { x: 50, y: 50, zoom: 1, rotation: -90 }
      }
    }
  }).object_refs.__slot_transforms,
  {
    "chess-1": { x: 42, y: 58, zoom: 1.2, rotate: 90 },
    "chess-2": { x: 50, y: 50, zoom: 1, rotate: -90 }
  },
  "slot photo rotation must persist inside object_refs.__slot_transforms"
);

const normalizedUnsafeMotionRefs = normalizePowerPlaceComposition({
  object_refs: {
    __motion_settings: {
      mode: "gif",
      count: 99,
      direction: "sideways",
      step_seconds: 9,
      video_background_ref: "data:video/mp4;base64,local"
    },
    nested_unknown: { src: storageRefs.slot },
    "client-1": "data:image/png;base64,local",
    "client-2": "data:video/mp4;base64,local",
    "client-3": "https://example.supabase.co/storage/v1/object/sign/profile-cabinet-media/private.png?token=signed",
    "client-4": "https://example.com/durable.jpg"
  }
}).object_refs;

assert.deepEqual(
  normalizedUnsafeMotionRefs.__motion_settings,
  DEFAULT_MOTION_SETTINGS,
  "invalid motion settings should normalize to defaults"
);
assert.equal(normalizedUnsafeMotionRefs.nested_unknown, undefined, "arbitrary nested object_refs should not persist");
assert.equal(normalizedUnsafeMotionRefs["client-1"], undefined, "data:image object refs should not persist");
assert.equal(normalizedUnsafeMotionRefs["client-2"], undefined, "data:video object refs should not persist");
assert.equal(normalizedUnsafeMotionRefs["client-3"], undefined, "signed storage URLs should not persist");
assert.equal(normalizedUnsafeMotionRefs["client-4"], "https://example.com/durable.jpg", "ordinary durable refs should continue to persist");

const normalizedClientWorkRefs = normalizePowerPlaceComposition({
  id: "client-composition-1",
  title: "Кора · 1",
  object_refs: {
    __client_work: {
      client_key: " name: 1 ",
      client_profile_id: " client-profile-1 ",
      client_name: " 1 ",
      client_photo_id: " photo-1 ",
      request_text: " личный запрос ",
      source_composition_id: " source-1 ",
      result_composition_id: " result-1 ",
      status: "saved_for_client",
      ignored_object: { nested: true }
    }
  }
}).object_refs;
assert.deepEqual(
  normalizedClientWorkRefs.__client_work,
  {
    client_key: "name:1",
    client_profile_id: "client-profile-1",
    client_name: "1",
    client_photo_id: "photo-1",
    request_text: "личный запрос",
    source_composition_id: "source-1",
    result_composition_id: "result-1",
    status: "saved_for_client"
  },
  "save-for-client metadata should survive object_refs normalization and persist through refresh"
);

assert.deepEqual(
  getPowerPlaceClientWorkMeta({ id: "legacy-kora-1", title: "Кора · 1", object_refs: {} }),
  {
    client_key: "name:1",
    client_profile_id: "",
    client_name: "1",
    client_photo_id: "",
    request_text: "",
    source_composition_id: "",
    result_composition_id: "legacy-kora-1",
    status: "saved_for_client",
    legacy_inferred: true
  },
  "legacy rows written by the old save-for-client title format should be recoverable as client work"
);

assert.deepEqual(
  filterMasterPowerPlaceCompositions([
    { id: "global-1", title: "Глобальный шаблон", object_refs: {} },
    { id: "client-explicit", title: "Кора · 1", object_refs: { __client_work: { client_name: "1" } } },
    { id: "client-legacy", title: "Кора · 2", object_refs: {} }
  ]).map((item) => item.id),
  ["global-1"],
  "main saved mandala/template lists should exclude explicit and safely inferred client-scoped rows"
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


const templateComposition = {
  id: "template-1",
  profile_id: "master-1",
  title: "Шаблон услуги",
  constructor_type: "chess",
  chess_variant: "compact-5",
  object_refs: {
    "chess-1": storageRefs.slot,
    __center_image: "storage://profile-cabinet-media/master/template-center.png",
    __field_layout: "vertical"
  },
  object_ref_urls: {
    [storageRefs.slot]: "https://signed.example/slot.png"
  },
  central_photo_id: "template-photo"
};
const clientPhoto = {
  id: "client-photo-1",
  title: "Клиент",
  image_ref: storageRefs.center,
  display_url: "https://signed.example/client-center.png"
};
const clonedForOrder = clonePowerPlaceCompositionForOrder({
  template: templateComposition,
  masterProfileId: "master-1",
  serviceTitle: "Личная мандала",
  clientLabel: "Анна",
  clientPhoto
});
assert.equal(clonedForOrder.id, undefined, "clone payload must not keep template id");
assert.equal(clonedForOrder.profile_id, "master-1");
assert.equal(clonedForOrder.title, "Заказ: Личная мандала / Анна");
assert.equal(clonedForOrder.central_photo_id, "client-photo-1");
assert.equal(clonedForOrder.object_refs.__center_image, storageRefs.center, "client photo should be inserted only into clone center");
assert.equal(templateComposition.object_refs.__center_image, "storage://profile-cabinet-media/master/template-center.png", "template center must not be mutated");
assert.equal(clonedForOrder.object_refs["chess-1"], storageRefs.slot, "non-center template refs should be preserved in clone");
assert.notEqual(clonedForOrder.object_refs, templateComposition.object_refs, "clone must own a separate object_refs object");

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

assert.equal(normalizeAccountPlan("pro"), "practic");
assert.equal(normalizeAccountPlan("master"), "master");
assert.equal(normalizeAccountPlan("unknown"), "start");

assert.deepEqual(getPlanLimits("start"), {
  compositions: 7,
  clientPhotos: 10,
  dailyPhotoUploads: 7,
  clients: 5,
  trialServices: 0,
  paidServices: 0,
  hiddenPublications: 0,
  serviceItems: 0
});
assert.equal(getPlanLimits("practic").compositions, 25);
assert.equal(getPlanLimits("pro").clientPhotos, 10);
assert.equal(getPlanLimits("master").compositions, 50);
assert.equal(getPlanLimits("enterprise").compositions, 7);

{
  const originalFetch = globalThis.fetch;
  const originalConfigured = supabaseEnv.isConfigured;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      text: async () => ""
    };
  };
  supabaseEnv.isConfigured = true;

  try {
    const result = await deletePowerPlaceComposition(
      "composition-1",
      "profile-1",
      { access_token: "session-token" }
    );

    assert.equal(result, true);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      "/rest/v1/profile_cabinet_power_place_compositions?id=eq.composition-1&profile_id=eq.profile-1"
    );
    assert.equal(calls[0].options.method, "DELETE");
    assert.equal(calls[0].options.headers.Authorization, "Bearer session-token");
  } finally {
    globalThis.fetch = originalFetch;
    supabaseEnv.isConfigured = originalConfigured;
  }
}

await assert.rejects(
  () => deletePowerPlaceComposition("composition-1", "profile-1", null),
  /Нужно войти в кабинет/,
  "delete should require a session"
);

{
  const originalFetch = globalThis.fetch;
  const originalConfigured = supabaseEnv.isConfigured;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      text: async () => JSON.stringify([{
        id: "photo-1",
        profile_id: "profile-1",
        title: "Client",
        image_url: "https://example.com/client.jpg",
        image_bucket: "profile-cabinet-media",
        image_path: "",
        client_category: "client-2",
        notes: ""
      }])
    };
  };
  supabaseEnv.isConfigured = true;

  try {
    const updated = await updateClientGoalPhotoCategory(
      "photo-1",
      "profile-1",
      "client-2",
      { access_token: "session-token" }
    );

    assert.equal(updated.client_category, "client-2");
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      "/rest/v1/profile_cabinet_client_goal_photos?id=eq.photo-1&profile_id=eq.profile-1"
    );
    assert.equal(calls[0].options.method, "PATCH");
    assert.equal(calls[0].options.headers.Authorization, "Bearer session-token");
    assert.equal(calls[0].options.headers.Prefer, "return=representation");
    assert.deepEqual(JSON.parse(calls[0].options.body), { client_category: "client-2" });
  } finally {
    globalThis.fetch = originalFetch;
    supabaseEnv.isConfigured = originalConfigured;
  }
}

await assert.rejects(
  () => updateClientGoalPhotoCategory("photo-1", "profile-1", "zodiac", { access_token: "session-token" }),
  /Неизвестная папка фото/,
  "move should reject constructor-specific categories outside the client-category constraint"
);

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
    src: ""
  },
  "data:image cover refs should not persist"
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
    client_category: "all",
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
    client_category: "all",
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: " ДАО ",
    constructor_type: "dao",
    business_vertex_zone_count: 2,
    object_refs: {
      "dao-water": "https://example.com/water.jpg",
      "dao-fire": "https://example.com/fire.jpg",
      "dao-earth": "storage://profile-cabinet-media/profile-1/power-place/draft/dao-earth-uuid-earth.png",
      "dao-metal": "data:image/png;base64,local",
      __dao_layout_template_options: {
        topCrown: "three_checks",
        sideNodesVisible: false,
        sideNodeCount: 3
      }
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
      __dao_layout_template_options: {
        topCrown: "three_checks",
        sideNodesVisible: false,
        sideNodeCount: 3
      },
      __dao_layout_options: {
        topCrown: "three_checks",
        sideNodesVisible: false,
        sideNodeCount: 3
      },
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: " ДАО Макет ",
    constructor_type: "dao-layout",
    object_refs: {
      __dao_style: "talisman-2",
      __center_image: "https://example.com/center.jpg",
      "dao-talisman-2-3": "https://example.com/mini-3.jpg",
      "dao-talisman-2-4": "https://example.com/mini-4.jpg",
      "dao-talisman-2-5": "https://example.com/mini-5.jpg",
      "dao-talisman-2-7": "https://example.com/mini-7.jpg",
      __dao_layout_options: {
        topCrown: "three_checks",
        sideNodesVisible: false,
        sideNodeCount: 3
      }
    },
    central_photo_id: "photo-5"
  }).object_refs,
  {
    __dao_style: "talisman-2",
    __center_image: "https://example.com/center.jpg",
    "dao-talisman-2-3": "https://example.com/mini-3.jpg",
    "dao-talisman-2-4": "https://example.com/mini-4.jpg",
    "dao-talisman-2-5": "https://example.com/mini-5.jpg",
    "dao-talisman-2-7": "https://example.com/mini-7.jpg",
    __dao_layout_options: {
      topCrown: "three_checks",
      sideNodesVisible: false,
      sideNodeCount: 3
    },
    __field_layout: "square"
  }
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    constructor_type: "dao",
    object_refs: {
      __dao_style: "dao-layout-template",
      __dao_layout_template_options: { topCrown: "three_checks", sideNodeCount: 3 }
    }
  }).constructor_type,
  "dao-layout",
  "legacy dao-layout-template style should normalize to dao-layout format"
);

assert.deepEqual(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: " Звезда цели ",
    constructor_type: "star",
    geometry: 8,
    zodiac_visible_count: 6,
    star_variant: "open",
    star_format_variant: "star-2-10",
    object_refs: {
      "star-1": " https://example.com/star-top.jpg ",
      "star-2": "storage://profile-cabinet-media/profile-1/power-place/draft/star-2-uuid.png",
      "star-extra-1": "https://example.com/star-extra-1.jpg",
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
    star_format_variant: "star-2-10",
    chess_variant: "classic-14",
    cover_ref: null,
    object_refs: {
      "star-1": "https://example.com/star-top.jpg",
      "star-2": "storage://profile-cabinet-media/profile-1/power-place/draft/star-2-uuid.png",
      "star-extra-1": "https://example.com/star-extra-1.jpg",
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: " Звезда fallback ",
    constructor_type: "star",
    star_variant: "wide",
    star_format_variant: "wide",
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
    star_format_variant: "classic",
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({ constructor_type: "chess", chess_variant: "wide" }).chess_variant,
  "classic-14"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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

const normalizedServiceRefsComposition = normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
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
    "__center_frame_scale": "3.7",
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

const compactChessComposition = normalizePowerPlaceCompositionWithoutDefaultMotion({
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
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "zodiac",
    slot_scale: "0.35",
    object_refs: {
      "zodiac-1": "https://example.com/zodiac-1.jpg"
    }
  }).object_refs.__slot_scale,
  "0.35",
  "zodiac slot scale should preserve the smaller new minimum"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "star",
    object_refs: {
      __slot_scale: "1.12",
      "star-1": "https://example.com/star-1.jpg"
    }
  }).object_refs.__slot_scale,
  "1.12",
  "shared slot scale should survive load/update normalization from object_refs"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "chess",
    chess_variant: "plus-8",
    object_refs: { __slot_scale: "9" }
  }).object_refs.__slot_scale,
  "1.85",
  "shared slot scale persisted in object_refs should be clamped to new max"
);

// ── Scale limits: enlarged zodiac slider ranges ──────────────────────────────

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __slot_scale: "1.85" }
  }).object_refs.__slot_scale,
  "1.85",
  "slot scale at new max 1.85 should be preserved"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "zodiac",
    object_refs: { __slot_scale: "0.35" }
  }).object_refs.__slot_scale,
  "0.35",
  "zodiac slot scale at new min 0.35 should be preserved"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "zodiac",
    object_refs: { __slot_scale: "0.2" }
  }).object_refs.__slot_scale,
  "0.35",
  "zodiac slot scale below new min should clamp to 0.35"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __slot_scale: "2" }
  }).object_refs.__slot_scale,
  "1.85",
  "slot scale above new max should clamp to 1.85"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __inner_field_scale: "145" }
  }).object_refs.__inner_field_scale,
  "145",
  "field scale at new max 145 should be preserved"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __inner_field_scale: "200" }
  }).object_refs.__inner_field_scale,
  "145",
  "field scale above new max should clamp to 145"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __center_image_scale: "4" }
  }).object_refs.__center_image_scale,
  "4",
  "center image scale at new max 4 should be preserved"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __center_image_scale: "5" }
  }).object_refs.__center_image_scale,
  "4",
  "center image scale above new max should clamp to 4"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __center_frame_scale: "3.7" }
  }).object_refs.__center_frame_scale,
  "3.7",
  "center frame scale at new max 3.7 should be preserved"
);

assert.equal(
  normalizePowerPlaceCompositionWithoutDefaultMotion({
    constructor_type: "client",
    object_refs: { __center_frame_scale: "4" }
  }).object_refs.__center_frame_scale,
  "3.7",
  "center frame scale above new max should clamp to 3.7"
);

// ── Cover ref data contract ───────────────────────────────────────────────────
// cover_ref.inner and cover_ref.outer must survive normalization and hydration

{
  const innerRef = "storage://profile-cabinet-media/profile-1/underlays/inner.png";
  const outerRef = "storage://profile-cabinet-media/profile-1/underlays/outer.png";
  const comp = normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: "Test",
    constructor_type: "client",
    cover_ref: {
      id: "custom-cover", type: "image", src: innerRef,
      inner: { id: "custom-cover", type: "image", src: innerRef, display_src: "" },
      outer: { id: "custom-outer-cover", type: "image", src: outerRef, display_src: "" }
    }
  });
  assert.equal(comp.cover_ref.inner?.src, innerRef, "cover_ref.inner.src must survive normalization");
  assert.equal(comp.cover_ref.outer?.src, outerRef, "cover_ref.outer.src must survive normalization");
}

{
  const daoOuterRef = "/symbols/power-place/dao/backgrounds/fu-paper-slip.svg";
  const comp = normalizePowerPlaceCompositionWithoutDefaultMotion({
    profile_id: "profile-1",
    title: "DAO contain fit",
    constructor_type: "dao",
    cover_ref: {
      id: "custom-cover",
      type: "none",
      src: "",
      inner: { id: "no-cover", type: "none", src: "" },
      outer: {
        id: "background-dao-fu-paper-slip-reference",
        label: "Фу-лист",
        type: "image",
        src: daoOuterRef,
        fit: "contain",
        cover_fit: "contain"
      }
    }
  });
  assert.equal(comp.cover_ref.outer?.src, daoOuterRef, "DAO library outer cover src must survive normalization");
  assert.equal(comp.cover_ref.outer?.fit, "contain", "DAO library outer cover fit must survive normalization");
  assert.equal(comp.cover_ref.outer?.cover_fit, "contain", "DAO library outer cover cover_fit alias must survive normalization");
}

{
  // Cover upload flow uses image_ref / image_url (durable storage ref), not data:image.
  // Verify the upload handler source pattern in ProfileLitePage.
  const { readFileSync } = await import("node:fs");
  const pageSource = readFileSync("src/pages/ProfileLitePage.jsx", "utf8");
  const uploadFnMatch = pageSource.match(/handleCompositionCoverFileUpload[\s\S]*?savedImageRef = savedPhoto\?\.image_ref \|\| savedPhoto\?\.image_url/);
  assert.ok(uploadFnMatch, "cover upload must derive src from image_ref or image_url (durable ref, not data:image)");
}

{
  // object_ref_urls must keep display URL mapped by durable storage ref
  const durableRef = "storage://profile-cabinet-media/profile-1/underlays/bg.png";
  const signedUrl = "https://signed.example/bg.png";
  const hydrated = __testPowerPlaceClient.hydrateCompositionRowsWithSignedUrls([
    {
      id: "comp-ref-test",
      object_refs: { __center_image: durableRef },
      cover_ref: {
        inner: { id: "custom-cover", type: "image", src: durableRef }
      }
    }
  ], { [durableRef]: signedUrl })[0];
  assert.equal(hydrated.object_ref_urls[durableRef], signedUrl, "object_ref_urls must be keyed by durable storage ref");
}

// ─── gradient cover_ref persistence ──────────────────────────────────────────

assert.deepEqual(
  normalizeCoverRef({
    id: "cover-gradient-gold",
    label: "Золото",
    type: "placeholder",
    tone: "gradient-gold",
    src: ""
  }),
  {
    id: "cover-gradient-gold",
    label: "Золото",
    type: "placeholder",
    tone: "gradient-gold",
    src: ""
  },
  "gradient placeholder covers should persist via tone"
);

assert.deepEqual(
  normalizeCoverRef({
    id: "cover-gradient-water",
    label: "Вода",
    type: "placeholder",
    tone: "gradient-water",
    src: "",
    inner: { id: "cover-gradient-water", type: "placeholder", tone: "gradient-water", src: "" },
    outer: { id: "cover-gradient-fire", type: "placeholder", tone: "gradient-fire", src: "" }
  }),
  {
    id: "cover-gradient-water",
    label: "Вода",
    type: "placeholder",
    tone: "gradient-water",
    src: "",
    inner: { id: "cover-gradient-water", label: "Вода", type: "placeholder", tone: "gradient-water", src: "" },
    outer: { id: "cover-gradient-fire", label: "Без фона", type: "placeholder", tone: "gradient-fire", src: "" }
  },
  "nested inner/outer gradient placeholder covers should persist via tone"
);

// ── __visibility_settings persistence ────────────────────────────────────────
{
  const comp = normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Visibility test",
    constructor_type: "zodiac",
    object_refs: {
      __visibility_settings: {
        center: false,
        slots: false,
        outer_cover: false,
        inner_cover: false
      }
    }
  });
  assert.deepEqual(
    comp.object_refs.__visibility_settings,
    { center: false, slots: false, outer_cover: false, inner_cover: false },
    "__visibility_settings with all false must survive normalization"
  );
}

{
  const comp = normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Visibility defaults",
    constructor_type: "zodiac",
    object_refs: {}
  });
  assert.equal(
    comp.object_refs.__visibility_settings,
    undefined,
    "old composition without __visibility_settings should not inject the key"
  );
}

{
  const comp = normalizePowerPlaceComposition({
    profile_id: "profile-1",
    title: "Visibility partial",
    constructor_type: "zodiac",
    object_refs: {
      __visibility_settings: { center: false }
    }
  });
  assert.deepEqual(
    comp.object_refs.__visibility_settings,
    { center: false },
    "partial __visibility_settings should be preserved as-is through normalization"
  );
}
