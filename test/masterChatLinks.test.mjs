import assert from "node:assert/strict";

const MODULE_PATH = new URL("../src/lib/masterChatLinks.js", import.meta.url).href;
let mod;

try {
  mod = await import(MODULE_PATH);
} catch (error) {
  console.error("Failed to import masterChatLinks.js:", error.message);
  process.exit(1);
}

const {
  getMasterPagePath,
  getMasterPageUrl,
  getServicePath,
  getServiceUrl,
  getMasterPageInsertText,
  getServiceInsertText,
  filterPublishedServices
} = mod;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`  ✗ ${name}: ${error.message}`);
    failed++;
  }
}

console.log("masterChatLinks — path helpers");

test("getMasterPagePath returns /masters/:id", () => {
  assert.equal(getMasterPagePath("abc-123"), "/masters/abc-123");
});

test("getMasterPagePath encodes special characters", () => {
  assert.equal(getMasterPagePath("id with space"), "/masters/id%20with%20space");
});

test("getMasterPagePath returns null for empty input", () => {
  assert.equal(getMasterPagePath(""), null);
  assert.equal(getMasterPagePath(null), null);
  assert.equal(getMasterPagePath(undefined), null);
});

test("getServicePath returns /services/:id", () => {
  assert.equal(getServicePath("svc-456"), "/services/svc-456");
});

test("getServicePath returns null for empty input", () => {
  assert.equal(getServicePath(""), null);
  assert.equal(getServicePath(null), null);
});

console.log("masterChatLinks — URL generation");

test("getMasterPageUrl returns path-only when origin empty", () => {
  const url = getMasterPageUrl("p1", "");
  assert.equal(url, "/masters/p1");
});

test("getMasterPageUrl prepends safe https origin", () => {
  const url = getMasterPageUrl("p1", "https://mentalica.vercel.app");
  assert.equal(url, "https://mentalica.vercel.app/masters/p1");
});

test("getMasterPageUrl rejects storage:// origin", () => {
  const url = getMasterPageUrl("p1", "storage://profile-cabinet-media");
  assert.equal(url, "/masters/p1");
});

test("getMasterPageUrl rejects data: origin", () => {
  const url = getMasterPageUrl("p1", "data:image/png;base64,abc");
  assert.equal(url, "/masters/p1");
});

test("getServiceUrl returns path-only when origin empty", () => {
  const url = getServiceUrl("s1", "");
  assert.equal(url, "/services/s1");
});

test("getServiceUrl prepends safe https origin", () => {
  const url = getServiceUrl("s1", "https://mentalica.vercel.app");
  assert.equal(url, "https://mentalica.vercel.app/services/s1");
});

console.log("masterChatLinks — insert text");

test("getMasterPageInsertText returns URL string", () => {
  const text = getMasterPageInsertText("p1");
  assert.ok(text.includes("/masters/p1"), `Expected /masters/p1 in '${text}'`);
  assert.ok(!text.includes("storage://"), "Must not contain storage://");
  assert.ok(!text.includes("Bearer"), "Must not contain Bearer");
});

test("getMasterPageInsertText returns empty string for missing profileId", () => {
  assert.equal(getMasterPageInsertText(""), "");
  assert.equal(getMasterPageInsertText(null), "");
});

test("getServiceInsertText returns title and /services/:id", () => {
  const text = getServiceInsertText({ id: "svc-1", title: "Зодиак", status: "published" });
  assert.ok(text.includes("/services/svc-1"), `Expected /services/svc-1 in '${text}'`);
  assert.ok(text.includes("Зодиак"), "Expected service title");
  assert.ok(!text.includes("storage://"), "Must not contain storage://");
  assert.ok(!text.includes("image_bucket"), "Must not contain image_bucket");
  assert.ok(!text.includes("image_path"), "Must not contain image_path");
});

test("getServiceInsertText returns empty string for missing id", () => {
  assert.equal(getServiceInsertText({}), "");
  assert.equal(getServiceInsertText(null), "");
});

console.log("masterChatLinks — filterPublishedServices");

test("filterPublishedServices returns only published", () => {
  const services = [
    { id: "1", status: "published" },
    { id: "2", status: "draft" },
    { id: "3", status: "archived" },
    { id: "4", status: "published" }
  ];
  const result = filterPublishedServices(services);
  assert.equal(result.length, 2);
  assert.ok(result.every((s) => s.status === "published"));
});

test("filterPublishedServices handles empty and non-array", () => {
  assert.deepEqual(filterPublishedServices([]), []);
  assert.deepEqual(filterPublishedServices(null), []);
  assert.deepEqual(filterPublishedServices(undefined), []);
});

console.log(`\nmasterChatLinks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
