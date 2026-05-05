const LEVEL_DEFINITIONS = [
  { id: 1, name: "Корни", count: 5, theme: "опора, вход в систему, базовая чувствительность" },
  { id: 2, name: "Ствол", count: 6, theme: "устойчивость, вертикаль, накопление силы" },
  { id: 3, name: "Ветви", count: 6, theme: "расширение, связь, передача энергии" },
  { id: 4, name: "Листья", count: 6, theme: "тонкость восприятия, дыхание, обновление" },
  { id: 5, name: "Цветы", count: 6, theme: "раскрытие, красота, дар системы" },
  { id: 6, name: "Плоды", count: 6, theme: "интеграция, мастерство, результат пути" },
  {
    id: 7,
    name: "Семена",
    count: 6,
    theme: "передача, преемственность, новое Древо; точное название и содержание уровня needs verification"
  }
];

const levelOneSteps = [
  {
    id: "RY-L01-S01",
    levelId: 1,
    number: 1,
    title: "Основа",
    status: "draft_from_current_ui",
    intro: "Вы входите в систему, знакомитесь с картой пути и базовыми принципами Рейки Иггдрасиль.",
    meaning: "Здесь появляется первое ощущение опоры, безопасности и направления движения.",
    opens: ["Понимание структуры пути", "Первичное заземление", "Контакт с символом Древа"],
    skills: ["Внимание к телу", "Наблюдение за состоянием", "Настройка дыхания"],
    result: "Система начинает восприниматься как карта личного движения.",
    contentStatus: "needs_review"
  },
  {
    id: "RY-L01-S02",
    levelId: 1,
    number: 2,
    title: "Поток",
    status: "draft_from_current_ui",
    intro: "Вы учитесь чувствовать движение энергии и замечать, где поток свободен, а где сжимается.",
    meaning: "Ступень переводит идею энергии в живой телесный опыт.",
    opens: ["Чувствительность к движению энергии", "Мягкое снятие напряжения", "Понимание ритма"],
    skills: ["Дыхание потока", "Сканирование тела", "Мягкое внимание"],
    result: "Энергия воспринимается не как абстракция, а как опыт.",
    contentStatus: "needs_review"
  },
  {
    id: "RY-L01-S03",
    levelId: 1,
    number: 3,
    title: "Настройка",
    status: "draft_from_current_ui",
    intro: "Вы начинаете слышать тонкие вибрации потока. Настройка соединяет вас с энергией Рейки Иггдрасиль.",
    meaning: "На этой ступени происходит тонкая настройка каналов восприятия и принятие энергии системы.",
    opens: ["Чувствительность к потокам", "Усиление интуиции", "Соединение с Древом"],
    skills: ["Настройка дыхания и внимания", "Ощущение потока в теле", "Работа в тишине"],
    result: "Вы становитесь проводником. Энергия течёт мягко и осознанно.",
    contentStatus: "needs_review"
  },
  {
    id: "RY-L01-S04",
    levelId: 1,
    number: 4,
    title: "Очищение",
    status: "draft_from_current_ui",
    intro: "Ступень посвящена освобождению от лишнего шума, старых эмоциональных следов и внутреннего напряжения.",
    meaning: "Очищение возвращает ясность, лёгкость и пространство для нового опыта.",
    opens: ["Снятие внутреннего напряжения", "Ясность восприятия", "Обновление состояния"],
    skills: ["Очищающее дыхание", "Работа с символом света", "Наблюдение за эмоциями"],
    result: "Появляется больше тишины, пространства и внутренней прозрачности.",
    contentStatus: "needs_review"
  },
  {
    id: "RY-L01-S05",
    levelId: 1,
    number: 5,
    title: "Заземление",
    status: "draft_from_current_ui",
    intro: "Эта ступень помогает закрепить опыт в теле, действиях и повседневной жизни.",
    meaning: "Заземление превращает практику в устойчивый навык.",
    opens: ["Стабильность", "Телесную опору", "Спокойное присутствие"],
    skills: ["Контакт со стопами", "Медленное дыхание", "Закрепление результата"],
    result: "Вы чувствуете больше устойчивости и спокойной силы.",
    contentStatus: "needs_review"
  }
];

function stepId(levelId, stepNumber) {
  return `RY-L${String(levelId).padStart(2, "0")}-S${String(stepNumber).padStart(2, "0")}`;
}

function makePlaceholderStep(level, stepNumber) {
  return {
    id: stepId(level.id, stepNumber),
    levelId: level.id,
    number: stepNumber,
    title: `Ступень ${stepNumber}`,
    status: "needs_content",
    intro: "Материал этой ступени готовится. Нужно добавить авторское описание, практику, настройку и критерии результата.",
    meaning: `Тема уровня «${level.name}»: ${level.theme}. Точный смысл ступени требует авторского заполнения.`,
    opens: ["needs_content"],
    skills: ["needs_content"],
    result: "needs_content",
    contentStatus: "needs_content"
  };
}

const placeholderSteps = LEVEL_DEFINITIONS.flatMap((level) => {
  if (level.id === 1) return [];
  return Array.from({ length: level.count }, (_, index) => makePlaceholderStep(level, index + 1));
});

export const reikiKnowledgeMeta = {
  project: "Reiki Yggdrasil",
  language: "ru",
  source: "src/data/reikiKnowledgeBase.js",
  status: "architecture_ready_content_partial",
  stableIdPattern: "RY-L{level}-S{step}",
  totalLevels: LEVEL_DEFINITIONS.length,
  totalSteps: LEVEL_DEFINITIONS.reduce((sum, level) => sum + level.count, 0),
  knownContentPolicy:
    "Level 1 content is preserved from the current UI draft. Levels 2-7 are scaffolds marked needs_content until authored. Level 7 name/content need author verification."
};

export const reikiLevels = LEVEL_DEFINITIONS.map((level) => ({
  ...level,
  steps: level.id === 1 ? levelOneSteps : placeholderSteps.filter((step) => step.levelId === level.id)
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
