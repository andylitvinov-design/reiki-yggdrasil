(() => {
  const SOURCE_SELECTOR = ".powerLibraryGroups";

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const lower = (value) => normalize(value).toLowerCase();
  const slug = (value) => lower(value).replace(/[^a-z0-9а-яё]+/giu, "-").replace(/^-+|-+$/g, "") || "all";

  const DAO_LEVELS = [
    { value: "dao-basic", label: "Базовый", patterns: [/^1\./, /базов/i] },
    { value: "dao-instructor", label: "Инструкторский", patterns: [/^2\./, /инструкт/i] },
    { value: "dao-master", label: "Мастерский", patterns: [/^3\./, /мастер/i] },
    { value: "dao-senior", label: "Старшие уровни", patterns: [/^4\./, /^5\./, /старш/i] },
    { value: "dao-priest", label: "Жреческий", patterns: [/^6\./, /жрец/i] },
    { value: "dao-advanced", label: "Высшие уровни", patterns: [/^7\./, /^8\./, /^9\./, /высш/i] }
  ];

  const MYSTERY_TRADITIONS = [
    { value: "mystery-greek", label: "Греческие", patterns: [/гречес/i, /олимп/i, /зевс/i, /афин/i, /апол/i, /артем/i, /дионис/i, /афрод/i] },
    { value: "mystery-roman", label: "Римские", patterns: [/римск/i, /юпитер/i, /юнон/i, /марс/i, /венер/i, /меркур/i, /сатурн/i] },
    { value: "mystery-egyptian", label: "Египетские", patterns: [/егип/i, /ра\b/i, /исид/i, /осир/i, /гор\b/i, /ануб/i, /тот\b/i] },
    { value: "mystery-norse", label: "Скандинавские", patterns: [/скандинав/i, /север/i, /один/i, /тор\b/i, /локи/i, /фрей/i, /фригг/i] },
    { value: "mystery-celtic", label: "Кельтские", patterns: [/кельт/i, /бригит/i, /луг\b/i] },
    { value: "mystery-tao", label: "Даосские", patterns: [/даос/i, /дао/i, /усин/i] },
    { value: "mystery-other", label: "Другие", patterns: [] }
  ];

  const CHANNEL_CATEGORY_MAP = {
    "сефирот": ["Большие арканы", "Малые арканы", "Сиферы"],
    "руны": ["Первый атт", "Второй атт", "Третий атт"],
    "планеты": ["Солнце", "Луна", "Меркурий", "Венера", "Марс", "Юпитер", "Сатурн"],
    "деньги": [],
    "жизнь": []
  };

  function option(value, label) {
    return { value, label };
  }

  function matchesAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function daoLevelForItem(item) {
    const text = `${item.title} ${item.meta}`;
    return DAO_LEVELS.find((level) => matchesAny(text, level.patterns)) || DAO_LEVELS[0];
  }

  function mysteryTraditionForItem(item) {
    const text = `${item.title} ${item.meta}`;
    return MYSTERY_TRADITIONS.find((tradition) => matchesAny(text, tradition.patterns)) || MYSTERY_TRADITIONS[MYSTERY_TRADITIONS.length - 1];
  }

  function readGroups(container) {
    return Array.from(container.querySelectorAll(":scope > details")).map((details, groupIndex) => {
      const label = normalize(details.querySelector("summary span")?.textContent) || `Группа ${groupIndex + 1}`;
      const buttons = Array.from(details.querySelectorAll(".powerLibraryGroupList button"));
      const items = buttons.map((button, itemIndex) => {
        const title = normalize(button.querySelector("span")?.textContent || button.textContent) || `Элемент ${itemIndex + 1}`;
        const meta = normalize(button.querySelector("small")?.textContent || "");
        return { title, meta, button };
      });
      return {
        id: `group-${groupIndex}`,
        label,
        items,
        details
      };
    });
  }

  function buildCategories(group) {
    const label = lower(group?.label);
    if (!group) return [option("", "Категории пока нет")];

    if (label.includes("дао")) {
      return DAO_LEVELS.filter((level) => group.items.some((item) => daoLevelForItem(item).value === level.value))
        .map((level) => option(level.value, level.label));
    }

    if (label.includes("канал")) {
      return ["Сефирот", "Руны", "Планеты", "Деньги", "Жизнь"].map((item) => option(item, item));
    }

    if (label.includes("мистер")) {
      return MYSTERY_TRADITIONS.filter((tradition) => group.items.some((item) => mysteryTraditionForItem(item).value === tradition.value))
        .map((tradition) => option(tradition.value, tradition.label));
    }

    if (label.includes("форм")) {
      return ["Защитные", "Целебные", "Бизнес", "Другие"].map((item) => option(item, item));
    }

    if (label.includes("клиент")) {
      return [option("client-goals", "Фото клиентов / цели")];
    }

    if (label.includes("фон") || label.includes("подлож")) {
      return [option("covers", "Фоны и подложки")];
    }

    const categories = [];
    group.items.forEach((item) => {
      const value = item.meta || item.title;
      if (value && !categories.some((entry) => lower(entry.value) === lower(value))) categories.push(option(slug(value), value));
    });
    return categories.length ? categories : [option("all", "Все")];
  }

  function buildSubcategories(group, categoryValue) {
    const groupLabel = lower(group?.label);
    const category = normalize(categoryValue);

    if (groupLabel.includes("дао")) {
      return group.items
        .filter((item) => daoLevelForItem(item).value === category)
        .map((item) => option(item.title, item.title));
    }

    if (groupLabel.includes("канал")) {
      const subs = CHANNEL_CATEGORY_MAP[lower(category)] || [];
      return subs.map((item) => option(item, item));
    }

    if (groupLabel.includes("мистер")) {
      return group.items
        .filter((item) => mysteryTraditionForItem(item).value === category)
        .map((item) => option(item.title, item.title));
    }

    return [];
  }

  function itemMatches(group, categoryValue, subcategoryValue, item) {
    const groupLabel = lower(group?.label);
    const category = normalize(categoryValue);
    const subcategory = lower(subcategoryValue);
    const haystack = lower(`${item.title} ${item.meta}`);

    if (subcategory) return haystack.includes(subcategory);
    if (!category || category === "all" || category === "client-goals" || category === "covers") return true;
    if (groupLabel.includes("дао")) return daoLevelForItem(item).value === category;
    if (groupLabel.includes("мистер")) return mysteryTraditionForItem(item).value === category;
    return haystack.includes(lower(category)) || slug(item.meta || item.title) === category;
  }

  function setOptions(select, options, emptyLabel) {
    select.innerHTML = "";
    const safeOptions = options.length ? options : [option("", emptyLabel)];
    safeOptions.forEach((item) => {
      const node = document.createElement("option");
      node.value = item.value;
      node.textContent = item.label;
      select.append(node);
    });
    select.disabled = options.length === 0;
  }

  function createLabeledSelect(labelText) {
    const label = document.createElement("label");
    const span = document.createElement("span");
    const select = document.createElement("select");
    span.textContent = labelText;
    label.append(span, select);
    return { label, select };
  }

  function renderFilteredList(list, group, categoryValue, subcategoryValue) {
    list.innerHTML = "";
    const items = group.items.filter((item) => itemMatches(group, categoryValue, subcategoryValue, item)).slice(0, 14);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "sourceDropdownEmpty";
      empty.textContent = "Список пока пуст.";
      list.append(empty);
      return;
    }

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      const title = document.createElement("b");
      const meta = document.createElement("small");
      title.textContent = item.title;
      meta.textContent = item.meta || "категория";
      button.append(title, meta);
      button.addEventListener("click", () => item.button.click());
      list.append(button);
    });
  }

  function enhance(container) {
    if (!container || container.dataset.sourceDropdownReady === "true") return;
    const groups = readGroups(container);
    if (!groups.length) return;

    const panel = document.createElement("div");
    panel.className = "sourceDropdownPanel";
    const groupSelect = createLabeledSelect("Группа");
    const categorySelect = createLabeledSelect("Категория");
    const subcategorySelect = createLabeledSelect("Подкатегория");
    const list = document.createElement("div");
    list.className = "sourceDropdownFilteredList";

    panel.append(groupSelect.label, categorySelect.label, subcategorySelect.label, list);
    container.prepend(panel);
    container.classList.add("sourceDropdownReady");
    container.dataset.sourceDropdownReady = "true";

    setOptions(groupSelect.select, groups.map((group) => option(group.id, group.label)), "Группы пока нет");

    function currentGroup() {
      return groups.find((group) => group.id === groupSelect.select.value) || groups[0];
    }

    function refreshCategories() {
      const group = currentGroup();
      const categories = buildCategories(group);
      setOptions(categorySelect.select, categories, "Категории пока нет");
      refreshSubcategories();
    }

    function refreshSubcategories() {
      const group = currentGroup();
      const subcategories = buildSubcategories(group, categorySelect.select.value);
      setOptions(subcategorySelect.select, subcategories, "Подкатегории пока нет");
      renderFilteredList(list, group, categorySelect.select.value, subcategorySelect.select.value);
    }

    groupSelect.select.addEventListener("change", refreshCategories);
    categorySelect.select.addEventListener("change", refreshSubcategories);
    subcategorySelect.select.addEventListener("change", () => renderFilteredList(list, currentGroup(), categorySelect.select.value, subcategorySelect.select.value));

    refreshCategories();
  }

  function scan() {
    document.querySelectorAll(SOURCE_SELECTOR).forEach(enhance);
  }

  const observer = new MutationObserver(scan);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      scan();
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }, { once: true });
  } else {
    scan();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
