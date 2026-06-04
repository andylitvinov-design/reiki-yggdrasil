(() => {
  const STYLE_ID = 'profile-lite-print-single-page-fix';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
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
        width: var(--profile-lite-inner-field-scale, 78%) !important;
        max-width: var(--profile-lite-inner-field-scale, 78%) !important;
        overflow: visible !important;
        justify-self: center !important;
        align-self: center !important;
      }
      .profileLitePowerPlace .powerMandalaPanel,
      .powerPlacePdfOnlyArea .powerMandalaPanel {
        display: grid !important;
        place-items: center !important;
      }
      @media print {
        @page { margin: 0 !important; size: auto; }
        html,
        body,
        body.printMandalaOnly,
        body.printMandalaOnly main {
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: #fffaf0 !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea {
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 auto !important;
          padding: 0 !important;
          display: grid !important;
          justify-items: center !important;
          align-items: start !important;
          break-after: avoid !important;
          page-break-after: avoid !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          overflow: visible !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea > *:not(.powerPlaceExternalTitle):not(.powerMandalaPanel) {
          display: none !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea .powerPlaceExternalTitle {
          margin: 0 auto 4mm !important;
          padding: 0 !important;
          break-after: avoid !important;
          page-break-after: avoid !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea .powerMandalaPanel {
          width: min(92vw, 92vh) !important;
          max-width: 100% !important;
          max-height: 92vh !important;
          margin: 0 auto !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          break-after: avoid !important;
          page-break-after: avoid !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-vertical,
        body.printMandalaOnly .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-rectangle {
          width: min(92vw, 52vh) !important;
          aspect-ratio: 9 / 16 !important;
        }
        body.printMandalaOnly .powerPlacePdfOnlyArea .powerMandalaPanel.field-layout-horizontal {
          width: min(92vw, 92vh) !important;
          aspect-ratio: 16 / 9 !important;
        }
        .coverOffsetOverlay,
        .innerFieldScaleControl,
        .centerShapeControl,
        .profileLiteAdvancedJson,
        .powerPlaceActions,
        .powerPrintColorHint {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function applyScale() {
    injectStyle();
    const textarea = document.querySelector('.profileLiteAdvancedJson textarea');
    let scale = 78;
    if (textarea) {
      try {
        const refs = JSON.parse(textarea.value || '{}') || {};
        const raw = Number(refs.__inner_field_scale);
        if (Number.isFinite(raw)) scale = Math.min(100, Math.max(48, raw));
      } catch {}
    }
    document.querySelectorAll('.profileLitePowerPlace .powerMandalaPanel, .powerPlacePdfOnlyArea .powerMandalaPanel').forEach((panel) => {
      panel.style.setProperty('--profile-lite-inner-field-scale', `${scale}%`);
    });
    document.querySelectorAll('.innerFieldScaleControl input[type="range"]').forEach((input) => {
      input.max = '100';
    });
  }

  function start() {
    injectStyle();
    applyScale();
    new MutationObserver(applyScale).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    window.addEventListener('beforeprint', applyScale);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
