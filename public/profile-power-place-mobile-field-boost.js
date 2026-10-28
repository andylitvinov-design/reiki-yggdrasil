(() => {
  const STYLE_ID = "profile-power-place-mobile-field-boost-style";
  const MOBILE_MAX_WIDTH = 640;
  const MAX_VISUAL_FIELD_SCALE = 230;
  const BOOST_START = 100;
  const BOOST_FACTOR = 1.9;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
@media (max-width: 640px) {
  .profileLitePowerPlace .powerMandalaPanel[style] {
    overflow: hidden !important;
  }

  .profileLitePowerPlace .powerMandalaPanel[style] > .daoMandalaSheet,
  .profileLitePowerPlace .powerMandalaPanel[style] > .zodiacMandalaSheet {
    max-width: none !important;
    flex: 0 0 auto !important;
  }

  .profileLitePowerPlace .zodiacPositionImage,
  .profileLitePowerPlace .zodiacFieldPlusPositionImage {
    width: min(92px, 100%) !important;
  }

  .profileLitePowerPlace .daoElementImage {
    width: min(96px, 100%) !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function readFieldScale() {
    const slider = document.querySelector('.profileLitePowerPlace .innerFieldScaleControl input[type="range"]');
    const sliderValue = Number(slider?.value);
    if (Number.isFinite(sliderValue)) return sliderValue;

    const panel = document.querySelector('.profileLitePowerPlace .powerMandalaPanel[style]');
    const cssValue = String(panel?.style?.getPropertyValue("--power-field-scale") || "").replace("%", "");
    const parsedCssValue = Number(cssValue);
    return Number.isFinite(parsedCssValue) ? parsedCssValue : 78;
  }

  function visualFieldScale(fieldScale) {
    if (!Number.isFinite(fieldScale)) return 78;
    if (fieldScale <= BOOST_START) return fieldScale;
    return Math.min(MAX_VISUAL_FIELD_SCALE, fieldScale + ((fieldScale - BOOST_START) * BOOST_FACTOR));
  }

  function resetSheet(sheet) {
    sheet.style.removeProperty("width");
    sheet.style.removeProperty("max-width");
    sheet.style.removeProperty("flex");
  }

  function isolatedDaoGeometry(sheet) {
    if (!sheet?.classList?.contains("daoMandalaSheet")) return null;
    if (sheet.classList.contains("dao-shared-stage")) {
      return { width: "auto", maxWidth: "92%" };
    }
    if (sheet.classList.contains("dao-talisman")) {
      return { width: "min(190px, 64%)", maxWidth: "min(190px, 64%)" };
    }
    if (sheet.classList.contains("dao-talisman-2")) {
      return { width: "min(190px, 64%)", maxWidth: "min(190px, 64%)" };
    }
    if (
      sheet.classList.contains("dao-fu-paper-slip") ||
      sheet.classList.contains("dao-cloud-register") ||
      sheet.classList.contains("dao-thunder-tablet") ||
      sheet.classList.contains("dao-taofu-charm")
    ) {
      return { width: "min(220px, 58vw)", maxWidth: "min(220px, 58vw)" };
    }
    return null;
  }

  function applyBoost() {
    ensureStyle();

    const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
    const fieldScale = readFieldScale();
    const visualScale = visualFieldScale(fieldScale);

    document.querySelectorAll('.profileLitePowerPlace .powerMandalaPanel[style]').forEach((panel) => {
      const sheet = panel.querySelector(':scope > .daoMandalaSheet, :scope > .zodiacMandalaSheet');
      if (!sheet) return;

      if (!isMobile) {
        resetSheet(sheet);
        return;
      }

      panel.style.setProperty("overflow", "hidden", "important");
      const daoGeometry = isolatedDaoGeometry(sheet);
      sheet.style.setProperty("width", daoGeometry?.width || `${visualScale}%`, "important");
      sheet.style.setProperty("max-width", daoGeometry?.maxWidth || `${visualScale}%`, "important");
      sheet.style.setProperty("flex", "0 0 auto", "important");
    });
  }

  function scheduleApply() {
    window.requestAnimationFrame(() => {
      applyBoost();
      window.setTimeout(applyBoost, 80);
      window.setTimeout(applyBoost, 240);
    });
  }

  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", scheduleApply, { passive: true });
  document.addEventListener("input", (event) => {
    if (event.target?.matches?.('.profileLitePowerPlace input[type="range"]')) scheduleApply();
  }, true);
  document.addEventListener("change", (event) => {
    if (event.target?.matches?.('.profileLitePowerPlace input[type="range"]')) scheduleApply();
  }, true);
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.('.profileLitePowerPlace')) scheduleApply();
  }, true);

  const observer = new MutationObserver(scheduleApply);
  window.addEventListener("DOMContentLoaded", () => {
    ensureStyle();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    scheduleApply();
  });

  if (document.readyState !== "loading") {
    ensureStyle();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    scheduleApply();
  }
})();
