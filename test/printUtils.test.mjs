import assert from "node:assert/strict";
import { extractCssUrls } from "../src/lib/printUtils.js";

function makeEl(style = "", computedBg = "none", cssVars = {}, children = []) {
  return {
    nodeType: 1,
    getAttribute: (attr) => (attr === "style" ? style : ""),
    children,
    _cs: { backgroundImage: computedBg, getPropertyValue: (prop) => cssVars[prop] ?? "" },
  };
}

const gcs = (node) => node._cs ?? { backgroundImage: "none", getPropertyValue: () => "" };

// background-image url() in style attribute
{
  const el = makeEl('background-image: url("/img/bg.jpg")', "none", {});
  assert.ok(extractCssUrls(el, gcs).includes("/img/bg.jpg"), "url() in style attribute");
  console.log("PASS: background-image url() in style attribute");
}

// multiple url() in style attribute
{
  const el = makeEl('background: url("/a.png") url("/b.png")', "none", {});
  const urls = extractCssUrls(el, gcs);
  assert.ok(urls.includes("/a.png") && urls.includes("/b.png"), "multiple url()");
  console.log("PASS: multiple url() in style attribute");
}

// --power-inner-cover-image CSS variable
{
  const el = makeEl("", "none", { "--power-inner-cover-image": 'url("/inner.jpg")' });
  assert.ok(extractCssUrls(el, gcs).includes("/inner.jpg"), "--power-inner-cover-image");
  console.log("PASS: --power-inner-cover-image CSS variable");
}

// --power-outer-cover-image CSS variable
{
  const el = makeEl("", "none", { "--power-outer-cover-image": 'url("/outer.jpg")' });
  assert.ok(extractCssUrls(el, gcs).includes("/outer.jpg"), "--power-outer-cover-image");
  console.log("PASS: --power-outer-cover-image CSS variable");
}

// computedStyle.backgroundImage
{
  const el = makeEl("", 'url("/computed.jpg")', {});
  assert.ok(extractCssUrls(el, gcs).includes("/computed.jpg"), "computedStyle.backgroundImage");
  console.log("PASS: computedStyle.backgroundImage");
}

// data: URLs excluded
{
  const el = makeEl('background-image: url("data:image/png;base64,abc")', "none", {});
  assert.equal(extractCssUrls(el, gcs).length, 0, "data: excluded");
  console.log("PASS: data: URLs excluded");
}

// child elements walked
{
  const child = makeEl('background-image: url("/child.jpg")', "none", {});
  const el = makeEl("", "none", {}, [child]);
  assert.ok(extractCssUrls(el, gcs).includes("/child.jpg"), "child walk");
  console.log("PASS: child elements walked");
}

// deduplication
{
  const el = makeEl('background-image: url("/dup.jpg")', 'url("/dup.jpg")', {});
  assert.equal(extractCssUrls(el, gcs).filter((u) => u === "/dup.jpg").length, 1, "dedup");
  console.log("PASS: deduplication");
}

// does not throw when getComputedStyle throws
{
  const throwing = () => { throw new Error("permission denied"); };
  const el = makeEl('background-image: url("/safe.jpg")', "none", {});
  let result;
  assert.doesNotThrow(() => { result = extractCssUrls(el, throwing); }, "must not throw when gcs throws");
  assert.ok(Array.isArray(result), "must still return an array when gcs throws");
  console.log("PASS: does not throw when getComputedStyle throws");
}

console.log("\nAll printUtils tests passed.");
