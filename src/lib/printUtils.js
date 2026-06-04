// Extracts all non-data image URLs from CSS backgrounds and CSS variables on el and its descendants.
export function extractCssUrls(el, _getComputedStyle) {
  const gcs = _getComputedStyle ?? (typeof getComputedStyle !== "undefined" ? getComputedStyle : () => ({}));
  const urls = new Set();
  const urlRe = /url\(\s*["']?([^"')]+)["']?\s*\)/g;

  function scanText(text) {
    urlRe.lastIndex = 0;
    let m;
    while ((m = urlRe.exec(text)) !== null) {
      const u = m[1].trim();
      if (u && !u.startsWith("data:")) urls.add(u);
    }
  }

  function walk(node) {
    if (!node || node.nodeType !== 1) return;
    const style = node.getAttribute ? (node.getAttribute("style") || "") : "";
    if (style) scanText(style);

    try {
      const cs = gcs(node);
      const bg = cs.backgroundImage;
      if (bg && bg !== "none") scanText(bg);
      const inner = cs.getPropertyValue ? cs.getPropertyValue("--power-inner-cover-image") : "";
      if (inner) scanText(inner);
      const outer = cs.getPropertyValue ? cs.getPropertyValue("--power-outer-cover-image") : "";
      if (outer) scanText(outer);
    } catch (_) {}

    const children = node.children || [];
    for (const child of children) walk(child);
  }

  walk(el);
  return [...urls];
}
