(() => {
  const SOURCE_SELECTOR = ".powerLibraryGroups";

  const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const lower = (value) => normalize(value).toLowerCase();

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
      const levels = [];
      group.items.forEach((item) => {
        const match = item.title.match(/^(\d+)\./);
        const value = match ? `level-${match[1]}` : "level-other";
        const labelText = match ? `${match[1]}. Уровень` : "Другие ступени";
        if (!levels.some((entry) => entry.value === value)) levels.push(option(value, labelText));
      });
      return levels.length ? levels : [option("all", "Все ступени")];
    }

    if (label.includes("канал")) {
      return ["Сефирот", "Руны", "Планеты", "Деньги", "Жизнь"].map((item) => option(item, item));
    }

    if (label.includes("мистер")) {
      const categories = [];
      group.items.forEach((item) => {
        const meta = item.meta || item.title;
        const value = meta || item.title;
        if (value && !categories.some((entry) => lower(entry.value) === lower(value))) categories.push(option(value, value));
      });
      return categories.length ? categories : [option("all", "Все мистерии")];
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
      if (value && !categories.some((entry) => lower(entry.value) === lower(value))) categories.push(option(value, value));
    });
    return categories.length ? categories : [option("all", "Все")];
  }

  function buildSubcategories(group, categoryValue) {
    const groupLabel = lower(group?.label);
    const category = normalize(categoryValue);

    if (groupLabel.includes("дао")) {
      return group.items
        .filter((item) => category === "all" || item.title.startsWith(category.replace("level-", "") + "."))
        .slice(0, 37)
        .map((item) => option(item.title, item.title));
    }

    if (groupLabel.includes("канал")) {
      const subs = CHANNEL_CATEGORY_MAP[lower(category)] || [];
      return subs.map((item) => option(item, item));
    }

    if (groupLabel.includes("мистер")) {
      return group.items
        .filter((item) => !category || category === "all" || lower(item.meta).includes(lower(category)) || lower(item.title).includes(lower(category)))
        .slice(0, 24)
        .map((item) => option(item.title, item.title));
    }

    return [];
  }

  function itemMatches(group, categoryValue, subcategoryValue, item) {
    const groupLabel = lower(group?.label);
    const category = lower(categoryValue);
    const subcategory = lower(subcategoryValue);
    const haystack = lower(`${item.title} ${item.meta}`);

    if (subcategory) return haystack.includes(subcategory);
    if (!category || category === "all" || category === "client-goals" || category === "covers") return true;
    if (groupLabel.includes("дао")) return item.title.startsWith(category.replace("level-", "") + ".");
    return haystack.includes(category);
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
