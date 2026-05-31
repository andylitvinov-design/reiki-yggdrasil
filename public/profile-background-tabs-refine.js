(() => {
  const PANEL_SELECTOR = "[data-power-background-panel]";
  const TAB_SELECTOR = "[data-power-background-tab]";
  const tabs = ["inner", "outer", "layout", "analysis"];
  let syncQueued = false;

  const readTab = (coverSelector) => {
    const current = coverSelector?.dataset?.powerBackgroundTab;
    return tabs.includes(current) ? current : "inner";
  };

  const writeTab = (coverSelector, tab) => {
    const nextTab = tabs.includes(tab) ? tab : "inner";
    if (coverSelector.dataset.powerBackgroundTab !== nextTab) {
      coverSelector.dataset.powerBackgroundTab = nextTab;
    }
    if (window.__reikiPowerBackgroundZoneControls?.setActiveTab) {
      window.__reikiPowerBackgroundZoneControls.setActiveTab(nextTab);
    }
  };

  const setHidden = (element, hidden) => {
    if (!element || element.hidden === hidden) return;
    element.hidden = hidden;
  };

  const setActive = (button, active) => {
    if (!button) return;
    if (button.classList.contains("active") !== active) button.classList.toggle("active", active);
    const ariaValue = active ? "true" : "false";
    if (button.getAttribute("aria-selected") !== ariaValue) button.setAttribute("aria-selected", ariaValue);
  };

  const syncPanels = () => {
    document.querySelectorAll(".coverSelector").forEach((coverSelector) => {
      const activeTab = readTab(coverSelector);
      coverSelector.querySelectorAll(TAB_SELECTOR).forEach((button) => {
        setActive(button, button.dataset.powerBackgroundTab === activeTab);
      });

      coverSelector.querySelectorAll(PANEL_SELECTOR).forEach((panel) => {
        const panelName = panel.dataset.powerBackgroundPanel;
        const isSharedBackground = panelName === "inner" && (activeTab === "inner" || activeTab === "outer");
        const isDirectMatch = panelName === activeTab;
        const shouldShow = isSharedBackground || isDirectMatch;
        setHidden(panel, !shouldShow);
      });

      setHidden(coverSelector.querySelector('[data-power-background-panel="outer"]'), true);
    });
  };

  const wireTabs = () => {
    document.querySelectorAll(".coverSelector").forEach((coverSelector) => {
      coverSelector.querySelectorAll(TAB_SELECTOR).forEach((button) => {
        if (button.dataset.powerTabsRefined === "true") return;
        button.dataset.powerTabsRefined = "true";
        button.addEventListener("click", () => {
          writeTab(coverSelector, button.dataset.powerBackgroundTab);
          scheduleSync();
        });
      });
    });
  };

  const sync = () => {
    syncQueued = false;
    wireTabs();
    syncPanels();
  };

  const scheduleSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(sync);
  };

  window.addEventListener("DOMContentLoaded", scheduleSync);
  window.addEventListener("load", scheduleSync);
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.(".coverSelector")) scheduleSync();
  });

  const observer = new MutationObserver(scheduleSync);
  const start = () => {
    const root = document.getElementById("root") || document.body;
    // Watch for new panels/buttons only. Do not observe hidden/class/data attributes that this script writes.
    observer.observe(root, { childList: true, subtree: true });
    sync();
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
