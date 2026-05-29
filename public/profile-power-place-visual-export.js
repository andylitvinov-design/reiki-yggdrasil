(() => {
  const PROFILE_PATH = "/profile";
  const PANEL_SELECTOR = ".powerMandalaPanel";
  const PRINT_AREA_SELECTOR = ".powerPlacePrintArea";
  const ACTIONS_SELECTOR = ".powerPlaceActions";
  const SOURCE_DROPDOWN_VERSION = "site-structure-20260529";
  const PDF_PRINT_CLASS = "printMandalaOnly";
  const MOBILE_QUERY = "(max-width: 980px)";
  const SELECTED_COMPOSITION_HOOK_INDEX = 39;
  let actionsPlaceholder = null;
  let printCleanupTimer = null;

  function ensureSourceDropdownAssets() {
    if (!document.querySelector('link[data-profile-source-dropdowns="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/profile-source-dropdowns.css?v=${SOURCE_DROPDOWN_VERSION}`;
      link.dataset.profileSourceDropdowns = "true";
      document.head.append(link);
    }

    if (!document.querySelector('script[data-profile-source-dropdowns="true"]')) {
      const script = document.createElement("script");
      script.src = `/profile-source-dropdowns-runtime.js?v=${SOURCE_DROPDOWN_VERSION}`;
      script.defer = true;
      script.dataset.profileSourceDropdowns = "true";
      document.body.append(script);
    }
  }

  function ensurePdfPrintStyles() {
    if (document.querySelector('style[data-profile-pdf-print="true"]')) return;

    const style = document.createElement("style");
    style.dataset.profilePdfPrint = "true";
    style.textContent = `
      .profilePdfPrintImage,
      .profilePdfPrintCoverImage,
      .profilePdfPrintInnerCoverImage {
        display: none !important;
      }

      .profilePdfPrintImageHost,
      .profilePdfPrintCoverHost {
        position: relative !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .coverVariantList button.profileHiddenCoverVariant {
        display: none !important;
      }

      .altarMandalaSheet.ratio-1 .altarTopRow,
      .altarMandalaSheet.ratio-1-5 .altarTopRow,
      .altarMandalaSheet.ratio-2 .altarTopRow,
      .altarMandalaSheet.ratio-3 .altarTopRow {
        grid-template-columns: 1fr 1fr auto 1fr 1fr !important;
        align-items: center !important;
      }

      .altarMandalaSheet .altarTopSource.main {
        width: 88px !important;
        height: 88px !important;
        min-height: 0 !important;
        max-width: min(88vw, 260px) !important;
        justify-self: center !important;
        align-self: center !important;
      }

      .altarMandalaSheet.ratio-1 .altarTopSource.main {
        width: 88px !important;
        height: 88px !important;
      }

      .altarMandalaSheet.ratio-1-5 .altarTopSource.main {
        width: 132px !important;
        height: 88px !important;
      }

      .altarMandalaSheet.ratio-2 .altarTopSource.main {
        width: 176px !important;
        height: 88px !important;
      }

      .altarMandalaSheet.ratio-3 .altarTopSource.main {
        width: 246px !important;
        height: 82px !important;
      }

      @media (max-width: 980px) {
        ${ACTIONS_SELECTOR}.profileMobileMandalaActions {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 7px !important;
          margin: 10px 0 12px !important;
          padding: 0 !important;
          align-items: stretch !important;
        }

        ${ACTIONS_SELECTOR}.profileMobileMandalaActions.profileHasSaveCopy {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }

        ${ACTIONS_SELECTOR}.profileMobileMandalaActions button {
          width: 100% !important;
          min-width: 0 !important;
          min-height: 40px !important;
          padding: 8px 4px !important;
          font-size: 10px !important;
          line-height: 1.08 !important;
          justify-content: center !important;
          text-align: center !important;
          white-space: nowrap !important;
        }

        ${ACTIONS_SELECTOR}.profileMobileMandalaActions span {
          grid-column: 1 / -1 !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
        }

        .powerPlacePrintArea .altarMandalaSheet,
        .powerPlacePrintArea .zodiacMandalaSheet,
        .powerPlacePrintArea .starMandalaSheet,
        .powerPlacePrintArea .businessMandalaSheet,
        .powerPlacePrintArea .daoMandalaSheet,
        .powerPlacePrintArea .powerMandala {
          width: min(390px, 98%) !important;
          max-width: 100% !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .powerMandalaPanel {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }

        .altarMandalaSheet .altarTopSource.main {
          width: 72px !important;
          height: 72px !important;
        }

        .altarMandalaSheet.ratio-1 .altarTopSource.main {
          width: 72px !important;
          height: 72px !important;
        }

        .altarMandalaSheet.ratio-1-5 .altarTopSource.main {
          width: 108px !important;
          height: 72px !important;
        }

        .altarMandalaSheet.ratio-2 .altarTopSource.main {
          width: 144px !important;
          height: 72px !important;
        }

        .altarMandalaSheet.ratio-3 .altarTopSource.main {
          width: 206px !important;
          height: 68px !important;
        }
      }

      @media print {
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .profilePdfPrintImageHost,
        .profilePdfPrintCoverHost {
          color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .profilePdfPrintCoverImage,
        .profilePdfPrintInnerCoverImage,
        .profilePdfPrintImage {
          position: absolute !important;
          inset: 0 !important;
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border: 0 !important;
          border-radius: inherit !important;
          pointer-events: none !important;
        }

        .profilePdfPrintCoverImage {
          z-index: 0 !important;
        }

        .profilePdfPrintInnerCoverImage,
        .profilePdfPrintImage {
          z-index: 1 !important;
        }

        .profilePdfPrintImageHost > span {
          position: relative !important;
          z-index: 2 !important;
        }

        body.${PDF_PRINT_CLASS} ${ACTIONS_SELECTOR},
        body.${PDF_PRINT_CLASS} .compositionTitleField,
        body.${PDF_PRINT_CLASS} .powerCommandRail,
        body.${PDF_PRINT_CLASS} .clientPhotoPickerBackdrop {
          display: none !important;
        }
      }
    `;
    document.head.append(style);
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

  function normalizeActionLabels() {
    if (!isProfileRoute()) return;
    document.querySelectorAll(`${ACTIONS_SELECTOR} button`).forEach((button) => {
      const label = String(button.textContent || "").replace(/\s+/g, " ").trim();
      if (label === "Скачать") button.textContent = "Скачать PDF";
      if (label === "Распечатать") button.textContent = "Печать";
      if (label === "Сохранить место силы") button.textContent = "Сохранить";
      if (label === "Обновить место силы") button.textContent = "Обновить";
    });
  }

  function reactFiberFromNode(node) {
    if (!node) return null;
    const key = Object.keys(node).find((item) => item.startsWith("__reactFiber$") || item.startsWith("__reactInternalInstance$"));
    return key ? node[key] : null;
  }

  function findProfileFiber() {
    const root = document.querySelector(".cabinetShell") || document.getElementById("root");
    let fiber = reactFiberFromNode(root);
    while (fiber) {
      if (fiber.type?.name === "ProfilePage" || fiber.elementType?.name === "ProfilePage") return fiber;
      fiber = fiber.return;
    }
    fiber = reactFiberFromNode(document.getElementById("root")?.firstElementChild || document.body);
    const stack = fiber ? [fiber] : [];
    const seen = new Set();
    while (stack.length) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      if (current.type?.name === "ProfilePage" || current.elementType?.name === "ProfilePage") return current;
      if (current.child) stack.push(current.child);
      if (current.sibling) stack.push(current.sibling);
    }
    return null;
  }

  function dispatchProfileState(index, value) {
    let hook = findProfileFiber()?.memoizedState;
    for (let currentIndex = 0; hook && currentIndex < index; currentIndex += 1) hook = hook.next;
    const dispatch = hook?.queue?.dispatch;
    if (typeof dispatch !== "function") return false;
    dispatch(value);
    return true;
  }

  function currentCompositionIdFromSelect() {
    const select = [...document.querySelectorAll("select")].find((item) =>
      [...item.options].some((option) => String(option.textContent || "").includes("Загрузить сохранённое место силы"))
    );
    return select?.value || "";
  }

  function primaryCompositionButton(actions) {
    return [...(actions?.querySelectorAll("button") || [])].find((button) => {
      if (button.dataset.profileSaveNew === "true") return false;
      const label = String(button.textContent || "").trim();
      return label === "Сохранить" || label === "Обновить" || label === "Сохранить место силы" || label === "Обновить место силы";
    }) || null;
  }

  function createSaveNewButton(actions, primaryButton) {
    let button = actions.querySelector('[data-profile-save-new="true"]');
    if (button) return button;
    button = document.createElement("button");
    button.type = "button";
    button.dataset.profileSaveNew = "true";
    button.className = primaryButton?.className || "cabinetSecondary";
    button.textContent = "Сохранить";
    actions.insertBefore(button, primaryButton || actions.firstChild);
    return button;
  }

  function ensureSeparateSaveUpdateButtons() {
    const actions = document.querySelector(ACTIONS_SELECTOR);
    const primaryButton = primaryCompositionButton(actions);
    if (!actions || !primaryButton) return;

    const isEditingSaved = Boolean(currentCompositionIdFromSelect()) || String(primaryButton.textContent || "").includes("Обновить");
    const saveNewButton = actions.querySelector('[data-profile-save-new="true"]');

    if (!isEditingSaved) {
      saveNewButton?.remove();
      actions.classList.remove("profileHasSaveCopy");
      primaryButton.textContent = "Сохранить";
      return;
    }

    createSaveNewButton(actions, primaryButton);
    actions.classList.add("profileHasSaveCopy");
    primaryButton.textContent = "Обновить";
  }

  function saveCurrentAsNew() {
    const actions = document.querySelector(ACTIONS_SELECTOR);
    const primaryButton = primaryCompositionButton(actions);
    if (!primaryButton) return;
    const cleared = dispatchProfileState(SELECTED_COMPOSITION_HOOK_INDEX, "");
    if (!cleared) {
      window.alert("Не удалось переключить режим сохранения. Обновите страницу и попробуйте снова.");
      return;
    }
    window.setTimeout(() => primaryButton.click(), 80);
  }

  function syncMobileActionsPlacement() {
    if (!isProfileRoute()) return;
    const actions = document.querySelector(ACTIONS_SELECTOR);
    const panel = document.querySelector(PANEL_SELECTOR);
    if (!actions || !panel?.parentNode) return;

    if (!actionsPlaceholder) {
      actionsPlaceholder = document.createComment("profile-power-place-actions-original-position");
      actions.parentNode?.insertBefore(actionsPlaceholder, actions);
    }

    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    if (isMobile) {
      actions.classList.add("profileMobileMandalaActions");
      if (actions.previousElementSibling !== panel) {
        panel.parentNode.insertBefore(actions, panel.nextSibling);
      }
      return;
    }

    actions.classList.remove("profileMobileMandalaActions");
    if (actionsPlaceholder?.parentNode && actions.previousSibling !== actionsPlaceholder) {
      actionsPlaceholder.parentNode.insertBefore(actions, actionsPlaceholder.nextSibling);
    }
  }

  function normalizeUrl(raw) {
    const value = String(raw || "").trim();
    if (!value || value === "none" || value.startsWith("storage://")) return "";
    return value.replace(/^['"]|['"]$/g, "");
  }

  function extractUrlsFromCssValue(value) {
    return [...String(value || "").matchAll(/url\((['"]?)(.*?)\1\)/g)]
      .map((match) => normalizeUrl(match[2]))
      .filter(Boolean);
  }

  function getCssImageVarUrls(styles, names) {
    return names.flatMap((name) => extractUrlsFromCssValue(styles.getPropertyValue(name)));
  }

  function uniqueUrls(urls) {
    return [...new Set(urls.map(normalizeUrl).filter(Boolean))];
  }

  function extractBackgroundImageUrls(node) {
    const styles = window.getComputedStyle(node);
    return uniqueUrls([
      ...extractUrlsFromCssValue(styles.backgroundImage),
      ...getCssImageVarUrls(styles, ["--power-cover-image", "--power-outer-cover-image"])
    ]);
  }

  function upsertImage(node, className, src) {
    const existing = node.querySelector(`:scope > img.${className}`);
    if (!src) {
      existing?.remove();
      return;
    }

    if (existing) {
      if (existing.getAttribute("src") !== src) existing.setAttribute("src", src);
      return;
    }

    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    img.decoding = "async";
    img.setAttribute("src", src);
    node.prepend(img);
  }

  function ensurePrintImages(node) {
    const urls = extractBackgroundImageUrls(node);
    const isPanel = node.matches?.(PANEL_SELECTOR);
    const isMandalaSheet = node.matches?.(".powerMandala,.altarMandalaSheet,.businessMandalaSheet,.zodiacMandalaSheet,.starMandalaSheet,.daoMandalaSheet");

    if (!urls.length) {
      upsertImage(node, "profilePdfPrintImage", "");
      upsertImage(node, "profilePdfPrintCoverImage", "");
      upsertImage(node, "profilePdfPrintInnerCoverImage", "");
      node.classList.remove("profilePdfPrintImageHost", "profilePdfPrintCoverHost");
      return;
    }

    if (isPanel) {
      node.classList.add("profilePdfPrintCoverHost");
      upsertImage(node, "profilePdfPrintCoverImage", urls[0]);
      return;
    }

    if (isMandalaSheet) {
      node.classList.add("profilePdfPrintCoverHost");
      upsertImage(node, "profilePdfPrintInnerCoverImage", urls[urls.length - 1]);
      return;
    }

    node.classList.add("profilePdfPrintImageHost");
    upsertImage(node, "profilePdfPrintImage", urls[urls.length - 1]);
  }

  function preparePrintImages() {
    ensurePdfPrintStyles();
    const area = document.querySelector(PRINT_AREA_SELECTOR);
    if (!area) return false;

    [area, ...area.querySelectorAll("*")].forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      ensurePrintImages(node);
    });

    return true;
  }

  function syncCoverVariantList() {
    const list = document.querySelector(".coverVariantList");
    if (!list) return;

    const buttons = [...list.querySelectorAll("button")];
    const baseLabels = ["Карта мандалы", "Золотой поток", "Древо силы", "Ночная мандала"];
    let uploadedCount = 0;

    buttons.forEach((button) => {
      const label = String(button.textContent || "").trim();
      const isBase = baseLabels.some((item) => label.includes(item));
      const isNone = label.includes("Без фона");

      if (isBase) {
        button.classList.remove("profileHiddenCoverVariant");
        return;
      }

      if (!isNone && uploadedCount < 4) {
        uploadedCount += 1;
        button.classList.remove("profileHiddenCoverVariant");
        return;
      }

      button.classList.add("profileHiddenCoverVariant");
    });
  }

  function cleanupPrintModeSoon() {
    window.clearTimeout(printCleanupTimer);
    printCleanupTimer = window.setTimeout(() => {
      document.body.classList.remove(PDF_PRINT_CLASS);
    }, 1500);
  }

  function startPdfPrint() {
    const ready = preparePrintImages();
    if (!ready) return false;

    document.body.classList.add(PDF_PRINT_CLASS);
    window.clearTimeout(printCleanupTimer);
    window.setTimeout(() => window.print(), 60);
    cleanupPrintModeSoon();
    return true;
  }

  function enhanceProfileUi() {
    if (!isProfileRoute()) return;
    ensurePdfPrintStyles();
    normalizeActionLabels();
    ensureSeparateSaveUpdateButtons();
    syncMobileActionsPlacement();
    syncCoverVariantList();
    preparePrintImages();
  }

  document.addEventListener("click", (event) => {
    if (!isProfileRoute()) return;
    const { trigger, label } = getButtonLabel(event.target);
    if (!trigger || !trigger.closest(ACTIONS_SELECTOR)) return;

    if (trigger.dataset.profileSaveNew === "true") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      saveCurrentAsNew();
      return;
    }

    if (label.includes("Скачать")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      startPdfPrint();
      return;
    }

    if (label.includes("Печать") || label.includes("Распечатать")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      startPdfPrint();
    }
  }, true);

  window.addEventListener("beforeprint", () => {
    preparePrintImages();
    document.body.classList.add(PDF_PRINT_CLASS);
  });
  window.addEventListener("afterprint", cleanupPrintModeSoon);
  window.addEventListener("resize", syncMobileActionsPlacement);

  const observer = new MutationObserver(() => enhanceProfileUi());

  function boot() {
    ensureSourceDropdownAssets();
    enhanceProfileUi();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
