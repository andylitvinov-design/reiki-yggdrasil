(() => {
  const HIDDEN_COVERS_KEY = "reiki-power-place-hidden-cover-shortcuts";
  const STYLE_ID = "profile-power-place-cover-polish-style";

  function readHiddenCovers() {
    try {
      return new Set(JSON.parse(window.localStorage.getItem(HIDDEN_COVERS_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function writeHiddenCovers(hidden) {
    try {
      window.localStorage.setItem(HIDDEN_COVERS_KEY, JSON.stringify([...hidden]));
    } catch {}
  }

  function ensureLateStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical {
        aspect-ratio: 9 / 19.5 !important;
      }
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .power-place-chess,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .powerMandala,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .altarMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .businessMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .zodiacMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .starMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle > .daoMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .power-place-chess,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .powerMandala,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .altarMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .businessMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .zodiacMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .starMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical > .daoMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .power-place-chess,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .powerMandala,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .altarMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .businessMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .zodiacMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .starMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle > .daoMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .power-place-chess,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .powerMandala,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .altarMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .businessMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .zodiacMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .starMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical > .daoMandalaSheet {
        aspect-ratio: 9 / 19.5 !important;
      }
      .profileLitePowerPlace .zodiacFieldPlusPosition,
      .powerPlacePdfOnlyArea .zodiacFieldPlusPosition {
        display: none !important;
      }
      .profileLitePowerPlace .coverUploadButton {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function buttonKey(button) {
    return (button.textContent || "").trim() || button.getAttribute("aria-label") || "";
  }

  function applyHiddenCoverShortcuts(root = document) {
    const hidden = readHiddenCovers();
    root.querySelectorAll?.(".profileLitePowerPlace .coverVariantList.coverVariantsGrid button").forEach((button) => {
      const index = [...button.parentElement.children].indexOf(button);
      const key = buttonKey(button);
      const isSavedShortcut = index >= 6;
      if (isSavedShortcut && key && hidden.has(key) && !button.classList.contains("active")) {
        button.hidden = true;
        button.setAttribute("data-cover-shortcut-hidden", "true");
      }
    });
  }

  function normalizeControls(root = document) {
    root.querySelectorAll?.(".profileLitePowerPlace .innerFieldScaleControl input[type='range']").forEach((input) => {
      input.max = "100";
    });
  }

  function clickNoCoverButton(container) {
    const noCoverButton = [...(container?.querySelectorAll("button") || [])]
      .find((button) => /без фона/i.test(button.textContent || ""));
    noCoverButton?.click();
  }

  function handleDocumentClick(event) {
    const coverPreview = event.target.closest?.(".profileLitePowerPlace .coverPreview");
    if (coverPreview) {
      const hasImage = coverPreview.classList.contains("hasImage");
      const hasTone = [...coverPreview.classList].some((className) => className.startsWith("tone-") && className !== "tone-none");
      if (!hasImage && !hasTone) {
        event.preventDefault();
        event.stopPropagation();
        document.querySelector(".profileLitePowerPlace .coverPickerButton")?.click();
      }
      return;
    }

    const coverButton = event.target.closest?.(".profileLitePowerPlace .coverVariantList.coverVariantsGrid button");
    if (coverButton) {
      const rect = coverButton.getBoundingClientRect();
      const clickedDeleteBadge = event.clientX >= rect.right - 30 && event.clientY <= rect.top + 30;
      const index = [...coverButton.parentElement.children].indexOf(coverButton);
      const isSavedShortcut = index >= 6;
      if (isSavedShortcut && clickedDeleteBadge) {
        event.preventDefault();
        event.stopPropagation();
        const hidden = readHiddenCovers();
        const key = buttonKey(coverButton);
        if (key) hidden.add(key);
        writeHiddenCovers(hidden);
        coverButton.hidden = true;
        coverButton.setAttribute("data-cover-shortcut-hidden", "true");
        if (coverButton.classList.contains("active")) clickNoCoverButton(coverButton.parentElement);
      }
    }
  }

  function refresh() {
    ensureLateStyles();
    normalizeControls(document);
    applyHiddenCoverShortcuts(document);
  }

  document.addEventListener("click", handleDocumentClick, true);
  window.addEventListener("reiki-route-change", refresh);
  window.addEventListener("DOMContentLoaded", refresh);
  window.setTimeout(refresh, 300);
  window.setTimeout(refresh, 1000);
})();
