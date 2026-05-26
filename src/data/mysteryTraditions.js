export const MYSTERY_PLACEHOLDER = "Материал готовится. Требуется авторская сверка.";

const greekEntityNames = [
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
];

function slugifyGreekName(name) {
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
    "Аид": "hades"
  };
  return ids[name] || name.toLowerCase();
}

function makeEntity(title) {
  return {
    id: slugifyGreekName(title),
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

export const mysteryTraditions = [
  {
    id: "greek",
    menuItemId: "mysteries-greek",
    title: "Греческие мистерии",
    subtitle: "Боги, архетипы, материалы и практические ключи традиции",
    intro: MYSTERY_PLACEHOLDER,
    contentStatus: "needs_review",
    entities: greekEntityNames.map(makeEntity)
  }
];

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
