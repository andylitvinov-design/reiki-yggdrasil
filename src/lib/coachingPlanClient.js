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
      current_state: String(item.current_state || "").trim(),
      desired_state: String(item.desired_state || "").trim(),
      next_steps: String(item.next_steps || "").trim(),
      notes: String(item.notes || "").trim(),
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

const COACHING_PLAN_RECOMMENDATION_ROWS = [["direction","Прояснить личное направление","Life Purpose Coach","Ценности и жизненное направление","Сформулировать личные ориентиры и критерии выбора.","Strategic Life Coach","Видение и приоритеты","Перевести ориентиры в реалистичные цели и первые шаги."],["wellbeing","Восстановить ресурс и устойчивость","Stress Recovery Coach","Стресс и восстановление","Определить источники перегрузки и подходящие способы поддержки.","Wellbeing Coach","Энергия и повседневные привычки","Составить бережный план устойчивых ежедневных действий."],["relationships","Улучшить качество отношений","Relationship Coach","Запрос и динамика отношений","Прояснить потребности, повторяющиеся ситуации и желаемые изменения.","Communication & Boundaries Specialist","Диалог и личные границы","Подготовить способы общения и обозначения границ."],["career","Выстроить профессиональное направление","Career Coach","Сильные стороны и профессиональный выбор","Выделить подходящие направления и критерии следующей роли.","Executive & Strategy Coach","Карьерный план","Составить маршрут развития, этапы и ближайшие действия."],["money","Упорядочить цели и решения о ресурсах","Financial Wellbeing Coach","Цели и денежные привычки","Сформулировать личные цели и вопросы для дальнейшей работы.","Business & Career Coach","Ресурсы и возможности","Исследовать навыки и профессиональные возможности; это не финансовая консультация."],["growth","Создать маршрут личного развития","Personal Growth Coach","Паттерны и точки роста","Выделить приоритетную тему развития и критерий прогресса.","Learning & Skills Coach","Навыки и практика","Составить план обучения и регулярной практики."],["lifestyle","Согласовать образ жизни с приоритетами","Lifestyle Coach","Привычки и среда","Определить изменения в распорядке, окружении и пространстве.","Transition Coach","Переход к новому укладу","Подготовить последовательные шаги на период перемен."],["goals","Перевести планы в действия","Strategic Coach","Цели и приоритеты","Выбрать измеримые цели и согласовать последовательность.","Accountability Coach","План действий и обзор прогресса","Определить контрольные точки и регулярный пересмотр результатов."],["reflection","Осмыслить изменения и обновить план","Integrative Coach","Итоги и новые ориентиры","Увидеть динамику и сформулировать актуальный запрос.","Relevant Domain Specialist","Тематическая сессия по выбранной сфере","Углубить одну тему, которая стала приоритетной после обзора."]];

export function getCoachingPlanRecommendation(sectionId) {
  const row = COACHING_PLAN_RECOMMENDATION_ROWS.find(([id]) => id === sectionId);
  if (!row) return null;
  return {
    heading: row[1],
    sessions: [
      { specialist: row[2], format: row[3], outcome: row[4] },
      { specialist: row[5], format: row[6], outcome: row[7] }
    ]
  };
}
