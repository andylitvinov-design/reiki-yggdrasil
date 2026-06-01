(() => {
  const SCALES = [100, 90, 80, 70, 60];
  const LAYOUTS = [
    { value: 'default', label: '8 ячеек' },
    { value: 'compact-5', label: '5 ячеек' }
  ];
  let activeScale = 100;
  let activeLayout = 'default';

  function applyScale(scale) {
    activeScale = scale;
    document.querySelectorAll('.power-place-chess').forEach((board) => {
      board.style.setProperty('--chess-cell-scale', scale + '%');
      board.style.setProperty('--chess-cell-scale-number', String(scale));
    });
    document.querySelectorAll('.profileChessCellScaleControl button').forEach((button) => {
      button.classList.toggle('active', button.textContent === scale + '%');
    });
  }

  function applyLayout(layout) {
    activeLayout = layout;
    document.querySelectorAll('.power-place-chess').forEach((board) => {
      board.classList.toggle('runtime-compact-5', layout === 'compact-5');
    });
    document.querySelectorAll('.profileChessVariantRuntimeControl button').forEach((button) => {
      button.classList.toggle('active', button.dataset.layout === layout);
    });
  }

  function createScaleButton(scale) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = scale + '%';
    button.className = scale === activeScale ? 'active' : '';
    button.addEventListener('click', () => applyScale(scale));
    return button;
  }

  function createLayoutButton(layout) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.layout = layout.value;
    button.textContent = layout.label;
    button.className = layout.value === activeLayout ? 'active' : '';
    button.addEventListener('click', () => applyLayout(layout.value));
    return button;
  }

  function buildLayoutControl() {
    const control = document.createElement('div');
    control.className = 'profileChessVariantRuntimeControl';
    control.setAttribute('aria-label', 'Дополнительный формат шахмат');

    const label = document.createElement('span');
    label.textContent = 'Доп. формат';
    control.appendChild(label);

    LAYOUTS.forEach((layout) => control.appendChild(createLayoutButton(layout)));
    return control;
  }

  function buildScaleControl() {
    const control = document.createElement('div');
    control.className = 'profileChessCellScaleControl';
    control.setAttribute('aria-label', 'Размер шахматных ячеек');

    const label = document.createElement('span');
    label.textContent = 'Размер ячеек';
    control.appendChild(label);

    SCALES.forEach((scale) => control.appendChild(createScaleButton(scale)));
    return control;
  }

  function ensureControl() {
    const board = document.querySelector('.power-place-chess');
    if (!board) return;

    applyScale(activeScale);
    applyLayout(activeLayout);

    const selectors = Array.from(document.querySelectorAll('.starVariantSelector'));
    const chessSelector = selectors.find((item) => item.textContent.includes('Формат шахмат'));
    if (!chessSelector) return;

    if (!document.querySelector('.profileChessVariantRuntimeControl')) {
      chessSelector.insertAdjacentElement('afterend', buildLayoutControl());
    }

    if (!document.querySelector('.profileChessCellScaleControl')) {
      const variantControl = document.querySelector('.profileChessVariantRuntimeControl') || chessSelector;
      variantControl.insertAdjacentElement('afterend', buildScaleControl());
    }
  }

  function boot() {
    ensureControl();
    const observer = new MutationObserver(ensureControl);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
