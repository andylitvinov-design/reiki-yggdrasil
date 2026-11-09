import { supabaseRequest } from "./supabaseClient.js";

export const LIFE_PLAN_SECTIONS = [
  { key:"direction", icon:"✧", title:{ru:"Направление и смысл",en:"Direction & meaning",es:"Dirección y sentido"}, hint:{ru:"Ценности, жизненное направление и приоритеты",en:"Values, direction and priorities",es:"Valores, dirección y prioridades"} },
  { key:"wellbeing", icon:"♡", title:{ru:"Благополучие и энергия",en:"Wellbeing & energy",es:"Bienestar y energía"}, hint:{ru:"Стресс, восстановление и ежедневный ритм",en:"Stress, recovery and daily rhythm",es:"Estrés, recuperación y ritmo diario"} },
  { key:"relationships", icon:"⌂", title:{ru:"Отношения и семья",en:"Relationships & family",es:"Relaciones y familia"}, hint:{ru:"Близость, коммуникация и личные границы",en:"Connection, communication and boundaries",es:"Conexión, comunicación y límites"} },
  { key:"career", icon:"↗", title:{ru:"Работа и карьера",en:"Work & career",es:"Trabajo y carrera"}, hint:{ru:"Профессиональное развитие и баланс",en:"Professional development and balance",es:"Desarrollo profesional y equilibrio"} },
  { key:"money", icon:"◎", title:{ru:"Деньги и ресурсы",en:"Money & resources",es:"Dinero y recursos"}, hint:{ru:"Финансовые цели и доступные ресурсы",en:"Financial goals and available resources",es:"Objetivos financieros y recursos"} },
  { key:"growth", icon:"✿", title:{ru:"Личностный рост",en:"Personal growth",es:"Crecimiento personal"}, hint:{ru:"Навыки, обучение и уверенность",en:"Skills, learning and confidence",es:"Habilidades, aprendizaje y confianza"} },
  { key:"lifestyle", icon:"⌖", title:{ru:"Образ жизни и окружение",en:"Lifestyle & environment",es:"Estilo de vida y entorno"}, hint:{ru:"Привычки, дом и социальная среда",en:"Habits, home and social environment",es:"Hábitos, hogar y entorno social"} },
  { key:"goals", icon:"☑", title:{ru:"Цели и план действий",en:"Goals & action plan",es:"Objetivos y plan de acción"}, hint:{ru:"Конкретные шаги, сроки и результаты",en:"Concrete steps, timelines and outcomes",es:"Pasos concretos, plazos y resultados"} },
  { key:"reflection", icon:"↻", title:{ru:"Рефлексия и пересмотр",en:"Reflection & review",es:"Reflexión y revisión"}, hint:{ru:"Что изменилось и что важно пересмотреть",en:"What changed and what to review",es:"Qué cambió y qué revisar"} }
];

export function normalizeLifePlanLocale(value) {
  const locale=String(value||"").toLowerCase().split("-")[0];
  return ["ru","en","es"].includes(locale)?locale:"en";
}

export function getLifePlanCopy(locale="en") {
  const all={
    ru:{title:"My Coaching Plan",subtitle:"Ваш персональный план жизни и развития",plan:"Мой жизненный план",reports:"Отчёты и консультации",current:"Где я сейчас",desired:"К чему хочу прийти",actions:"Следующие шаги",reflection:"Мои заметки",save:"Сохранить раздел",saved:"Сохранено",emptyTitle:"Ваш план начинается с первого шага",emptyText:"После коучинговой сессии здесь появятся ваши цели, приоритеты и рекомендации. Можно начать и самостоятельно — заполнить любой раздел.",start:"Выбрать сессию",noReports:"Отчётов пока нет",blank:"После консультаций здесь появятся ваши отчёты.",all:"Все",coaching:"Коучинг",consultation:"Консультации",practitioner:"Специалисты",sectionTitle:"Жизненные направления",privacy:"Этот раздел виден только вам. Доступ специалиста возможен только после отдельного согласия.",pathway:"Возможная последовательность сессий",openShop:"Открыть каталог услуг",back:"К плану",openReport:"Открыть отчёт"},
    en:{title:"My Coaching Plan",subtitle:"Your personal life and development plan",plan:"My life plan",reports:"Reports & consultations",current:"Where I am now",desired:"Where I want to be",actions:"Next steps",reflection:"My notes",save:"Save section",saved:"Saved",emptyTitle:"Your plan starts with one step",emptyText:"Your goals, priorities and recommendations will appear here after a coaching session. You can also start by filling in any section yourself.",start:"Explore sessions",noReports:"No reports yet",blank:"Reports from your consultations will appear here.",all:"All",coaching:"Coaching",consultation:"Consultations",practitioner:"Specialists",sectionTitle:"Life areas",privacy:"This section is private to you. A specialist can access it only after your explicit consent.",pathway:"Suggested session pathway",openShop:"Explore services",back:"Back to plan",openReport:"Open report"},
    es:{title:"My Coaching Plan",subtitle:"Tu plan personal de vida y desarrollo",plan:"Mi plan de vida",reports:"Informes y consultas",current:"Dónde estoy ahora",desired:"A dónde quiero llegar",actions:"Próximos pasos",reflection:"Mis notas",save:"Guardar sección",saved:"Guardado",emptyTitle:"Tu plan comienza con un paso",emptyText:"Tus objetivos, prioridades y recomendaciones aparecerán aquí después de una sesión de coaching. También puedes empezar rellenando cualquier sección.",start:"Explorar sesiones",noReports:"Todavía no hay informes",blank:"Los informes de tus consultas aparecerán aquí.",all:"Todos",coaching:"Coaching",consultation:"Consultas",practitioner:"Especialistas",sectionTitle:"Áreas de vida",privacy:"Esta sección es privada. Un especialista solo podrá acceder con tu consentimiento explícito.",pathway:"Ruta de sesiones sugerida",openShop:"Explorar servicios",back:"Volver al plan",openReport:"Abrir informe"}
  };
  return all[normalizeLifePlanLocale(locale)];
}

export function getInitialLifePlanContent(value) {
  const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  return {current:String(source.current||""),desired:String(source.desired||""),actions:String(source.actions||""),reflection:String(source.reflection||"")};
}

export async function loadLifePlan(session) {
  if(!session?.access_token) throw new Error("Нужно войти в кабинет.");
  const plans=await supabaseRequest("/rest/v1/profile_life_plans?select=*&limit=1",{accessToken:session.access_token});
  const plan=plans?.[0]||null;
  const [sections,reports]=await Promise.all([
    plan?supabaseRequest("/rest/v1/profile_life_plan_sections?plan_id=eq."+encodeURIComponent(plan.id)+"&select=*&order=created_at.asc",{accessToken:session.access_token}):Promise.resolve([]),
    supabaseRequest("/rest/v1/profile_client_reports?select=*&order=report_date.desc&limit=100",{accessToken:session.access_token})
  ]);
  return {plan,sections:sections||[],reports:reports||[]};
}

export async function createLifePlan(session,locale="en") {
  if(!session?.access_token) throw new Error("Нужно войти в кабинет.");
  const user=await supabaseRequest("/auth/v1/user",{accessToken:session.access_token});
  const rows=await supabaseRequest("/rest/v1/profile_life_plans",{method:"POST",accessToken:session.access_token,prefer:"return=representation",body:{user_id:user.id,locale,status:"active"}});
  return rows?.[0]||null;
}

export async function saveLifePlanSection(session,planId,sectionKey,content) {
  if(!session?.access_token||!planId||!sectionKey) throw new Error("Не хватает данных для сохранения.");
  const rows=await supabaseRequest("/rest/v1/profile_life_plan_sections?on_conflict=plan_id%2Csection_key",{method:"POST",accessToken:session.access_token,prefer:"resolution=merge-duplicates,return=representation",body:{plan_id:planId,section_key:sectionKey,content:getInitialLifePlanContent(content),visibility:"private",reviewed_at:new Date().toISOString()}});
  return rows?.[0]||null;
}
