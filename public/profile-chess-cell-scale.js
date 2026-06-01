(() => {
  const SCALES = [100, 90, 80, 70, 60];
  let activeScale = 100;

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

  function createButton(scale) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = scale + '%';
    button.className = scale === activeScale ? 'active' : '';
    button.addEventListener('click', () => applyScale(scale));
    return button;
  }

  function ensureControl() {
    const board = document.querySelector('.power-place-chess');
    if (!board) return;

    applyScale(activeScale);

    if (document.querySelector('.profileChessCellScaleControl')) return;

    const selectors = Array.from(document.querySelectorAll('.starVariantSelector'));
    const chessSelector = selectors.find((item) => item.textContent.includes('Формат шахмат'));
    if (!chessSelector) return;

    const control = document.createElement('div');
    control.className = 'profileChessCellScaleControl';
    control.setAttribute('aria-label', 'Размер шахматных ячеек');

    const label = document.createElement('span');
    label.textContent = 'Размер ячеек';
    control.appendChild(label);

    SCALES.forEach((scale) => control.appendChild(createButton(scale)));
    chessSelector.insertAdjacentElement('afterend', control);
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
