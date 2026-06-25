import { reikiLevels } from "../../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../../data/reikiStepSettings.js";
import { mysteryTraditions } from "../../data/mysteryTraditions.js";
import {
  TAXONOMY_ALL,
  TAXONOMY_UNCLASSIFIED,
  TAXONOMY_UNCLASSIFIED_LABEL
} from "../../lib/profileMaterialsClient.js";

export const MATERIAL_GROUP_TABS = [
  { value: "dao-ri", label: "РИ", fullLabel: "ДАО РИ" },
  { value: "channels", label: "Каналы", fullLabel: "Каналы" },
  { value: "god-channels", label: "Боги", fullLabel: "Боги / Мистерии" }
];

const LEGACY_GROUP_LABELS = {
  "dao-ri": ["ДАО РИ", "РИ"],
  channels: ["Каналы"],
  "god-channels": ["Мистерии", "Боги", "Боги / Мистерии"],
  form: ["Форма"]
};

const CHANNEL_CATEGORY_OPTIONS = [
  { value: "sefirot", label: "Сефирот" },
  { value: "runes", label: "Руны" },
  { value: "planets", label: "Планеты" },
  { value: "money", label: "Деньги" },
  { value: "life", label: "Жизнь" }
].map((option) => ({ ...option, group: "channels" }));

const ALL_OPTION = { value: TAXONOMY_ALL, label: "Все" };
const UNCLASSIFIED_OPTION = {
  value: TAXONOMY_UNCLASSIFIED,
  label: TAXONOMY_UNCLASSIFIED_LABEL,
  group: TAXONOMY_UNCLASSIFIED
};

function text(value) {
  return String(value || "").trim();
}

function searchText(value) {
  return text(value).toLowerCase();
}

function values(...items) {
  return items
    .flatMap((item) => Array.isArray(item) ? item : [item])
    .map(text)
    .filter(Boolean);
}

function sameText(left, right) {
  return searchText(left) === searchText(right);
}

function isAllValue(value) {
  return text(value) === TAXONOMY_ALL;
}

function isUnclassifiedValue(value) {
  const normalized = searchText(value);
  return normalized === TAXONOMY_UNCLASSIFIED || normalized === "uncategorized" || normalized === searchText(TAXONOMY_UNCLASSIFIED_LABEL);
}

function withUnclassified(options) {
  return [UNCLASSIFIED_OPTION, ...(options || [])];
}

function levelByCategoryValue(categoryValue) {
  const levelId = Number(text(categoryValue).replace(/^level-/, ""));
  return reikiLevels.find((level) => level.id === levelId) || reikiLevels[0] || null;
}

function stepOptionsForLevel(level) {
  return (level?.steps || []).flatMap((step) => {
    const settings = sourcedStepSettings[step.id] || step.settings || [];
    if (!settings.length) {
      return [{
        value: step.id,
        label: `${level.stepLabel} ${step.number}: ${step.title}`,
        group: "dao-ri",
        step_id: step.id,
        step_title: step.title,
        setting_title: "",
        setting_index: null
      }];
    }
    return settings.map((setting, index) => ({
      value: `${step.id}::${setting.title}`,
      label: `${level.stepLabel} ${step.number}: ${step.title} · ${setting.title}`,
      group: "dao-ri",
      step_id: step.id,
      step_title: step.title,
      setting_title: setting.title,
      setting_index: index + 1
    }));
  });
}

export function getMaterialCategoryOptions(group) {
  if (group === TAXONOMY_ALL) return [ALL_OPTION, UNCLASSIFIED_OPTION];
  if (group === "god-channels") {
    return withUnclassified(mysteryTraditions.map((tradition) => ({
      value: tradition.id,
      label: tradition.title,
      group: "god-channels",
      traditionId: tradition.id
    })));
  }
  if (group === "channels") return withUnclassified(CHANNEL_CATEGORY_OPTIONS);
  return withUnclassified(reikiLevels.map((level) => ({
    value: `level-${level.id}`,
    label: `${level.id}. ${level.name}`,
    group: "dao-ri",
    levelId: level.id
  })));
}

export function getMaterialSubcategoryOptions(group, categoryValue) {
  if (group === TAXONOMY_ALL || isAllValue(categoryValue)) return [ALL_OPTION];
  if (isUnclassifiedValue(group) || isUnclassifiedValue(categoryValue)) return [UNCLASSIFIED_OPTION];
  if (group === "god-channels") {
    const tradition = mysteryTraditions.find((item) => item.id === categoryValue) || mysteryTraditions[0] || null;
    return (tradition?.entities || []).map((entity) => ({
      value: entity.id,
      label: entity.title,
      group: "god-channels",
      entity_id: entity.id,
      entity_title: entity.title,
      step_id: entity.id,
      step_title: entity.title,
      setting_title: entity.title,
      setting_index: null
    }));
  }
  if (group === "channels") {
    return [{
      value: "all-channels",
      label: "Все каналы",
      group: "channels",
      step_id: "all-channels",
      step_title: "Все каналы",
      setting_title: "Все каналы",
      setting_index: null
    }];
  }
  return stepOptionsForLevel(levelByCategoryValue(categoryValue));
}

export function getDefaultMaterialSelection(group = "dao-ri") {
  const normalizedGroup = MATERIAL_GROUP_TABS.some((item) => item.value === group) ? group : "dao-ri";
  const categoryOption = getMaterialCategoryOptions(normalizedGroup)[0] || null;
  const subcategoryOption = getMaterialSubcategoryOptions(normalizedGroup, categoryOption?.value)[0] || null;
  return {
    group: normalizedGroup,
    categoryValue: categoryOption?.value || "",
    subcategoryValue: subcategoryOption?.value || "",
    categoryOption,
    subcategoryOption
  };
}

export function getUnclassifiedMaterialSelection(group = "dao-ri") {
  const normalizedGroup = MATERIAL_GROUP_TABS.some((item) => item.value === group) ? group : "dao-ri";
  return {
    group: normalizedGroup,
    categoryValue: TAXONOMY_UNCLASSIFIED,
    subcategoryValue: TAXONOMY_UNCLASSIFIED,
    categoryOption: UNCLASSIFIED_OPTION,
    subcategoryOption: UNCLASSIFIED_OPTION
  };
}

export function getDefaultMaterialFilterSelection() {
  return {
    group: TAXONOMY_ALL,
    categoryValue: TAXONOMY_ALL,
    subcategoryValue: TAXONOMY_ALL,
    categoryOption: ALL_OPTION,
    subcategoryOption: ALL_OPTION
  };
}

export function normalizeMaterialSelection(group = "dao-ri", categoryValue = "", subcategoryValue = "") {
  if (isAllValue(group)) return getDefaultMaterialFilterSelection();
  const normalizedGroup = MATERIAL_GROUP_TABS.some((item) => item.value === group) ? group : "dao-ri";
  const categories = getMaterialCategoryOptions(normalizedGroup);
  const categoryOption = categories.find((option) => option.value === categoryValue) || categories.find((option) => option.value === TAXONOMY_UNCLASSIFIED) || categories[0] || null;
  const subcategories = getMaterialSubcategoryOptions(normalizedGroup, categoryOption?.value);
  const subcategoryOption = subcategories.find((option) => option.value === subcategoryValue) || subcategories.find((option) => option.value === TAXONOMY_UNCLASSIFIED) || subcategories[0] || null;
  return {
    group: normalizedGroup,
    categoryValue: categoryOption?.value || "",
    subcategoryValue: subcategoryOption?.value || "",
    categoryOption,
    subcategoryOption
  };
}

export function buildMaterialPayloadFromSelection(selection) {
  const normalized = normalizeMaterialSelection(selection?.group, selection?.categoryValue, selection?.subcategoryValue);
  const { group, categoryOption, subcategoryOption } = normalized;
  if (isAllValue(group) || isUnclassifiedValue(group) || isUnclassifiedValue(categoryOption?.value) || isUnclassifiedValue(subcategoryOption?.value)) {
    return {
      group: TAXONOMY_UNCLASSIFIED,
      category: TAXONOMY_UNCLASSIFIED,
      subcategory: TAXONOMY_UNCLASSIFIED,
      step_id: "",
      step_title: "",
      setting_title: "",
      setting_index: null,
      type: "mandala"
    };
  }
  if (group === "god-channels") {
    return {
      group,
      category: categoryOption?.label || "",
      subcategory: subcategoryOption?.label || "",
      step_id: subcategoryOption?.entity_id || "",
      step_title: subcategoryOption?.entity_title || "",
      setting_title: subcategoryOption?.entity_title || "",
      setting_index: null,
      type: "mandala"
    };
  }
  if (group === "channels") {
    return {
      group,
      category: categoryOption?.label || "",
      subcategory: subcategoryOption?.label || "",
      step_id: subcategoryOption?.value || categoryOption?.value || "",
      step_title: subcategoryOption?.label || categoryOption?.label || "",
      setting_title: subcategoryOption?.label || "",
      setting_index: null,
      type: "mandala"
    };
  }
  return {
    group,
    category: categoryOption?.label || "",
    subcategory: subcategoryOption?.label || "",
    step_id: subcategoryOption?.step_id || "",
    step_title: subcategoryOption?.step_title || "",
    setting_title: subcategoryOption?.setting_title || "",
    setting_index: subcategoryOption?.setting_index ?? null,
    type: "mandala"
  };
}

export function normalizeMaterialImageMetadata(image) {
  return {
    group: values(image?.materialGroup, image?.material_group, image?.group),
    category: values(image?.category, image?.stepTitle, image?.step_title),
    subcategory: values(image?.subcategory, image?.material_subcategory, image?.settingTitle, image?.setting_title),
    stepId: values(image?.stepId, image?.step_id),
    legacyText: searchText([image?.label, image?.meta].filter(Boolean).join(" "))
  };
}

function matchesSelected(valuesToCheck, selectedValue, selectedLabel, legacyText = "") {
  if (!selectedValue && !selectedLabel) return true;
  if (!valuesToCheck.length) return true;
  if (valuesToCheck.some((value) => sameText(value, selectedValue) || sameText(value, selectedLabel))) return true;
  return Boolean(legacyText && [selectedValue, selectedLabel].filter(Boolean).some((value) => legacyText.includes(searchText(value))));
}

export function materialImageMatchesSelection(image, selection) {
  const normalized = normalizeMaterialSelection(selection?.group, selection?.categoryValue, selection?.subcategoryValue);
  if (normalized.group === TAXONOMY_ALL) return true;
  const metadata = normalizeMaterialImageMetadata(image);
  if (isUnclassifiedValue(normalized.categoryValue) || isUnclassifiedValue(normalized.subcategoryValue)) {
    return [...metadata.group, ...metadata.category, ...metadata.subcategory].some(isUnclassifiedValue)
      || metadata.group.length + metadata.category.length + metadata.subcategory.length === 0;
  }
  const groupLabels = LEGACY_GROUP_LABELS[normalized.group] || [];
  return (
    matchesSelected(metadata.group, normalized.group, groupLabels[0], metadata.legacyText)
    && (groupLabels.length === 0 || groupLabels.some((label) => !metadata.legacyText || metadata.legacyText.includes(searchText(label))) || metadata.group.length > 0)
    && matchesSelected(
      [...metadata.category, ...metadata.stepId],
      normalized.categoryValue,
      normalized.categoryOption?.label,
      metadata.legacyText
    )
    && matchesSelected(
      metadata.subcategory,
      normalized.subcategoryValue,
      normalized.subcategoryOption?.label,
      metadata.legacyText
    )
  );
}
