(() => {
  const STORAGE_KEY = "reiki-power-background-zone-controls";
  const TAB_STORAGE_KEY = "reiki-power-background-active-tab";
  const DEFAULT_STATE = { size: 94, shape: "circle" };
  const TABS = ["inner", "outer", "layout", "analysis"];

  const clampSize = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_STATE.size;
    return Math.min(100, Math.max(60, Math.round(parsed)));
  };

  const normalizeShape = (value) => value === "square" ? "square" : "circle";
  const normalizeTab = (value) => TABS.includes(value) ? value : "inner";

  const loadState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return {
        size: clampSize(parsed?.size),
        shape: normalizeShape(parsed?.shape)
      };
    } catch (_err) {
      return { ...DEFAULT_STATE };
    }
  };

  const loadActiveTab = () => {
    try {
      return normalizeTab(window.localStorage.getItem(TAB_STORAGE_KEY));
    } catch (_err) {
      return "inner";
    }
  };

  let state = loadState();
  let activeTab = loadActiveTab();

  const saveState = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_err) {
      // Non-critical: UI controls still work without localStorage.
    }
  };

  const saveActiveTab = () => {
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    } catch (_err) {
      // Non-critical: tab defaults to inner on the next load.
    }
  };

  const updateControlState = () => {
    document.querySelectorAll(".powerBackgroundZoneControls").forEach((control) => {
      const range = control.querySelector('[data-power-zone-control="size"]');
      const value = control.querySelector('[data-power-zone-value="size"]');
      if (range) range.value = String(state.size);
      if (value) value.textContent = `${state.size}%`;

      control.querySelectorAll("[data-power-zone-shape]").forEach((button) => {
        const isActive = button.dataset.powerZoneShape === state.shape;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });
  };

  const updateTabState = () => {
    document.querySelectorAll(".coverSelector").forEach((coverSelector) => {
      if (coverSelector.closest(".profileLitePowerPlace")) return;
      coverSelector.dataset.powerBackgroundTab = activeTab;
      coverSelector.querySelectorAll("[data-power-background-tab]").forEach((button) => {
        const isActive = button.dataset.powerBackgroundTab === activeTab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      coverSelector.querySelectorAll("[data-power-background-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.powerBackgroundPanel !== activeTab;
      });
    });
  };

  const applyState = () => {
    const radius = state.shape === "circle" ? "50%" : "26px";
    document.querySelectorAll(".powerPlacePrintArea, .powerMandalaPanel").forEach((element) => {
      element.style.setProperty("--power-zone-size", `${state.size}%`);
      element.style.setProperty("--power-zone-radius", radius);
      element.dataset.powerZoneShape = state.shape;
    });
    updateControlState();
    updateTabState();
  };

  const setState = (nextState) => {
    state = {
      size: clampSize(nextState?.size ?? state.size),
      shape: normalizeShape(nextState?.shape ?? state.shape)
    };
    saveState();
    applyState();
  };

  const setActiveTab = (nextTab) => {
    activeTab = normalizeTab(nextTab);
    saveActiveTab();
    updateTabState();
  };

  const createControls = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "powerBackgroundZoneControls";
    wrapper.setAttribute("aria-label", "Зона фона мандалы");
    wrapper.innerHTML = `
      <div class="powerBackgroundZoneHeader">
        <span>Внутреннее поле</span>
        <small data-power-zone-value="size">${state.size}%</small>
      </div>
      <label>
        Процент общего поля
        <input data-power-zone-control="size" type="range" min="60" max="100" step="1" value="${state.size}" />
      </label>
      <div class="powerBackgroundZoneShapeButtons" role="group" aria-label="Форма внутреннего поля">
        <button data-power-zone-shape="circle" type="button">Круг</button>
        <button data-power-zone-shape="square" type="button">Квадрат</button>
      </div>
    `;

    const range = wrapper.querySelector('[data-power-zone-control="size"]');
    range?.addEventListener("input", (event) => {
      setState({ size: event.target.value });
    });

    wrapper.querySelectorAll("[data-power-zone-shape]").forEach((button) => {
      button.addEventListener("click", () => {
        setState({ shape: button.dataset.powerZoneShape });
      });
    });

    return wrapper;
  };

  const createCustomTabButton = (tab, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.powerBackgroundTab = tab;
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => setActiveTab(tab));
    return button;
  };

  const markNativeTabs = (coverSelector) => {
    const tabs = coverSelector.querySelector(".coverLayerTabs");
    if (!tabs) return null;

    tabs.setAttribute("aria-label", "Фон и макет места силы");
    const buttons = Array.from(tabs.querySelectorAll("button"));
    const innerButton = buttons.find((button) => /внутри/i.test(button.textContent || "")) || buttons[0];
    const outerButton = buttons.find((button) => /снаружи/i.test(button.textContent || "")) || buttons[1];

    if (innerButton && !innerButton.dataset.powerBackgroundTab) {
      innerButton.dataset.powerBackgroundTab = "inner";
      innerButton.setAttribute("role", "tab");
      innerButton.addEventListener("click", () => setActiveTab("inner"));
    }
    if (outerButton && !outerButton.dataset.powerBackgroundTab) {
      outerButton.dataset.powerBackgroundTab = "outer";
      outerButton.setAttribute("role", "tab");
      outerButton.addEventListener("click", () => setActiveTab("outer"));
    }

    if (!tabs.querySelector('[data-power-background-tab="layout"]')) {
      tabs.appendChild(createCustomTabButton("layout", "Макет"));
    }
    if (!tabs.querySelector('[data-power-background-tab="analysis"]')) {
      tabs.appendChild(createCustomTabButton("analysis", "Анализ"));
    }

    return tabs;
  };

  const ensurePanel = (coverSelector, panelName) => {
    let panel = coverSelector.querySelector(`[data-power-background-panel="${panelName}"]`);
    if (!panel) {
      panel = document.createElement("div");
      panel.className = `powerBackgroundPanel powerBackgroundPanel-${panelName}`;
      panel.dataset.powerBackgroundPanel = panelName;
      coverSelector.appendChild(panel);
    }
    return panel;
  };

  const moveBackgroundControls = (coverSelector) => {
    if (coverSelector.querySelector('[data-power-background-panel="inner"]')) return;

    const innerPanel = ensurePanel(coverSelector, "inner");
    const outerPanel = ensurePanel(coverSelector, "outer");
    const layoutPanel = ensurePanel(coverSelector, "layout");
    const analysisPanel = ensurePanel(coverSelector, "analysis");

    [
      ".coverPreviewWrap",
      ".coverVariantList",
      ".coverUploadButton",
      ".coverPickerButton",
      ".coverNotice"
    ].forEach((selector) => {
      const element = coverSelector.querySelector(`:scope > ${selector}`) || coverSelector.querySelector(selector);
      if (element && !innerPanel.contains(element)) innerPanel.appendChild(element);
    });

    outerPanel.innerHTML = `
      <div class="powerBackgroundPanelNote">
        <b>Фон снаружи</b>
        <span>Выберите вкладку «Фон снаружи», затем используйте тот же список фонов ниже. Выбор сохраняется как внешний фон общего поля.</span>
      </div>
    `;
    const outerMirror = innerPanel.cloneNode(true);
    outerMirror.classList.add("powerBackgroundOuterMirror");
    outerPanel.appendChild(outerMirror);

    const fieldSwitch = document.querySelector(".mandalaFieldLayoutSwitch");
    if (fieldSwitch && !layoutPanel.contains(fieldSwitch)) layoutPanel.appendChild(fieldSwitch);
    if (!layoutPanel.querySelector(".powerBackgroundZoneControls")) layoutPanel.appendChild(createControls());

    const comparison = document.querySelector(".resourceComparisonPanel");
    if (comparison && !analysisPanel.contains(comparison)) analysisPanel.appendChild(comparison);
  };

  const ensureControls = () => {
    const coverSelector = document.querySelector(".coverSelector");
    if (!coverSelector) {
      applyState();
      return;
    }
    if (coverSelector.closest(".profileLitePowerPlace")) {
      applyState();
      return;
    }

    markNativeTabs(coverSelector);
    moveBackgroundControls(coverSelector);
    applyState();
  };

  const scheduleEnsure = () => window.requestAnimationFrame(ensureControls);

  window.addEventListener("DOMContentLoaded", scheduleEnsure);
  window.addEventListener("load", scheduleEnsure);

  const observer = new MutationObserver(scheduleEnsure);
  const startObserver = () => {
    const root = document.getElementById("root") || document.body;
    observer.observe(root, { childList: true, subtree: true });
    ensureControls();
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }

  window.__reikiPowerBackgroundZoneControls = {
    getState: () => ({ ...state }),
    setState,
    getActiveTab: () => activeTab,
    setActiveTab
  };
})();
