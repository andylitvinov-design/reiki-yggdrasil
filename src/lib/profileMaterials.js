export const MATERIAL_TYPES = [
  { value: "mandala", label: "Мандала" },
  { value: "artifact", label: "Артефакт" },
  { value: "practice", label: "Практика" }
];

export const MATERIAL_STATUSES = [
  { value: "draft", label: "черновик" },
  { value: "pending", label: "на модерации" },
  { value: "approved", label: "опубликован" },
  { value: "rejected", label: "нужна правка" }
];

export function createEmptyMaterialForm() {
  return {
    type: "mandala",
    step_id: "",
    step_title: "",
    setting_title: "",
    setting_index: null,
    title: "",
    description: "",
    image_url: "",
    status: "draft"
  };
}

export function publicationTypeLabel(type) {
  return MATERIAL_TYPES.find((item) => item.value === type)?.label || "Мандала";
}

export function materialStatusText(status) {
  return MATERIAL_STATUSES.find((item) => item.value === status)?.label || "черновик";
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanType(value) {
  return MATERIAL_TYPES.some((item) => item.value === value) ? value : "mandala";
}

function cleanStatus(value) {
  return MATERIAL_STATUSES.some((item) => item.value === value) ? value : "draft";
}

function cleanSettingIndex(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export function normalizeMaterialForm(form, requestedStatus = form?.status) {
  return {
    type: cleanType(form?.type),
    step_id: cleanText(form?.step_id),
    step_title: cleanText(form?.step_title),
    setting_title: cleanText(form?.setting_title),
    setting_index: cleanSettingIndex(form?.setting_index),
    title: cleanText(form?.title),
    description: cleanText(form?.description),
    image_url: cleanText(form?.image_url),
    status: cleanStatus(requestedStatus)
  };
}
