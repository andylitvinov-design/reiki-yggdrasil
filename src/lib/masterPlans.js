const SAFE_PLAN_VALUES = ["start", "practic", "master"];
const LEGACY_PLAN_ALIASES = {
  practice: "practic",
  pro: "practic"
};

export const MASTER_PLAN_VALUES = SAFE_PLAN_VALUES;

export const MASTER_PLAN_CONFIG = [
  {
    value: "start",
    label: "Start",
    priceLabel: "0 €/мес",
    summary: "Для старта и первых материалов.",
    ctaLabel: "Текущий базовый режим",
    limits: {
      compositions: 7,
      dailyPhotoUploads: 7,
      clients: 5,
      clientPhotos: 5,
      trialServices: 0,
      paidServices: 0,
      hiddenPublications: 0,
      serviceItems: 0
    }
  },
  {
    value: "practic",
    label: "Practic",
    priceLabel: "10 €/мес",
    summary: "Для регулярной практики и пробных услуг.",
    ctaLabel: "Подключить Practic",
    paymentEnvName: "VITE_PRACTIC_PAYMENT_LINK",
    limits: {
      compositions: 25,
      dailyPhotoUploads: 20,
      clients: 10,
      clientPhotos: 10,
      trialServices: 3,
      paidServices: 0,
      hiddenPublications: 0,
      serviceItems: 3
    }
  },
  {
    value: "master",
    label: "Master",
    priceLabel: "25 €/мес",
    summary: "Для платных услуг, большего каталога и управления видимостью публикаций.",
    ctaLabel: "Подключить Master",
    paymentEnvName: "VITE_MASTER_PAYMENT_LINK",
    limits: {
      compositions: 50,
      dailyPhotoUploads: 40,
      clients: 25,
      clientPhotos: 25,
      trialServices: 10,
      paidServices: 10,
      hiddenPublications: 10,
      serviceItems: 10
    }
  }
];

const PLAN_BY_VALUE = new Map(MASTER_PLAN_CONFIG.map((plan) => [plan.value, plan]));

function text(value) {
  return String(value || "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

export function normalizeMasterPlan(plan) {
  const normalized = lower(plan);
  const aliased = LEGACY_PLAN_ALIASES[normalized] || normalized;
  return SAFE_PLAN_VALUES.includes(aliased) ? aliased : "start";
}

export function isOwnerAdminUser(user, adminEmail = "") {
  return Boolean(user?.email && adminEmail && lower(user.email) === lower(adminEmail));
}

export function resolveProfileMasterPlan(profile = null, user = null, adminEmail = "") {
  if (profile?.account_plan) return normalizeMasterPlan(profile.account_plan);
  return isOwnerAdminUser(user, adminEmail) ? "practic" : "start";
}

export function getMasterPlan(plan) {
  return PLAN_BY_VALUE.get(normalizeMasterPlan(plan)) || PLAN_BY_VALUE.get("start");
}

export function getMasterPlanLimit(plan, limitKey) {
  const limit = Number(getMasterPlan(plan)?.limits?.[limitKey]);
  return Number.isFinite(limit) ? limit : 0;
}

export function masterPlanLimitMessage(plan, limitKey) {
  const activePlan = getMasterPlan(plan);
  const limit = getMasterPlanLimit(activePlan.value, limitKey);
  const noun = ({
    compositions: "сохранённых мандал",
    clientPhotos: "фото клиентов / целей",
    clients: "клиентов",
    trialServices: "пробных услуг",
    paidServices: "платных услуг",
    hiddenPublications: "скрытых публикаций",
    serviceItems: "услуг"
  })[limitKey] || "элементов";
  return `Лимит ${limit} ${noun} для режима ${activePlan.label} достигнут.`;
}

export function canCreateWithinPlanLimit(plan, limitKey, currentCount) {
  const limit = getMasterPlanLimit(plan, limitKey);
  const count = Math.max(0, Number(currentCount) || 0);
  return {
    allowed: limit > 0 && count < limit,
    limit,
    count,
    message: masterPlanLimitMessage(plan, limitKey)
  };
}

export function getMasterPlanPaymentLink(plan, env = import.meta.env || {}) {
  const envName = getMasterPlan(plan)?.paymentEnvName;
  if (!envName) return "";
  const value = text(env?.[envName]);
  return /^https?:\/\//.test(value) ? value : "";
}

export function isPaidServiceDraft(service = {}) {
  return Number(service?.price_amount || 0) > 0;
}
