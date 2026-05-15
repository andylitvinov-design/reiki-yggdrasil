import { freeCourseLinks } from "./freeCourseLinks.js";

export const topSections = [
  { id: "dao-ri", label: "ДАО РИ" },
  { id: "wizard-school", label: "ШКОЛА ВОЛШЕБНИКОВ" },
  { id: "mysteries", label: "МИСТЕРИИ" },
  { id: "services", label: "УСЛУГИ" },
  { id: "free-courses", label: "БЕСПЛАТНЫЕ КУРСЫ" }
];

export const leftMenuSections = {
  "wizard-school": {
    title: "Школа волшебников",
    items: [
      {
        id: "wizard-basics",
        label: "Основы магии",
        description: "Вводный раздел для базовых понятий, состояния ученика и безопасного входа в практику.",
        status: "материалы готовятся"
      },
      {
        id: "wizard-energy-state",
        label: "Энергия и состояние",
        description: "Категория для практик наблюдения за энергией, телесным откликом и устойчивостью внимания.",
        status: "материалы готовятся"
      },
      {
        id: "wizard-protection",
        label: "Защита",
        description: "Раздел для защитных практик и аккуратной работы с личными границами.",
        status: "материалы готовятся"
      },
      {
        id: "wizard-intention",
        label: "Сила намерения",
        description: "Категория для работы с фокусом, направлением и чистой формулировкой цели.",
        status: "материалы готовятся"
      },
      {
        id: "wizard-practice",
        label: "Практика",
        description: "Место для будущих упражнений и прикладных заданий школы.",
        status: "материалы готовятся"
      }
    ]
  },
  mysteries: {
    title: "Мистерии",
    items: [
      {
        id: "mysteries-greek",
        label: "Греческие мистерии",
        description: "Категория для материалов по греческой мистериальной линии.",
        status: "материалы готовятся"
      },
      {
        id: "mysteries-egypt",
        label: "Египетские мистерии",
        description: "Категория для египетской жреческой и символической традиции.",
        status: "материалы готовятся"
      },
      {
        id: "mysteries-maya",
        label: "Майя",
        description: "Раздел для будущих материалов по архетипам и символике Майя.",
        status: "материалы готовятся"
      },
      {
        id: "mysteries-dionysus",
        label: "Дионис",
        description: "Категория для мистерий Диониса и практик живой силы.",
        status: "материалы готовятся"
      },
      {
        id: "mysteries-demeter",
        label: "Деметра",
        description: "Категория для канала Деметры и греческой мистериальной линии.",
        status: "материалы готовятся"
      }
    ]
  },
  services: {
    title: "Услуги",
    items: [
      {
        id: "service-diagnostics",
        label: "Личная диагностика",
        description: "Индивидуальная работа с состоянием, запросом и текущей точкой пути.",
        cta: "Подробнее"
      },
      {
        id: "service-psychotherapy",
        label: "Психотерапия",
        description: "Сопровождение внутренних процессов, эмоциональных узлов и личных изменений.",
        cta: "Подробнее"
      },
      {
        id: "service-rituals",
        label: "Ритуалы",
        description: "Ритуальная работа под конкретную задачу после личного согласования.",
        cta: "Подробнее"
      },
      {
        id: "service-artifacts",
        label: "Артефакты",
        description: "Создание и подбор предметов силы, когда будет подтверждена точная услуга.",
        cta: "Подробнее"
      },
      {
        id: "service-support",
        label: "Сопровождение",
        description: "Длительное ведение ученика или клиента по согласованной программе.",
        cta: "Подробнее"
      }
    ]
  },
  "free-courses": {
    title: "Бесплатные курсы",
    items: freeCourseLinks.map((course) => ({
      id: course.id,
      label: course.title,
      description: course.description,
      status: course.urlStatus === "verified" ? "ссылка проверена" : "ссылка требует проверки",
      url: course.courseUrl,
      sourcePageUrl: course.sourcePageUrl
    }))
  }
};
