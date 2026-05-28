(() => {
  const MOBILE_QUERY = "(max-width: 980px)";
  const CHANNEL_ITEMS = [
    ["Сефирот", "категория канала"],
    ["Большие арканы", "Сефирот"],
    ["Малые арканы", "Сефирот"],
    ["Сиферы", "Сефирот"],
    ["Руны", "категория канала"],
    ["Первый атт", "Руны"],
    ["Второй атт", "Руны"],
    ["Третий атт", "Руны"],
    ["Планеты", "категория канала"],
    ["Солнце", "Планеты"],
    ["Луна", "Планеты"],
    ["Меркурий", "Планеты"],
    ["Венера", "Планеты"],
    ["Марс", "Планеты"],
    ["Юпитер", "Планеты"],
    ["Сатурн", "Планеты"],
    ["Деньги", "категория канала"],
    ["Жизнь", "категория канала"]
  ];

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function findPowerLibraryGroups() {
    return document.querySelector(".powerLibraryGroups");
  }

  function groupLabel(details) {
    return normalize(details?.querySelector("summary span")?.textContent);
  }

  function createChannelsGroup() {
    const details = document.createElement("details");
    details.className = "runtimeUnifiedChannelsGroup";
    details.dataset.runtimeUnified = "channels";

    const summary = document.createElement("summary");
    const label = document.createElement("span");
    label.textContent = "Каналы";
    const count = document.createElement("b");
    count.textContent = String(CHANNEL_ITEMS.length);
    summary.append(label, count);

    const list = document.createElement("div");
    list.className = "powerLibraryGroupList";
    CHANNEL_ITEMS.slice(0, 14).forEach(([title, meta]) => {
      const button = document.createElement("button");
      button.type = "button";
      const buttonTitle = document.createElement("span");
      buttonTitle.textContent = title;
      const buttonMeta = document.createElement("small");
      buttonMeta.textContent = meta;
      button.append(buttonTitle, buttonMeta);
      list.append(button);
    });
    const more = document.createElement("small");
    more.textContent = `Ещё ${CHANNEL_ITEMS.length - 14} элементов внутри раздела.`;
    list.append(more);

    details.append(summary, list);
    return details;
  }

  function injectChannelsIntoPowerLibrary() {
    const groups = findPowerLibraryGroups();
    if (!groups || groups.querySelector('[data-runtime-unified="channels"]')) return;

    const details = Array.from(groups.querySelectorAll(":scope > details"));
    if (details.some((item) => groupLabel(item) === "Каналы")) return;

    const divineGroup = details.find((item) => /Каналы Богов|Мистерия \/ Каналы Богов/.test(groupLabel(item)));
    const channelsGroup = createChannelsGroup();

    if (divineGroup?.nextSibling) {
      groups.insertBefore(channelsGroup, divineGroup.nextSibling);
    } else if (divineGroup) {
      groups.append(channelsGroup);
    } else {
      groups.insertBefore(channelsGroup, groups.children[2] || null);
    }
  }

  function closeMobileCategoryPanels() {
    if (!isMobile()) return;
    const nav = document.querySelector(".materialCategoryNav");
    if (!nav || nav.dataset.runtimeAccordionReady === "true") return;

    const details = Array.from(nav.querySelectorAll(".materialCategoryDetails"));
    details.forEach((item, index) => {
      if (index > 0) item.removeAttribute("open");
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        details.forEach((other) => {
          if (other !== item) other.removeAttribute("open");
        });
      });
    });

    nav.dataset.runtimeAccordionReady = "true";
  }

  function hideIrrelevantDaoChip() {
    const chips = Array.from(document.querySelectorAll(".materialSelectionChip"));
    const categoryChip = chips.find((chip) => normalize(chip.textContent).startsWith("Категория:"));
    const daoChip = chips.find((chip) => normalize(chip.textContent).startsWith("DAO ступень:"));
    if (!categoryChip || !daoChip) return;
    const isDao = /Категория:\s*ДАО РИ/.test(normalize(categoryChip.textContent));
    daoChip.hidden = !isDao;
  }

  function applyRuntimeCategoryPatch() {
    injectChannelsIntoPowerLibrary();
    closeMobileCategoryPanels();
    hideIrrelevantDaoChip();
  }

  const observer = new MutationObserver(() => applyRuntimeCategoryPatch());

  function start() {
    applyRuntimeCategoryPatch();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
