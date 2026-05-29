(() => {
  const PANEL_SELECTOR = ".sourceDropdownPanel";
  const QUICK_LIST_CLASS = "sourceDropdownQuickList";

  function syncPanel(panel) {
    if (!panel || panel.dataset.sourceQuickListReady === "true") return;
    const selects = panel.querySelectorAll("select");
    const categorySelect = selects[1];
    const subcategorySelect = selects[2];
    const categoryLabel = categorySelect?.closest("label");
    if (!categorySelect || !categoryLabel) return;

    const quickList = document.createElement("div");
    quickList.className = QUICK_LIST_CLASS;
    categoryLabel.after(quickList);
    panel.dataset.sourceQuickListReady = "true";

    function render() {
      quickList.innerHTML = "";
      Array.from(categorySelect.options).forEach((option) => {
        if (!option.value) return;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.textContent;
        button.className = option.selected ? "active" : "";
        button.addEventListener("click", () => {
          categorySelect.value = option.value;
          categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
          window.setTimeout(render, 0);
          window.setTimeout(() => subcategorySelect?.focus?.(), 0);
        });
        quickList.append(button);
      });
    }

    categorySelect.addEventListener("change", render);
    selects[0]?.addEventListener("change", () => window.setTimeout(render, 0));
    render();
  }

  function scan() {
    document.querySelectorAll(PANEL_SELECTOR).forEach(syncPanel);
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
