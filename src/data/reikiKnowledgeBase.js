const LEVEL_DEFINITIONS = [
  {
    id: 1,
    name: "Базовая программа Рейки Иггдрасиль",
    count: 5,
    stepLabel: "Уровень",
    theme: "здоровье, интуиция, защита, очищение, денежная активация, сила, видение и мастерский уровень",
    stepTitles: [
      "Здоровье · Интуиция · Защита",
      "Очищение · Денежная активация",
      "Предопределение · Сила",
      "Сверхчувственное видение",
      "Уровень мастера"
    ]
  },
  {
    id: 2,
    name: "Инструкторский курс",
    count: 6,
    stepLabel: "Ступень",
    theme: "целительство, ресурсы, отношения, жизненная сила, сексуальная энергетика и управление энергией",
    stepTitles: [
      "Целительство",
      "Золотой телец",
      "Мужчина и женщина",
      "Жизненная сила",
      "Сексуальная энергетика",
      "Файербол. Управление энергией"
    ]
  },
  {
    id: 3,
    name: "Храмовая магия",
    count: 5,
    stepLabel: "Ступень",
    theme: "эгрегоры, египетская, греческая, толтекская традиции и магия денег",
    stepTitles: [
      "Работа с эгрегорами",
      "Египетская магия",
      "Греческая магия. Зодиак",
      "Толтекская магия",
      "Магия денег"
    ]
  },
  {
    id: 4,
    name: "Восточная магия",
    count: 5,
    stepLabel: "Ступень",
    theme: "китайская медицина, прогнозирование, кундалини и суфийская традиция",
    stepTitles: [
      "Китайская медицина 1. Элементы",
      "Китайская медицина 2. Сила",
      "Китайское прогнозирование. И Цзин",
      "Кундалини",
      "Суфизм"
    ]
  },
  {
    id: 5,
    name: "Западная магия. Каббала и Таро",
    count: 5,
    stepLabel: "Ступень",
    theme: "Таро, стихии, Дерево Сефирот и предсказательная практика",
    stepTitles: [
      "Великие арканы Таро",
      "Силы стихий",
      "Дерево Сефирот",
      "Высшие арканы Таро",
      "Предсказания в Таро"
    ]
  },
  {
    id: 6,
    name: "Северная магия рун",
    count: 5,
    stepLabel: "Ступень",
    theme: "руны, миры Древа Иггдрасиль, круг силы, предсказание и исцеление",
    stepTitles: [
      "Руны и руническая традиция",
      "Миры Древа Иггдрасиль",
      "Круг силы",
      "Руническое предсказание",
      "Руническое исцеление"
    ]
  },
  {
    id: 7,
    name: "Высокая магия",
    count: 6,
    stepLabel: "Ступень",
    theme: "телепорт, астральный полет, ясновидение, помощники, славянская магия и цивилизации",
    stepTitles: [
      "Телепорт. Астральный полет. Ясновидение",
      "Машинный зал. Укрепление видения",
      "Ифриты. Создание помощников",
      "Славянская магия 1",
      "Славянская магия 2",
      "Цивилизации"
    ]
  }
];

function stepId(levelId, stepNumber) {
  return `RY-L${String(levelId).padStart(2, "0")}-S${String(stepNumber).padStart(2, "0")}`;
}

function makeCourseStep(level, stepTitle, stepNumber) {
  return {
    id: stepId(level.id, stepNumber),
    levelId: level.id,
    number: stepNumber,
    label: level.stepLabel,
    title: stepTitle,
    status: "structure_verified_from_user_corrections",
    intro: "Материал этой ступени готовится. Нужно добавить авторское описание, практику, настройку и критерии результата.",
    meaning: `Тема раздела «${level.name}»: ${level.theme}. Точное описание ступени требует авторского заполнения.`,
    opens: ["Материал готовится", "Требуется авторское заполнение"],
    skills: ["Материал готовится", "Требуется авторское заполнение"],
    result: "Материал готовится. Результат ступени нужно описать после авторского заполнения.",
    contentStatus: "needs_content"
  };
}

export const reikiKnowledgeMeta = {
  project: "Reiki Yggdrasil",
  language: "ru",
  source: "src/data/reikiKnowledgeBase.js",
  status: "course_structure_verified_from_user_corrections_content_partial",
  stableIdPattern: "RY-L{level}-S{step}",
  totalLevels: LEVEL_DEFINITIONS.length,
  totalSteps: LEVEL_DEFINITIONS.reduce((sum, level) => sum + level.count, 0),
  knownContentPolicy:
    "The 7-level / 37-step course structure is aligned with user-provided screenshots and follow-up corrections. Step titles are structure-level content. Full descriptions, practices, settings, and results still need author-approved content."
};

export const reikiLevels = LEVEL_DEFINITIONS.map((level) => ({
  id: level.id,
  name: level.name,
  count: level.count,
  stepLabel: level.stepLabel,
  theme: level.theme,
  steps: level.stepTitles.map((title, index) => makeCourseStep(level, title, index + 1))
}));

export const reikiSteps = reikiLevels.flatMap((level) => level.steps);

export const reikiStepsById = Object.fromEntries(reikiSteps.map((step) => [step.id, step]));

export const settingsSources = [
  "https://psimaster.net/service?shs_term_node_tid_depth=12346",
  "https://psimaster.net/service?shs_term_node_tid_depth=12210",
  "https://psimaster.net/service?shs_term_node_tid_depth=12180",
  "https://psimaster.net/service?shs_term_node_tid_depth=12200",
  "https://psimaster.net/service?shs_term_node_tid_depth=12192",
  "https://psimaster.net/service?shs_term_node_tid_depth=12202"
];

export const practiceExercises = [
  { title: "Дыхание потока", text: "Настройтесь на естественное движение энергии.", time: "10 мин" },
  { title: "Внутреннее слышание", text: "Практика развития тонкого восприятия.", time: "15 мин" },
  { title: "Соединение с Древом", text: "Визуализация канала связи с Иггдрасилем.", time: "20 мин" }
];

export const studentCollections = {
  mandalas: [
    { title: "Мандала настройки", author: "Мария", likes: 24 },
    { title: "Мандала исцеления", author: "Анна", likes: 19 },
    { title: "Мандала потока", author: "Ирина", likes: 31 }
  ],
  artifacts: [
    { title: "Кулон Потока", author: "Алексей", likes: 18 },
    { title: "Амулет Древа", author: "Мария", likes: 27 },
    { title: "Печать Настройки", author: "Ирина", likes: 22 }
  ]
};

export const rightPanelTabs = [
  ["exercises", "Упражнения"],
  ["mandalas", "Мандалы"],
  ["artifacts", "Артефакты"],
  ["masters", "Мастера"],
  ["settings", "Настройки"]
];
