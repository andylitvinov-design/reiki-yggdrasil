export const CHANNELS_SUBCATEGORIES = [
  {
    value: "sefirot",
    label: "Сефирот",
    thirdLevels: [
      { value: "major-arcana", label: "Большие арканы" },
      { value: "minor-arcana", label: "Малые арканы" },
      { value: "sephirot-siphers", label: "Сиферы" }
    ]
  },
  {
    value: "runes",
    label: "Руны",
    thirdLevels: [
      { value: "first-at", label: "Первый атт" },
      { value: "second-at", label: "Второй атт" },
      { value: "third-at", label: "Третий атт" }
    ]
  },
  {
    value: "planets",
    label: "Планеты",
    thirdLevels: [
      { value: "sun", label: "Солнце" },
      { value: "moon", label: "Луна" },
      { value: "mercury", label: "Меркурий" },
      { value: "venus", label: "Венера" },
      { value: "mars", label: "Марс" },
      { value: "jupiter", label: "Юпитер" },
      { value: "saturn", label: "Сатурн" }
    ]
  },
  {
    value: "money",
    label: "Деньги"
  },
  {
    value: "life",
    label: "Жизнь"
  }
];

export function menuSectionEntries(section) {
  return [
    ...(section?.items || []),
    ...(section?.groups || []).flatMap((group) => group.items || [])
  ].filter(Boolean);
}

export function buildArtifactItems(leftMenuSections) {
  return [
    ...menuSectionEntries(leftMenuSections?.["artifact-creation"]),
    ...menuSectionEntries(leftMenuSections?.["artifact-shop"])
  ].filter((item) => item.id !== "artifact-workshop-overview");
}

export function buildTalismanItems(artifactItems) {
  return (artifactItems || []).filter((item) => /талисман/i.test(`${item.label || ""} ${item.description || ""}`));
}

export function buildMaterialCategoryTabs({ reikiLevels, mysteryTraditions, artifactItems, talismanItems }) {
  return [
    {
      value: "dao-ri",
      label: "ДАО РИ",
      subcategories: (reikiLevels || []).map((level) => ({
        value: `level-${level.id}`,
        label: `${level.id}. ${level.name}`,
        steps: level.steps || []
      }))
    },
    {
      value: "god-channels",
      label: "Мистерия / Каналы Богов",
      subcategories: (mysteryTraditions || []).flatMap((tradition) =>
        (tradition.entities || []).map((entity) => ({
          value: `${tradition.id}-${entity.id}`,
          label: entity.title,
          traditionId: tradition.id
        }))
      )
    },
    {
      value: "channels",
      label: "Каналы",
      subcategories: CHANNELS_SUBCATEGORIES
    },
    {
      value: "talismans",
      label: "Талисманы",
      subcategories: (talismanItems || []).map((item) => ({ value: item.id, label: item.label }))
    },
    {
      value: "artifacts",
      label: "Артефакты",
      subcategories: (artifactItems || []).map((item) => ({ value: item.id, label: item.label }))
    }
  ];
}

export function flattenChannelItems() {
  return CHANNELS_SUBCATEGORIES.flatMap((subcategory) => [
    {
      id: `channels-${subcategory.value}`,
      title: subcategory.label,
      meta: "категория канала"
    },
    ...((subcategory.thirdLevels || []).map((thirdLevel) => ({
      id: `channels-${subcategory.value}-${thirdLevel.value}`,
      title: thirdLevel.label,
      meta: subcategory.label
    })))
  ]);
}

export function buildChannelsLibraryGroup() {
  const items = flattenChannelItems();
  return {
    id: "channels",
    label: "Каналы",
    count: items.length,
    emptyText: "Категории каналов пока не заполнены материалами.",
    items
  };
}

export function textPart(item, key, fallback = "") {
  const raw = item?.[key];
  if (Array.isArray(raw)) return raw.map((value) => String(value || "")).filter(Boolean).join(" ");
  return String(raw || fallback);
}

export function materialTextIndex(item) {
  return [
    textPart(item, "title"),
    textPart(item, "description"),
    textPart(item, "step_title"),
    textPart(item, "setting_title"),
    textPart(item, "type"),
    textPart(item, "category"),
    textPart(item, "subcategory"),
    textPart(item, "channels"),
    textPart(item, "channelCategory"),
    textPart(item, "channelCategoryLabel"),
    textPart(item, "channelSubcategory"),
    textPart(item, "channelSubcategoryLabel"),
    textPart(item, "channelThirdLevel"),
    textPart(item, "channelThirdLevelLabel"),
    textPart(item, "material_category"),
    textPart(item, "material_subcategory")
  ].join(" ").toLowerCase();
}

export function textMatches(item, text) {
  const needle = String(text || "").trim().toLowerCase();
  if (!needle) return false;
  return materialTextIndex(item).includes(needle);
}

export function metadataMatches(item, values) {
  return (values || []).some((value) => {
    const itemValues = [
      item?.channelCategory,
      item?.channelCategoryLabel,
      item?.channelSubcategory,
      item?.channelSubcategoryLabel,
      item?.channelThirdLevel,
      item?.channelThirdLevelLabel,
      item?.material_category,
      item?.material_subcategory,
      item?.category,
      item?.subcategory,
      item?.channels
    ];

    return itemValues.some((fieldValue) => String(fieldValue || "").toLowerCase() === String(value || "").trim().toLowerCase());
  });
}

export function channelTextMatch(item, values) {
  if (!values?.length) return true;
  return values.some((entry) => metadataMatches(item, [entry]) || textMatches(item, entry));
}
