(() => {
  const PROFILE_PATH = "/profile";
  const PANEL_SELECTOR = ".powerMandalaPanel";

  function ensureSourceDropdownAssets() {
    if (!document.querySelector('link[href="/profile-source-dropdowns.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/profile-source-dropdowns.css";
      document.head.append(link);
    }

    if (!document.querySelector('script[src="/profile-source-dropdowns-runtime.js"]')) {
      const script = document.createElement("script");
      script.src = "/profile-source-dropdowns-runtime.js";
      script.defer = true;
      document.body.append(script);
    }
  }

  function isProfileRoute() {
    return window.location.pathname === PROFILE_PATH;
  }

  function getButtonLabel(target) {
    const trigger = target?.closest?.("button, a");
    return {
      trigger,
      label: String(trigger?.textContent || "").replace(/\s+/g, " ").trim()
    };
  }

  function safeFilename(value) {
    return String(value || "power-place")
      .toLowerCase()
      .replace(/[^a-z0-9а-яё_-]+/giu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "power-place";
  }

  function copyVisualStyles(source, clone) {
    const styles = window.getComputedStyle(source);
    const cssText = Array.from(styles)
      .map((name) => `${name}:${styles.getPropertyValue(name)};`)
      .join("");
    clone.setAttribute("style", cssText);

    Array.from(source.children).forEach((child, index) => {
      const clonedChild = clone.children[index];
      if (clonedChild) copyVisualStyles(child, clonedChild);
    });
  }

  function removeNonVisualControls(clone) {
    clone.querySelectorAll("button,input,select,textarea,.powerCommandRail,.powerPanelActions,.powerMandalaActions,.mandalaActions,.powerPrintMeta,.resourcePrintNotes,.powerPlaceHint").forEach((node) => node.remove());
  }

  function buildExportHtml(panel) {
    const clone = panel.cloneNode(true);
    copyVisualStyles(panel, clone);
    removeNonVisualControls(clone);
    clone.setAttribute("data-export", "power-place-visual-only");

    return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Power Place</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #fffaf0;
    }
    @media print {
      body { padding: 0; background: #fff; }
      [data-export="power-place-visual-only"] { box-shadow: none !important; }
    }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`;
  }

  function downloadVisualPanel() {
    const panel = document.querySelector(PANEL_SELECTOR);
    if (!panel) return false;

    const html = buildExportHtml(panel);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${safeFilename(document.title || "power-place")}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  }

  document.addEventListener("click", (event) => {
    if (!isProfileRoute()) return;
    const { trigger, label } = getButtonLabel(event.target);
    if (!trigger || label !== "Скачать") return;
    if (!document.querySelector(PANEL_SELECTOR)) return;

    event.preventDefault();
    event.stopPropagation();
    downloadVisualPanel();
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureSourceDropdownAssets, { once: true });
  } else {
    ensureSourceDropdownAssets();
  }
})();
