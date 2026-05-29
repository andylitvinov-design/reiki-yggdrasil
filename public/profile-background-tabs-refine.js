(() => {
  const PANEL_SELECTOR = "[data-power-background-panel]";
  const TAB_SELECTOR = "[data-power-background-tab]";
  const tabs = ["inner", "outer", "layout", "analysis"];

  const readTab = (coverSelector) => {
    const current = coverSelector?.dataset?.powerBackgroundTab;
    return tabs.includes(current) ? current : "inner";
  };

  const writeTab = (coverSelector, tab) => {
    const nextTab = tabs.includes(tab) ? tab : "inner";
    coverSelector.dataset.powerBackgroundTab = nextTab;
    if (window.__reikiPowerBackgroundZoneControls?.setActiveTab) {
      window.__reikiPowerBackgroundZoneControls.setActiveTab(nextTab);
    }
  };

  const syncPanels = () => {
    document.querySelectorAll(".coverSelector").forEach((coverSelector) => {
      const activeTab = readTab(coverSelector);
      coverSelector.querySelectorAll(TAB_SELECTOR).forEach((button) => {
        const isActive = button.dataset.powerBackgroundTab === activeTab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      coverSelector.querySelectorAll(PANEL_SELECTOR).forEach((panel) => {
        const panelName = panel.dataset.powerBackgroundPanel;
        const isSharedBackground = panelName === "inner" && (activeTab === "inner" || activeTab === "outer");
        const isDirectMatch = panelName === activeTab;
        const shouldShow = isSharedBackground || isDirectMatch;
        panel.hidden = !shouldShow;
      });

      const outerPanel = coverSelector.querySelector('[data-power-background-panel="outer"]');
      if (outerPanel) outerPanel.hidden = true;
    });
  };

  const wireTabs = () => {
    document.querySelectorAll(".coverSelector").forEach((coverSelector) => {
      coverSelector.querySelectorAll(TAB_SELECTOR).forEach((button) => {
        if (button.dataset.powerTabsRefined === "true") return;
        button.dataset.powerTabsRefined = "true";
        button.addEventListener("click", () => {
          writeTab(coverSelector, button.dataset.powerBackgroundTab);
          window.requestAnimationFrame(syncPanels);
        });
      });
    });
  };

  const sync = () => {
    wireTabs();
    syncPanels();
  };

  const scheduleSync = () => window.requestAnimationFrame(sync);
  window.addEventListener("DOMContentLoaded", scheduleSync);
  window.addEventListener("load", scheduleSync);
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.(".coverSelector")) scheduleSync();
  });

  const observer = new MutationObserver(scheduleSync);
  const start = () => {
    const root = document.getElementById("root") || document.body;
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "data-power-background-tab"] });
    sync();
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
