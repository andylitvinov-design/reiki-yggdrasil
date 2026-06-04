// Profile Lite custom cover fix — 2026-06-04
// No MutationObserver: mirrors React inline signed-photo backgroundImage values
// into CSS variables so late legacy/public !important layers cannot erase them.
(() => {
  const rootSelector = ".profileLitePowerPlace, .powerPlacePdfOnlyArea";
  const innerSelectors = [
    ".powerMandalaPanel > .powerMandala",
    ".powerMandalaPanel > .altarMandalaSheet",
    ".powerMandalaPanel > .businessMandalaSheet",
    ".powerMandalaPanel > .zodiacMandalaSheet",
    ".powerMandalaPanel > .starMandalaSheet",
    ".powerMandalaPanel > .daoMandalaSheet"
  ].join(",");
  const outerSelectors = ".powerMandalaPanel";

  function hasSignedCoverImage(element) {
    const inlineImage = element?.style?.backgroundImage || "";
    return /^url\(["']?https?:\/\//.test(inlineImage);
  }

  function syncInnerCoverImages(root) {
    root.querySelectorAll(innerSelectors).forEach((element) => {
      const inlineImage = element.style.backgroundImage || "";
      if (!hasSignedCoverImage(element)) {
        element.classList.remove("profileLiteCustomInnerCover");
        element.style.removeProperty("--profile-lite-inner-cover-image");
        return;
      }

      element.classList.add("profileLiteCustomInnerCover");
      element.style.setProperty("--profile-lite-inner-cover-image", inlineImage);
    });
  }

  function syncOuterCoverImages(root) {
    root.querySelectorAll(outerSelectors).forEach((element) => {
      const inlineImage = element.style.backgroundImage || "";
      if (!hasSignedCoverImage(element)) {
        element.classList.remove("profileLiteCustomOuterCover");
        element.style.removeProperty("--profile-lite-outer-cover-image");
        return;
      }

      element.classList.add("profileLiteCustomOuterCover");
      element.style.setProperty("--profile-lite-outer-cover-image", inlineImage);
    });
  }

  function syncCoverImages() {
    document.querySelectorAll(rootSelector).forEach((root) => {
      syncInnerCoverImages(root);
      syncOuterCoverImages(root);
    });
  }

  function scheduleSync() {
    window.requestAnimationFrame(syncCoverImages);
    window.setTimeout(syncCoverImages, 80);
    window.setTimeout(syncCoverImages, 240);
  }

  window.addEventListener("DOMContentLoaded", scheduleSync);
  window.addEventListener("load", scheduleSync);
  window.addEventListener("reiki-route-change", scheduleSync);
  window.addEventListener("click", scheduleSync, true);
  window.addEventListener("input", scheduleSync, true);
  window.setInterval(syncCoverImages, 1000);
  scheduleSync();
})();
