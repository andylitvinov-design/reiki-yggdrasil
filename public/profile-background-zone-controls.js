(() => {
  const STORAGE_KEY = "reiki-power-background-zone-controls";
  const DEFAULT_STATE = { size: 94, shape: "circle" };

  const clampSize = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_STATE.size;
    return Math.min(100, Math.max(60, Math.round(parsed)));
  };

  const normalizeShape = (value) => value === "square" ? "square" : "circle";

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

  let state = loadState();

  const saveState = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_err) {
      // Non-critical: UI controls still work without localStorage.
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

  const applyState = () => {
    const radius = state.shape === "circle" ? "50%" : "26px";
    document.querySelectorAll(".powerPlacePrintArea, .powerMandalaPanel").forEach((element) => {
      element.style.setProperty("--power-zone-size", `${state.size}%`);
      element.style.setProperty("--power-zone-radius", radius);
      element.dataset.powerZoneShape = state.shape;
    });
    updateControlState();
  };

  const setState = (nextState) => {
    state = {
      size: clampSize(nextState?.size ?? state.size),
      shape: normalizeShape(nextState?.shape ?? state.shape)
    };
    saveState();
    applyState();
  };

  const createControls = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "powerBackgroundZoneControls";
    wrapper.setAttribute("aria-label", "Зона фона мандалы");
    wrapper.innerHTML = `
      <div class="powerBackgroundZoneHeader">
        <span>Зона фона</span>
        <small data-power-zone-value="size">${state.size}%</small>
      </div>
      <label>
        Размер зоны
        <input data-power-zone-control="size" type="range" min="60" max="100" step="1" value="${state.size}" />
      </label>
      <div class="powerBackgroundZoneShapeButtons" role="group" aria-label="Форма зоны фона">
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

  const ensureControls = () => {
    const coverSelector = document.querySelector(".coverSelector");
    if (!coverSelector || coverSelector.querySelector(".powerBackgroundZoneControls")) {
      applyState();
      return;
    }

    const controls = createControls();
    const preview = coverSelector.querySelector(".coverPreviewWrap");
    if (preview?.parentNode) {
      preview.parentNode.insertBefore(controls, preview.nextSibling);
    } else {
      coverSelector.appendChild(controls);
    }
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
    setState
  };
})();
