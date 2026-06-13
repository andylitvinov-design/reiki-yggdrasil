export const POWER_PLACE_SYMBOL_SHELF_ORDER = [
  "zodiac",
  "star",
  "chess",
  "client",
  "altar",
  "business",
  "dao"
];

export const POWER_PLACE_SYMBOL_SHELVES = [
  { value: "zodiac", label: "Зодиак", constructorType: "zodiac" },
  { value: "star", label: "Звезда", constructorType: "star" },
  { value: "chess", label: "Шахматы", constructorType: "chess" },
  { value: "client", label: "Мандала", constructorType: "client" },
  { value: "altar", label: "Алтарь", constructorType: "altar" },
  { value: "business", label: "Бизнес", constructorType: "business" },
  { value: "dao", label: "ДАО", constructorType: "dao" }
];

export const POWER_PLACE_SYMBOL_LIBRARY = [
  {
    id: "symbol-zodiac-aries-draft",
    shelf: "zodiac",
    label: "Овен",
    meta: "Символ · Зодиак · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/zodiac/aries.svg",
    displaySrc: "/symbols/power-place/zodiac/aries.svg"
  },
  {
    id: "symbol-zodiac-moon-draft",
    shelf: "zodiac",
    label: "Луна",
    meta: "Символ · Зодиак · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/zodiac/moon.svg",
    displaySrc: "/symbols/power-place/zodiac/moon.svg"
  },
  {
    id: "symbol-star-top-draft",
    shelf: "star",
    label: "Луч",
    meta: "Символ · Звезда · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/star/star-top.svg",
    displaySrc: "/symbols/power-place/star/star-top.svg"
  },
  {
    id: "symbol-star-core-draft",
    shelf: "star",
    label: "Ядро",
    meta: "Символ · Звезда · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/star/star-core.svg",
    displaySrc: "/symbols/power-place/star/star-core.svg"
  },
  {
    id: "symbol-chess-node-draft",
    shelf: "chess",
    label: "Ячейка",
    meta: "Символ · Шахматы · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/chess/chess-node.svg",
    displaySrc: "/symbols/power-place/chess/chess-node.svg"
  },
  {
    id: "symbol-chess-cross-draft",
    shelf: "chess",
    label: "Крест",
    meta: "Символ · Шахматы · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/chess/chess-cross.svg",
    displaySrc: "/symbols/power-place/chess/chess-cross.svg"
  },
  {
    id: "symbol-client-node-draft",
    shelf: "client",
    label: "Точка",
    meta: "Символ · Мандала · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/client/client-node.svg",
    displaySrc: "/symbols/power-place/client/client-node.svg"
  },
  {
    id: "symbol-client-circle-draft",
    shelf: "client",
    label: "Круг",
    meta: "Символ · Мандала · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/client/client-circle.svg",
    displaySrc: "/symbols/power-place/client/client-circle.svg"
  },
  {
    id: "symbol-altar-flame-draft",
    shelf: "altar",
    label: "Пламя",
    meta: "Символ · Алтарь · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/altar/altar-flame.svg",
    displaySrc: "/symbols/power-place/altar/altar-flame.svg"
  },
  {
    id: "symbol-altar-bowl-draft",
    shelf: "altar",
    label: "Чаша",
    meta: "Символ · Алтарь · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/altar/altar-bowl.svg",
    displaySrc: "/symbols/power-place/altar/altar-bowl.svg"
  },
  {
    id: "symbol-business-goal-draft",
    shelf: "business",
    label: "Цель",
    meta: "Символ · Бизнес · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/business/business-goal.svg",
    displaySrc: "/symbols/power-place/business/business-goal.svg"
  },
  {
    id: "symbol-business-link-draft",
    shelf: "business",
    label: "Связь",
    meta: "Символ · Бизнес · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/business/business-link.svg",
    displaySrc: "/symbols/power-place/business/business-link.svg"
  },
  {
    id: "symbol-dao-water-draft",
    shelf: "dao",
    label: "Вода",
    meta: "Символ · ДАО · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/dao/dao-water.svg",
    displaySrc: "/symbols/power-place/dao/dao-water.svg"
  },
  {
    id: "symbol-dao-balance-draft",
    shelf: "dao",
    label: "Баланс",
    meta: "Символ · ДАО · draft / needs review",
    kind: "symbol-library",
    src: "/symbols/power-place/dao/dao-balance.svg",
    displaySrc: "/symbols/power-place/dao/dao-balance.svg"
  }
];

export const POWER_PLACE_BACKGROUND_LIBRARY = [];

export function normalizePowerPlaceSymbolShelf(value) {
  const shelf = String(value || "").trim();
  return POWER_PLACE_SYMBOL_SHELF_ORDER.includes(shelf) ? shelf : "zodiac";
}

export function symbolShelfForConstructorType(constructorType) {
  return POWER_PLACE_SYMBOL_SHELVES.find((shelf) => shelf.constructorType === constructorType)?.value || "zodiac";
}

export function listPowerPlaceSymbolsByShelf(shelfValue) {
  const shelf = normalizePowerPlaceSymbolShelf(shelfValue);
  return POWER_PLACE_SYMBOL_LIBRARY.filter((item) => item.shelf === shelf);
}

export function listPowerPlaceBackgroundsByShelf(shelfValue) {
  const shelf = normalizePowerPlaceSymbolShelf(shelfValue);
  return POWER_PLACE_BACKGROUND_LIBRARY.filter((item) => item.shelf === shelf);
}

export function listPowerPlaceSymbolsForConstructorType(constructorType) {
  return listPowerPlaceSymbolsByShelf(symbolShelfForConstructorType(constructorType));
}
