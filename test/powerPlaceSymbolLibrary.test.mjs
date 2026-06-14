import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  POWER_PLACE_BACKGROUND_LIBRARY,
  POWER_PLACE_SYMBOL_LIBRARY,
  POWER_PLACE_SYMBOL_SHELF_ORDER,
  POWER_PLACE_SYMBOL_SHELVES,
  listPowerPlaceBackgroundsByShelf,
  listPowerPlaceSymbolsByShelf,
  normalizePowerPlaceSymbolShelf,
  symbolShelfForConstructorType
} from "../src/data/powerPlaceSymbolLibrary.js";

assert.deepEqual(
  POWER_PLACE_SYMBOL_SHELF_ORDER,
  ["zodiac", "star", "chess", "client", "altar", "business", "dao"],
  "symbol shelf order must match Power Place constructor formats"
);

assert.equal(POWER_PLACE_SYMBOL_SHELVES.length, POWER_PLACE_SYMBOL_SHELF_ORDER.length, "every shelf should have metadata");

for (const shelf of POWER_PLACE_SYMBOL_SHELF_ORDER) {
  const shelfSymbols = listPowerPlaceSymbolsByShelf(shelf);
  assert.ok(shelfSymbols.length >= 2, `${shelf} shelf should include at least two draft symbols`);
  assert.equal(symbolShelfForConstructorType(shelf), shelf, `${shelf} constructor type should map to its symbol shelf`);

  for (const symbol of shelfSymbols) {
    assert.equal(symbol.shelf, shelf, `${symbol.id} should stay on requested shelf`);
    assert.equal(symbol.kind, "symbol-library", `${symbol.id} must use stable kind`);
    assert.match(symbol.src, new RegExp(`^/symbols/power-place/${shelf}/[^/]+\\.svg$`), `${symbol.id} must use a public shelf SVG path`);
    assert.equal(symbol.displaySrc, symbol.src, `${symbol.id} preview path should match durable src`);
    assert.match(`${symbol.meta} ${symbol.label}`, /draft|needs review/i, `${symbol.id} must be marked draft / needs review`);
    assert.equal(existsSync(join(process.cwd(), "public", symbol.src.replace(/^\//, ""))), true, `${symbol.src} asset should exist`);
  }

  const shelfBackgrounds = listPowerPlaceBackgroundsByShelf(shelf);
  for (const background of shelfBackgrounds) {
    assert.equal(background.shelf, shelf, `${background.id} should stay on requested background shelf`);
    assert.equal(background.kind, "power-place-background", `${background.id} must use background drag kind`);
    assert.equal(background.displaySrc, background.src, `${background.id} preview path should match durable src`);
    assert.equal(existsSync(join(process.cwd(), "public", background.src.replace(/^\//, ""))), true, `${background.src} background asset should exist`);
  }
}

assert.equal(POWER_PLACE_SYMBOL_LIBRARY.length >= POWER_PLACE_SYMBOL_SHELF_ORDER.length * 2, true, "library should include minimum shelf coverage");
assert.equal(Array.isArray(POWER_PLACE_BACKGROUND_LIBRARY), true, "background library should export a stable array even when assets are not present");
assert.deepEqual(listPowerPlaceBackgroundsByShelf("unknown"), listPowerPlaceBackgroundsByShelf("zodiac"), "unknown background shelf should normalize safely");
assert.equal(listPowerPlaceBackgroundsByShelf("dao").length, 4, "DAO shelf should include exactly four reference background assets");
assert.deepEqual(listPowerPlaceBackgroundsByShelf("zodiac"), [], "non-DAO background shelves can remain empty until assets are verified");

const expectedDaoBackgrounds = [
  ["Фу-лист", "/symbols/power-place/dao/backgrounds/fu-paper-slip.svg"],
  ["Облачный реестр", "/symbols/power-place/dao/backgrounds/cloud-register.svg"],
  ["Громовая табличка", "/symbols/power-place/dao/backgrounds/thunder-tablet.svg"],
  ["Таофу", "/symbols/power-place/dao/backgrounds/taofu-charm.svg"]
];

for (const [label, src] of expectedDaoBackgrounds) {
  const background = listPowerPlaceBackgroundsByShelf("dao").find((item) => item.label === label);
  assert.ok(background, `${label} DAO background should exist`);
  assert.equal(background.src, src, `${label} should keep its durable public SVG path`);
  assert.equal(background.displaySrc, src, `${label} display path should match durable src`);
  assert.equal(background.fit, "contain", `${label} DAO reference background should opt into contain fit`);
  assert.equal(existsSync(join(process.cwd(), "public", src.replace(/^\//, ""))), true, `${src} asset should exist`);
}

for (const background of POWER_PLACE_BACKGROUND_LIBRARY) {
  assert.equal(background.kind, "power-place-background", `${background.id} must use background kind`);
  assert.match(background.src, /^\/symbols\/power-place\/[^/]+\/backgrounds\/[^/]+\.svg$/, `${background.id} must use a durable public SVG background path`);
  assert.equal(background.displaySrc, background.src, `${background.id} display path must match src`);
  assert.match(background.meta, /^Фон · ДАО · reference$/, `${background.id} must keep DAO reference background meta`);
}
assert.equal(normalizePowerPlaceSymbolShelf("unknown"), "zodiac", "unknown shelf should normalize safely");
assert.equal(symbolShelfForConstructorType("unknown"), "zodiac", "unknown constructor type should fall back safely");
