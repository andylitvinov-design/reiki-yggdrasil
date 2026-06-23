(() => {
  const STYLE_ID = "profile-lite-layout-final-fix";
  const INNER_SELECTOR = [
    ".powerMandalaPanel > .power-place-chess",
    ".powerMandalaPanel > .powerMandala",
    ".powerMandalaPanel > .altarMandalaSheet",
    ".powerMandalaPanel > .businessMandalaSheet",
    ".powerMandalaPanel > .zodiacMandalaSheet",
    ".powerMandalaPanel > .starMandalaSheet",
    ".powerMandalaPanel > .daoMandalaSheet"
  ].join(",");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .profileLitePowerPlace .powerMandalaPanel,
      .powerPlacePdfOnlyArea .powerMandalaPanel {
        display: grid !important;
        place-items: center !important;
        justify-items: center !important;
        align-items: center !important;
        align-content: center !important;
      }
      .profileLitePowerPlace .powerPlaceExternalTitle,
      .powerPlacePdfOnlyArea .powerPlaceExternalTitle {
        order: -10 !important;
        align-self: end !important;
        margin: 0 auto 10px !important;
      }
      .profileLitePowerPlace .powerMandalaPanel > .powerPrintMeta,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .powerPrintMeta {
        display: none !important;
      }
      .profileLitePowerPlace .powerMandalaPanel.field-layout-square,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-square {
        aspect-ratio: 1 / 1 !important;
        width: min(620px, 100%) !important;
      }
      .profileLitePowerPlace .powerMandalaPanel.field-layout-vertical,
      .profileLitePowerPlace .powerMandalaPanel.field-layout-rectangle,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle {
        aspect-ratio: 9 / 16 !important;
        width: min(430px, 100%) !important;
        min-height: auto !important;
      }
      .profileLitePowerPlace .powerMandalaPanel.field-layout-horizontal,
      .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-horizontal {
        aspect-ratio: 16 / 9 !important;
        width: min(760px, 100%) !important;
        min-height: auto !important;
      }
      .profileLitePowerPlace .powerMandalaPanel > .power-place-chess,
      .profileLitePowerPlace .powerMandalaPanel > .powerMandala,
      .profileLitePowerPlace .powerMandalaPanel > .altarMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel > .businessMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel > .zodiacMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel > .starMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel > .daoMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .power-place-chess,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .powerMandala,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .altarMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .businessMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .zodiacMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .starMandalaSheet,
      .powerPlacePdfOnlyArea .powerMandalaPanel > .daoMandalaSheet {
        justify-self: center !important;
        align-self: center !important;
        overflow: visible !important;
        max-width: var(--profile-lite-inner-field-scale, 78%) !important;
        width: var(--profile-lite-inner-field-scale, 78%) !important;
      }
      @media (max-width: 640px) {
        .profileLitePowerPlace .powerMandalaPanel,
        .powerPlacePdfOnlyArea .powerMandalaPanel {
          overflow: hidden !important;
        }
        .profileLitePowerPlace .zodiacPositionImage,
        .profileLitePowerPlace .zodiacFieldPlusPositionImage {
          width: min(94px, 100%) !important;
        }
        .profileLitePowerPlace .daoElementImage {
          width: min(96px, 100%) !important;
        }
      }
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .power-place-chess,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .powerMandala,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .altarMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .businessMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .zodiacMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .starMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-circle > .daoMandalaSheet {
        border-radius: 50% !important;
      }
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .power-place-chess,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .powerMandala,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .altarMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .businessMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .zodiacMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .starMandalaSheet,
      .profileLitePowerPlace .powerMandalaPanel.center-shape-square > .daoMandalaSheet {
        border-radius: 24px !important;
      }
      @media print {
        .coverOffsetOverlay,
        .innerFieldScaleControl,
        .centerShapeControl {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function preferClientCabinetRoute() {
    if (window.location.pathname !== "/profile" && window.location.pathname !== "/profile-lite") return;
    if (window.location.search || window.location.hash) return;
    window.history.replaceState({}, "", "/profile/orders");
    window.dispatchEvent(new Event("reiki-route-change"));
  }

  function parseObjectRefs() {
    const textarea = document.querySelector('.profileLiteAdvancedJson textarea');
    if (!textarea) return {};
    try {
      return JSON.parse(textarea.value || '{}') || {};
    } catch {
      return {};
    }
  }

  function updateObjectRefs(patch) {
    const textarea = document.querySelector('.profileLiteAdvancedJson textarea');
    if (!textarea) return false;
    const next = { ...parseObjectRefs(), ...patch };
    const value = JSON.stringify(next, null, 2);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(textarea, value);
    else textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function mergeReportAndAnalysis() {
    const root = document.querySelector('.profileLitePowerPlace');
    if (!root) return;
    const report = root.querySelector('.reportSettingsPanel');
    const analysis = root.querySelector('.resourceComparisonPanel');
    if (!report || !analysis || analysis.closest('.reportSettingsPanel')) return;
    report.classList.add('isMergedReportAnalysis');
    const reportTitle = report.querySelector(':scope > .cabinetEyebrow');
    const analysisTitle = analysis.querySelector(':scope > .cabinetEyebrow');
    if (reportTitle) reportTitle.textContent = 'Отчёт и анализ';
    if (analysisTitle) analysisTitle.textContent = 'Ресурс';
    analysis.classList.add('mergedResourceComparison');
    report.appendChild(analysis);
  }

  function isolatedDaoGeometry(sheet) {
    if (!sheet?.classList?.contains('daoMandalaSheet')) return null;
    if (sheet.classList.contains('dao-shared-stage')) {
      return { width: 'auto', maxWidth: '92%' };
    }
    const isMobile = window.innerWidth <= 640;
    if (sheet.classList.contains('dao-talisman')) {
      const width = isMobile ? 'min(190px, 64%)' : 'min(336px, 82%)';
      return { width, maxWidth: width };
    }
    if (sheet.classList.contains('dao-talisman-2')) {
      const width = isMobile ? 'min(190px, 64%)' : 'min(292px, 78%)';
      return { width, maxWidth: width };
    }
    if (
      sheet.classList.contains('dao-fu-paper-slip') ||
      sheet.classList.contains('dao-cloud-register') ||
      sheet.classList.contains('dao-thunder-tablet') ||
      sheet.classList.contains('dao-taofu-charm')
    ) {
      const width = isMobile ? 'min(220px, 58vw)' : 'min(248px, 60%)';
      return { width, maxWidth: width };
    }
    return null;
  }

  function applyState() {
    injectStyle();
    mergeReportAndAnalysis();
    const refs = parseObjectRefs();
    const scaleRaw = Number(refs.__inner_field_scale);
    const scale = Number.isFinite(scaleRaw) ? Math.min(230, Math.max(48, scaleRaw)) : 78;
    const shape = refs.__center_shape === 'circle' ? 'circle' : 'square';

    document.querySelectorAll('.profileLitePowerPlace .powerMandalaPanel, .powerPlacePdfOnlyArea .powerMandalaPanel').forEach((panel) => {
      panel.style.setProperty('--profile-lite-inner-field-scale', `${scale}%`);
      panel.style.setProperty('overflow', 'hidden', 'important');
      panel.classList.toggle('center-shape-circle', shape === 'circle');
      panel.classList.toggle('center-shape-square', shape !== 'circle');
      panel.querySelectorAll(INNER_SELECTOR).forEach((inner) => {
        const daoGeometry = isolatedDaoGeometry(inner);
        inner.style.setProperty('overflow', 'visible', 'important');
        inner.style.setProperty('width', daoGeometry?.width || `${scale}%`, 'important');
        inner.style.setProperty('max-width', daoGeometry?.maxWidth || `${scale}%`, 'important');
      });
    });

    document.querySelectorAll('.innerFieldScaleControl input[type="range"]').forEach((input) => {
      input.max = '230';
      if (Number(input.value) !== scale) input.value = String(scale);
    });
  }

  function wireControls() {
    document.addEventListener('input', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (!input.closest('.innerFieldScaleControl')) return;
      const scale = Math.min(230, Math.max(48, Number(input.value) || 78));
      updateObjectRefs({ __inner_field_scale: String(scale) });
      requestAnimationFrame(applyState);
    }, true);

    document.addEventListener('click', (event) => {
      const button = event.target?.closest?.('.centerShapeControl button');
      if (!button) return;
      const shape = button.getAttribute('aria-label')?.includes('круг') ? 'circle' : 'square';
      updateObjectRefs({ __center_shape: shape });
      requestAnimationFrame(applyState);
    }, true);
  }

  function start() {
    preferClientCabinetRoute();
    injectStyle();
    wireControls();
    applyState();
    const observer = new MutationObserver(() => applyState());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('beforeprint', applyState);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
