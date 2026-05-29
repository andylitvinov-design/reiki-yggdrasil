export const MYSTERY_PLACEHOLDER = "Материал готовится. Требуется авторская сверка.";

const mysteryTraditionDefinitions = [
  {
    id: "greek",
    menuItemId: "mysteries-greek",
    title: "Греческие мистерии",
    subtitle: "Боги, архетипы, материалы и практические ключи традиции",
    entityNames: [
      "Зевс",
      "Гера",
      "Афина",
      "Аполлон",
      "Артемида",
      "Афродита",
      "Гермес",
      "Арес",
      "Дионис",
      "Деметра",
      "Персефона",
      "Геката",
      "Гефест",
      "Посейдон",
      "Аид"
    ]
  },
  {
    id: "roman",
    menuItemId: "mysteries-roman",
    title: "Римские мистерии",
    subtitle: "Римские боги, государственная магия, порядок, сила и покровительство",
    entityNames: [
      "Юпитер",
      "Юнона",
      "Минерва",
      "Марс",
      "Венера",
      "Меркурий",
      "Диана",
      "Аполлон",
      "Церера",
      "Нептун",
      "Вулкан",
      "Сатурн",
      "Веста",
      "Янус",
      "Плутон"
    ]
  },
  {
    id: "egyptian",
    menuItemId: "mysteries-egyptian",
    title: "Мистерии Египта",
    subtitle: "Египетские боги, храмовая магия, солнечные и загробные мистерии",
    entityNames: [
      "Ра",
      "Исида",
      "Осирис",
      "Гор",
      "Анубис",
      "Тот",
      "Сет",
      "Нефтида",
      "Хатхор",
      "Сехмет",
      "Бастет",
      "Птах",
      "Маат",
      "Собек",
      "Амон"
    ]
  },
  {
    id: "maya",
    menuItemId: "mysteries-maya",
    title: "Мистерии Майя",
    subtitle: "Майянские божества, календарные силы, земля, дождь, кукуруза и подземный мир",
    entityNames: [
      "Ицамна",
      "Иш-Чель",
      "Чаак",
      "Кукулькан",
      "Хунахпу",
      "Шбаланке",
      "Ах-Пуч",
      "Болон Цакаб",
      "Юм Кааш",
      "Кинич Ахау",
      "Эк Чуах",
      "Кавиль"
    ]
  },
  {
    id: "runes",
    menuItemId: "mysteries-runes",
    title: "Магия Рун",
    subtitle: "Рунические атты, силы Футарка и каналы северной традиции",
    entityNames: [
      "Первый атт",
      "Второй атт",
      "Третий атт",
      "Феху",
      "Уруз",
      "Турисаз",
      "Ансуз",
      "Райдо",
      "Кеназ",
      "Гебо",
      "Вуньо",
      "Хагалаз",
      "Наутиз",
      "Иса",
      "Йера",
      "Эйваз",
      "Перт",
      "Альгиз",
      "Соулу",
      "Тейваз",
      "Беркана",
      "Эваз",
      "Манназ",
      "Лагуз",
      "Ингуз",
      "Дагаз",
      "Отал"
    ]
  }
];

function slugifyName(name) {
  const ids = {
    "Зевс": "zeus",
    "Гера": "hera",
    "Афина": "athena",
    "Аполлон": "apollo",
    "Артемида": "artemis",
    "Афродита": "aphrodite",
    "Гермес": "hermes",
    "Арес": "ares",
    "Дионис": "dionysus",
    "Деметра": "demeter",
    "Персефона": "persephone",
    "Геката": "hekate",
    "Гефест": "hephaestus",
    "Посейдон": "poseidon",
    "Аид": "hades",
    "Юпитер": "jupiter",
    "Юнона": "juno",
    "Минерва": "minerva",
    "Марс": "mars",
    "Венера": "venus",
    "Меркурий": "mercury",
    "Диана": "diana",
    "Церера": "ceres",
    "Нептун": "neptune",
    "Вулкан": "vulcan",
    "Сатурн": "saturn",
    "Веста": "vesta",
    "Янус": "janus",
    "Плутон": "pluto",
    "Ра": "ra",
    "Исида": "isis",
    "Осирис": "osiris",
    "Гор": "horus",
    "Анубис": "anubis",
    "Тот": "thoth",
    "Сет": "set",
    "Нефтида": "nephthys",
    "Хатхор": "hathor",
    "Сехмет": "sekhmet",
    "Бастет": "bastet",
    "Птах": "ptah",
    "Маат": "maat",
    "Собек": "sobek",
    "Амон": "amun",
    "Ицамна": "itzamna",
    "Иш-Чель": "ix-chel",
    "Чаак": "chaac",
    "Кукулькан": "kukulkan",
    "Хунахпу": "hunahpu",
    "Шбаланке": "xbalanque",
    "Ах-Пуч": "ah-puch",
    "Болон Цакаб": "bolon-tzacab",
    "Юм Кааш": "yum-kaax",
    "Кинич Ахау": "kinich-ahau",
    "Эк Чуах": "ek-chuah",
    "Кавиль": "kawiil",
    "Первый атт": "first-aett",
    "Второй атт": "second-aett",
    "Третий атт": "third-aett"
  };

  return ids[name] || String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-+|-+$/g, "") || "entity";
}

function makeEntity(title) {
  return {
    id: slugifyName(title),
    title,
    archetype: MYSTERY_PLACEHOLDER,
    description: MYSTERY_PLACEHOLDER,
    contentStatus: "needs_review",
    articles: [],
    notes: [],
    videos: [],
    initiation: { title: `Инициация: ${title}`, description: MYSTERY_PLACEHOLDER, cta: "Запросить инициацию" },
    mandalas: [],
    shopItems: []
  };
}

export const mysteryTraditions = mysteryTraditionDefinitions.map((tradition) => ({
  id: tradition.id,
  menuItemId: tradition.menuItemId,
  title: tradition.title,
  subtitle: tradition.subtitle,
  intro: MYSTERY_PLACEHOLDER,
  contentStatus: "needs_review",
  entities: tradition.entityNames.map(makeEntity)
}));

export const mysteryTraditionsByMenuItemId = Object.fromEntries(
  mysteryTraditions.map((tradition) => [tradition.menuItemId, tradition])
);

export function getMysteryTraditionByMenuItemId(menuItemId) {
  return mysteryTraditionsByMenuItemId[menuItemId] || null;
}

export function getMysteryEntity(tradition, entityId) {
  if (!tradition?.entities?.length) return null;
  return tradition.entities.find((entity) => entity.id === entityId) || tradition.entities[0];
}
