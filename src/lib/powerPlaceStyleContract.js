/**
 * Pure helpers used by ProfileLitePowerPlaceModule for dynamic CSS generation.
 * Exported here so unit tests can verify the style contract without importing JSX.
 */

export function innerFieldScaleValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 78;
  return Math.min(96, Math.max(48, parsed));
}

/**
 * Generates the CSS calc() expression that compensates for panel padding so that
 * `innerFieldScale`% means "that percentage of the full outer panel", not just
 * the content-box after padding.
 *
 * Panel padding is `clamp(34px, 8vw, 58px)` (desktop) or `clamp(28px, 9vw, 44px)` (mobile).
 * For a padding of P on each side:
 *   panelWidth = contentBox + 2P
 *   needed = scale% * panelWidth = scale% * contentBox + scale/100 * 2P
 *          = scale% + coeff * P          (coeff = scale/100 * 2)
 */
export function innerFieldWidthDesktop(innerFieldScale) {
  const coeff = (innerFieldScale / 100 * 2).toFixed(4);
  return `calc(${innerFieldScale}% + ${coeff} * clamp(34px, 8vw, 58px))`;
}

export function innerFieldWidthMobile(innerFieldScale) {
  const coeff = (innerFieldScale / 100 * 2).toFixed(4);
  return `calc(${innerFieldScale}% + ${coeff} * clamp(28px, 9vw, 44px))`;
}
