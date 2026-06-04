// Profile Lite custom inner cover fix — 2026-06-04
// No MutationObserver: this mirrors React's inline signed-photo backgroundImage
// into a CSS variable so legacy background-zone !important rules cannot erase it.
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

  function hasSignedCoverImage(element) {
    const inlineImage = element?.style?.backgroundImage || "";
    return /^url\(["']?https?:\/\//.test(inlineImage);
  }

  function syncInnerCoverImages() {
    document.querySelectorAll(rootSelector).forEach((root) => {
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
    });
  }

  function scheduleSync() {
    window.requestAnimationFrame(syncInnerCoverImages);
    window.setTimeout(syncInnerCoverImages, 80);
    window.setTimeout(syncInnerCoverImages, 240);
  }

  window.addEventListener("DOMContentLoaded", scheduleSync);
  window.addEventListener("load", scheduleSync);
  window.addEventListener("reiki-route-change", scheduleSync);
  window.addEventListener("click", scheduleSync, true);
  window.addEventListener("input", scheduleSync, true);
  window.setInterval(syncInnerCoverImages, 1000);
  scheduleSync();
})();
