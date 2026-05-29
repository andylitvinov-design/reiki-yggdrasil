(() => {
  const SOURCE_SELECTOR = ".powerLibraryGroups";

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const lower = (value) => normalize(value).toLowerCase();
  const slug = (value) => lower(value).replace(/[^a-z0-9а-яё]+/giu, "-").replace(/^-+|-+$/g, "") || "all";

  const SITE_DAO_LEVELS = [
    {
      value: "dao-level-1",
      label: "Базовая программа Рейки Иггдрасиль",
      prefix: "1.",
      steps: [
        "Уровень 1: Здоровье · Интуиция · Защита",
        "Уровень 2: Очищение · Денежная активация",
        "Уровень 3: Предопределение · Сила",
        "Уровень 4: Сверхчувственное видение",
        "Уровень 5: Уровень мастера"
      ]
    },
    {
      value: "dao-level-2",
      label: "Инструкторский курс",
      prefix: "2.",
      steps: [
        "Ступень 1: Целительство",
        "Ступень 2: Золотой телец",
        "Ступень 3: Мужчина и женщина",
        "Ступень 4: Жизненная сила",
        "Ступень 5: Сексуальная энергетика",
        "Ступень 6: Файербол. Управление энергией"
      ]
    },
    {
      value: "dao-level-3",
      label: "Храмовая магия",
      prefix: "3.",
      steps: [
        "Ступень 1: Работа с эгрегорами",
        "Ступень 2: Египетская магия",
        "Ступень 3: Греческая магия. Зодиак",
        "Ступень 4: Толтекская магия",
        "Ступень 5: Суфизм"
      ]
    },
    {
      value: "dao-level-4",
      label: "Восточная магия",
      prefix: "4.",
      steps: [
        "Ступень 1: Китайская медицина 1. Элементы",
        "Ступень 2: Китайская медицина 2. Сила",
        "Ступень 3: Китайское прогнозирование. И Цзин",
        "Ступень 4: Кундалини",
        "Ступень 5: Денежная магия"
      ]
    },
    {
      value: "dao-level-5",
      label: "Западноевропейская магия. Каббала и Таро",
      prefix: "5.",
      steps: [
        "Ступень 1: Великие арканы Таро",
        "Ступень 2: Силы стихий",
        "Ступень 3: Дерево Сефирот",
        "Ступень 4: Высшие арканы Таро",
        "Ступень 5: Предсказания в Таро"
      ]
    },
    {
      value: "dao-level-6",
      label: "Продвинутая магия рун",
      prefix: "6.",
      steps: [
        "Ступень 1: Руны и руническая традиция",
        "Ступень 2: Миры Древа Иггдрасиль",
        "Ступень 3: Круг силы",
        "Ступень 4: Руническое предсказание",
        "Ступень 5: Руническое исцеление"
      ]
    },
    {
      value: "dao-level-7",
      label: "Высшая магия",
      prefix: "7.",
      steps: [
        "Ступень 1: Телепорт. Астральный полет. Ясновидение",
        "Ступень 2: Машинный зал. Укрепление видения",
        "Ступень 3: Ифриты. Создание помощников",
        "Ступень 4: Славянская магия 1",
        "Ступень 5: Славянская магия 2",
        "Ступень 6: Цивилизации"
      ]
    }
  ];

  const SITE_MYSTERY_TRADITIONS = [
    {
      value: "mystery-greek",
      label: "Греческие мистерии",
      entities: ["Зевс", "Гера", "Афина", "Аполлон", "Артемида", "Афродита", "Гермес", "Арес", "Дионис", "Деметра", "Персефона", "Геката", "Гефест", "Посейдон", "Аид"]
    }
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

  function daoLevelForItem(item) {
    return SITE_DAO_LEVELS.find((level) => normalize(item.title).startsWith(level.prefix)) || null;
  }

  function mysteryTraditionForItem(item) {
    const text = lower(`${item.title} ${item.meta}`);
    return SITE_MYSTERY_TRADITIONS.find((tradition) => text.includes(lower(tradition.label)) || tradition.entities.some((entity) => text.includes(lower(entity)))) || null;
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
      return { id: `group-${groupIndex}`, label, items, details };
    });
  }

  function buildCategories(group) {
    const label = lower(group?.label);
    if (!group) return [option("", "Категории пока нет")];

    if (label.includes("дао")) {
      return SITE_DAO_LEVELS.filter((level) => group.items.some((item) => daoLevelForItem(item)?.value === level.value))
        .map((level) => option(level.value, level.label));
    }

    if (label.includes("канал")) {
      return ["Сефирот", "Руны", "Планеты", "Деньги", "Жизнь"].map((item) => option(item, item));
    }

    if (label.includes("мистер")) {
      return SITE_MYSTERY_TRADITIONS.filter((tradition) => group.items.some((item) => mysteryTraditionForItem(item)?.value === tradition.value))
        .map((tradition) => option(tradition.value, tradition.label));
    }

    if (label.includes("форм")) {
      return ["Защитные", "Целебные", "Бизнес", "Другие"].map((item) => option(item, item));
    }

    if (label.includes("клиент")) return [option("client-goals", "Фото клиентов / цели")];
    if (label.includes("фон") || label.includes("подлож")) return [option("covers", "Фоны и подложки")];

    const categories = [];
    group.items.forEach((item) => {
      const value = item.meta || item.title;
      if (value && !categories.some((entry) => lower(entry.label) === lower(value))) categories.push(option(slug(value), value));
    });
    return categories.length ? categories : [option("all", "Все")];
  }

  function buildSubcategories(group, categoryValue) {
    const groupLabel = lower(group?.label);
    if (groupLabel.includes("дао")) {
      const level = SITE_DAO_LEVELS.find((item) => item.value === categoryValue);
      return (level?.steps || []).map((step) => option(step, step));
    }

    if (groupLabel.includes("канал")) {
      const subs = CHANNEL_CATEGORY_MAP[lower(categoryValue)] || [];
      return subs.map((item) => option(item, item));
    }

    if (groupLabel.includes("мистер")) {
      const tradition = SITE_MYSTERY_TRADITIONS.find((item) => item.value === categoryValue);
      return (tradition?.entities || []).map((entity) => option(entity, entity));
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
    if (groupLabel.includes("дао")) return daoLevelForItem(item)?.value === category;
    if (groupLabel.includes("мистер")) return mysteryTraditionForItem(item)?.value === category;
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
      setOptions(categorySelect.select, buildCategories(group), "Категории пока нет");
      refreshSubcategories();
    }

    function refreshSubcategories() {
      const group = currentGroup();
      setOptions(subcategorySelect.select, buildSubcategories(group, categorySelect.select.value), "Подкатегории пока нет");
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
