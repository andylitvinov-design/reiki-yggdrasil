import assert from "node:assert/strict";

import {
  MATERIAL_GROUP_TABS,
  buildMaterialPayloadFromSelection,
  getMaterialCategoryOptions,
  getMaterialSubcategoryOptions,
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
assert.ok(daoCategories[0].value.startsWith("level-"));
assert.match(daoCategories[0].label, /^1\. /);

const daoSubcategories = getMaterialSubcategoryOptions("dao-ri", daoCategories[0].value);
assert.ok(daoSubcategories.some((option) => option.step_id === "RY-L01-S01" && option.setting_title === "Лечение"));

const channelsCategories = getMaterialCategoryOptions("channels");
assert.deepEqual(
  channelsCategories.map((category) => category.label),
  ["Сефирот", "Руны", "Планеты", "Деньги", "Жизнь"]
);
assert.deepEqual(getMaterialSubcategoryOptions("channels", channelsCategories[0].value), [
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

const normalizedGodSelection = normalizeMaterialSelection("god-channels", daoCategories[0].value, daoSubcategories[0].value);
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

const daoSelection = normalizeMaterialSelection("dao-ri", daoCategories[0].value, daoSubcategories[0].value);
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
