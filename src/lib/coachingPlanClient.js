import { orderHasClientVisibleResult } from "./profileServicesClient.js";

export const COACHING_PLAN_SECTIONS = [
  { id: "direction", title: "Направление и смысл", description: "Ценности, видение жизни и личные приоритеты." },
  { id: "wellbeing", title: "Благополучие и энергия", description: "Стресс, восстановление, здоровье повседневных ритмов." },
  { id: "relationships", title: "Отношения и семья", description: "Близость, коммуникация, семья и личные границы." },
  { id: "career", title: "Работа и карьера", description: "Профессиональное направление, развитие и баланс." },
  { id: "money", title: "Деньги и ресурсы", description: "Финансовые цели, ресурсы и решения; без автоматических финансовых рекомендаций." },
  { id: "growth", title: "Личностный рост", description: "Обучение, навыки, уверенность и личные изменения." },
  { id: "lifestyle", title: "Образ жизни и окружение", description: "Дом, привычки, место проживания и социальная среда." },
  { id: "goals", title: "Цели и план действий", description: "Приоритеты, этапы, сроки и конкретные следующие шаги." },
  { id: "reflection", title: "Рефлексия и пересмотр", description: "Что изменилось, что помогает и что стоит пересмотреть." }
];

const EMPTY_SECTION = Object.freeze({
  current_state: "",
  desired_state: "",
  next_steps: "",
  notes: "",
  visibility: "private"
});

export function normalizeCoachingPlanSections(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(COACHING_PLAN_SECTIONS.map(({ id }) => {
    const item = source[id] && typeof source[id] === "object" && !Array.isArray(source[id]) ? source[id] : {};
    return [id, {
      current_state: String(item.current_state || ""),
      desired_state: String(item.desired_state || ""),
      next_steps: String(item.next_steps || ""),
      notes: String(item.notes || ""),
      visibility: "private"
    }];
  }));
}

export function hasCoachingPlanContent(sections = {}) {
  return COACHING_PLAN_SECTIONS.some(({ id }) => {
    const item = sections?.[id] || EMPTY_SECTION;
    return [item.current_state, item.desired_state, item.next_steps, item.notes]
      .some((value) => typeof value === "string" && value.trim().length > 0);
  });
}

export function getClientVisibleConsultationReports(orders = []) {
  return (Array.isArray(orders) ? orders : [])
    .filter((order) => orderHasClientVisibleResult(order))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
