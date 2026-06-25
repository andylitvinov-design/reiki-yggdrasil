import assert from "node:assert/strict";

import {
  MATERIAL_GROUP_TABS,
  buildMaterialPayloadFromSelection,
  getDefaultMaterialFilterSelection,
  getMaterialCategoryOptions,
  getMaterialSubcategoryOptions,
  getUnclassifiedMaterialSelection,
  materialImageMatchesSelection,
  normalizeMaterialSelection
} from "../src/pages/profile-lite/profileLiteMaterialTaxonomy.js";

assert.deepEqual(
  MATERIAL_GROUP_TABS.map((group) => [group.value, group.label, group.fullLabel]),
  [
    ["dao-ri", "РИ", "ДАО РИ"],
    ["channels", "Каналы", "Каналы"],
    ["god-channels", "Боги", "Боги / Мистерии"]
  ]
);

const godCategories = getMaterialCategoryOptions("god-channels");
assert.ok(godCategories.some((category) => category.value === "greek" && category.label === "Греческие мистерии"));

const greekEntities = getMaterialSubcategoryOptions("god-channels", "greek");
assert.ok(greekEntities.some((entity) => entity.value === "zeus" && entity.label === "Зевс"));
assert.ok(greekEntities.some((entity) => entity.value === "hera" && entity.label === "Гера"));
assert.ok(greekEntities.some((entity) => entity.value === "athena" && entity.label === "Афина"));

const daoCategories = getMaterialCategoryOptions("dao-ri");
assert.equal(daoCategories[0].value, "unclassified");
assert.equal(daoCategories[0].label, "Неразобранно");
assert.ok(daoCategories[1].value.startsWith("level-"));
assert.match(daoCategories[1].label, /^1\. /);

const daoSubcategories = getMaterialSubcategoryOptions("dao-ri", daoCategories[1].value);
assert.ok(daoSubcategories.some((option) => option.step_id === "RY-L01-S01" && option.setting_title === "Лечение"));

const channelsCategories = getMaterialCategoryOptions("channels");
assert.deepEqual(
  channelsCategories.map((category) => category.label),
  ["Неразобранно", "Сефирот", "Руны", "Планеты", "Деньги", "Жизнь"]
);
assert.deepEqual(getMaterialSubcategoryOptions("channels", channelsCategories[1].value), [
  {
    value: "all-channels",
    label: "Все каналы",
    group: "channels",
    step_id: "all-channels",
    step_title: "Все каналы",
    setting_title: "Все каналы",
    setting_index: null
  }
]);

const filterDefault = getDefaultMaterialFilterSelection();
assert.deepEqual(
  {
    group: filterDefault.group,
    categoryValue: filterDefault.categoryValue,
    subcategoryValue: filterDefault.subcategoryValue
  },
  { group: "all", categoryValue: "all", subcategoryValue: "all" },
  "material browser filter must start from Все, not the first concrete category"
);

const uploadDefault = getUnclassifiedMaterialSelection();
assert.deepEqual(
  {
    group: uploadDefault.group,
    categoryValue: uploadDefault.categoryValue,
    subcategoryValue: uploadDefault.subcategoryValue
  },
  { group: "dao-ri", categoryValue: "unclassified", subcategoryValue: "unclassified" },
  "material upload must default to explicit Неразобранно"
);

assert.deepEqual(buildMaterialPayloadFromSelection(uploadDefault), {
  group: "unclassified",
  category: "unclassified",
  subcategory: "unclassified",
  step_id: "",
  step_title: "",
  setting_title: "",
  setting_index: null,
  type: "mandala"
});

assert.equal(
  materialImageMatchesSelection(
    { kind: "material", material_group: "channels", category: "Деньги", subcategory: "Все каналы" },
    filterDefault
  ),
  true,
  "all material filter should show already-classified materials"
);

assert.equal(
  materialImageMatchesSelection(
    { kind: "material", material_group: "uncategorized", category: "uncategorized", subcategory: "uncategorized" },
    uploadDefault
  ),
  true,
  "unclassified filter should remain backward-compatible with legacy uncategorized rows"
);

const normalizedGodSelection = normalizeMaterialSelection("god-channels", "greek", "zeus");
assert.equal(normalizedGodSelection.group, "god-channels");
assert.equal(normalizedGodSelection.categoryValue, "greek");
assert.equal(normalizedGodSelection.subcategoryValue, "zeus");

assert.deepEqual(buildMaterialPayloadFromSelection(normalizedGodSelection), {
  group: "god-channels",
  category: "Греческие мистерии",
  subcategory: "Зевс",
  step_id: "zeus",
  step_title: "Зевс",
  setting_title: "Зевс",
  setting_index: null,
  type: "mandala"
});

const daoSelection = normalizeMaterialSelection("dao-ri", daoCategories[1].value, daoSubcategories[0].value);
const daoPayload = buildMaterialPayloadFromSelection(daoSelection);
assert.equal(daoPayload.group, "dao-ri");
assert.equal(daoPayload.category, daoSelection.categoryOption.label);
assert.equal(daoPayload.subcategory, daoSelection.subcategoryOption.label);
assert.equal(daoPayload.step_id, daoSelection.subcategoryOption.step_id);
assert.equal(daoPayload.type, "mandala");

assert.equal(
  materialImageMatchesSelection(
    {
      kind: "material",
      material_group: "god-channels",
      category: "Греческие мистерии",
      subcategory: "Зевс"
    },
    normalizedGodSelection
  ),
  true,
  "material type must not be required for taxonomy matching"
);

assert.equal(
  materialImageMatchesSelection(
    {
      kind: "material",
      material_group: "god-channels",
      category: "Римские мистерии",
      subcategory: "Юпитер",
      material_type: "artifact"
    },
    normalizedGodSelection
  ),
  false,
  "structured category/subcategory mismatch should be filtered out"
);
