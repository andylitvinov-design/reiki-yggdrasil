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
        max-width: min(440px, var(--profile-lite-inner-field-scale, 78%)) !important;
        width: min(440px, var(--profile-lite-inner-field-scale, 78%)) !important;
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

  function preferMandalasRoute() {
    const search = new URLSearchParams(window.location.search);
    const tab = search.get("tab");
    if (window.location.pathname !== "/profile" && window.location.pathname !== "/profile-lite") return;
    if (tab && tab !== "overview") return;
    window.history.replaceState({}, "", "/profile/mandalas");
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

  function clampCoverOffset(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 50;
    return Math.min(80, Math.max(20, next));
  }

  function nudgeInnerCover(dx, dy) {
    const refs = parseObjectRefs();
    const x = clampCoverOffset(refs.__inner_cover_offset_x);
    const y = clampCoverOffset(refs.__inner_cover_offset_y);
    return updateObjectRefs({
      __inner_cover_offset_x: String(clampCoverOffset(x + dx)),
      __inner_cover_offset_y: String(clampCoverOffset(y + dy))
    });
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

  function tuneInnerCoverArrows() {
    const group = document.querySelector('.profileLitePowerPlace .coverOffsetCornerGroup.inner');
    if (!group || group.dataset.diagonalOnly === 'true') return;
    const buttons = Array.from(group.querySelectorAll('button'));
    if (buttons.length < 4) return;
    const arrows = [
      { text: '↖', label: 'Сдвинуть внутренний фон вверх и влево', dx: -5, dy: -5 },
      { text: '↗', label: 'Сдвинуть внутренний фон вверх и вправо', dx: 5, dy: -5 },
      { text: '↙', label: 'Сдвинуть внутренний фон вниз и влево', dx: -5, dy: 5 },
      { text: '↘', label: 'Сдвинуть внутренний фон вниз и вправо', dx: 5, dy: 5 }
    ];
    group.dataset.diagonalOnly = 'true';
    buttons.slice(0, 4).forEach((button, index) => {
      const arrow = arrows[index];
      button.textContent = arrow.text;
      button.setAttribute('aria-label', arrow.label);
      button.setAttribute('title', arrow.label);
      button.addEventListener('click', (event) => {
        if (!nudgeInnerCover(arrow.dx, arrow.dy)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        requestAnimationFrame(applyState);
      }, true);
    });
  }

  function applyState() {
    injectStyle();
    mergeReportAndAnalysis();
    tuneInnerCoverArrows();
    const refs = parseObjectRefs();
    const scaleRaw = Number(refs.__inner_field_scale);
    const scale = Number.isFinite(scaleRaw) ? Math.min(100, Math.max(48, scaleRaw)) : 78;
    const shape = refs.__center_shape === 'circle' ? 'circle' : 'square';

    document.querySelectorAll('.profileLitePowerPlace .powerMandalaPanel, .powerPlacePdfOnlyArea .powerMandalaPanel').forEach((panel) => {
      panel.style.setProperty('--profile-lite-inner-field-scale', `${scale}%`);
      panel.classList.toggle('center-shape-circle', shape === 'circle');
      panel.classList.toggle('center-shape-square', shape !== 'circle');
      panel.querySelectorAll(INNER_SELECTOR).forEach((inner) => {
        inner.style.setProperty('overflow', 'visible', 'important');
      });
    });

    document.querySelectorAll('.innerFieldScaleControl input[type="range"]').forEach((input) => {
      input.max = '100';
      if (Number(input.value) !== scale) input.value = String(scale);
    });
  }

  function wireControls() {
    document.addEventListener('input', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (!input.closest('.innerFieldScaleControl')) return;
      const scale = Math.min(100, Math.max(48, Number(input.value) || 78));
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
    preferMandalasRoute();
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
