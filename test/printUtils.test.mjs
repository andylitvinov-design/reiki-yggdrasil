import assert from "node:assert/strict";
import { extractCssUrls } from "../src/lib/printUtils.js";

function makeEl(style = "", computedBg = "none", cssVars = {}, children = []) {
  return {
    nodeType: 1,
    getAttribute: (attr) => (attr === "style" ? style : ""),
    children,
    _cs: {
      backgroundImage: computedBg,
      getPropertyValue: (prop) => cssVars[prop] ?? "",
    },
  };
}

function gcs(node) {
  return node._cs ?? { backgroundImage: "none", getPropertyValue: () => "" };
}

// --- background-image url(...) in style attribute ---
{
  const el = makeEl('background-image: url("/img/bg.jpg")', "none", {});
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/img/bg.jpg"), "finds url() in style attribute");
  console.log("PASS: background-image url() in style attribute");
}

// --- multiple url(...) in style attribute ---
{
  const el = makeEl(
    'background: url("/a.png") url("/b.png")',
    "none",
    {}
  );
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/a.png"), "finds first url");
  assert.ok(urls.includes("/b.png"), "finds second url");
  console.log("PASS: multiple url() in style attribute");
}

// --- --power-inner-cover-image CSS variable ---
{
  const el = makeEl("", "none", {
    "--power-inner-cover-image": 'url("/inner.jpg")',
  });
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/inner.jpg"), "finds --power-inner-cover-image");
  console.log("PASS: --power-inner-cover-image CSS variable");
}

// --- --power-outer-cover-image CSS variable ---
{
  const el = makeEl("", "none", {
    "--power-outer-cover-image": 'url("/outer.jpg")',
  });
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/outer.jpg"), "finds --power-outer-cover-image");
  console.log("PASS: --power-outer-cover-image CSS variable");
}

// --- computedStyle.backgroundImage ---
{
  const el = makeEl("", 'url("/computed.jpg")', {});
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/computed.jpg"), "finds computedStyle.backgroundImage");
  console.log("PASS: computedStyle.backgroundImage");
}

// --- data: URLs are excluded ---
{
  const el = makeEl('background-image: url("data:image/png;base64,abc")', "none", {});
  const urls = extractCssUrls(el, gcs);
  assert.equal(urls.length, 0, "excludes data: URLs");
  console.log("PASS: data: URLs excluded");
}

// --- child elements are walked ---
{
  const child = makeEl('background-image: url("/child.jpg")', "none", {});
  const el = makeEl("", "none", {}, [child]);
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/child.jpg"), "finds url in child element");
  console.log("PASS: child elements walked");
}

// --- deduplication ---
{
  const el = makeEl(
    'background-image: url("/dup.jpg")',
    'url("/dup.jpg")',
    {}
  );
  const urls = extractCssUrls(el, gcs);
  assert.equal(urls.filter((u) => u === "/dup.jpg").length, 1, "deduplicates urls");
  console.log("PASS: deduplication");
}

console.log("\nAll printUtils tests passed.");
