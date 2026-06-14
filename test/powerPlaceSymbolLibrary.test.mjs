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

for (const background of POWER_PLACE_BACKGROUND_LIBRARY) {
  assert.equal(background.kind, "power-place-background", `${background.id} must use background kind`);
  assert.match(background.src, /^\/symbols\/power-place\/[^/]+\/backgrounds\/[^/]+\.(svg|png|jpe?g|webp)$/, `${background.id} must use a durable public background image path`);
  assert.equal(background.displaySrc, background.src, `${background.id} display path must match src`);
  assert.match(background.meta, /^Фон · ДАО · reference$/, `${background.id} must keep DAO reference background meta`);
}
assert.equal(normalizePowerPlaceSymbolShelf("unknown"), "zodiac", "unknown shelf should normalize safely");
assert.equal(symbolShelfForConstructorType("unknown"), "zodiac", "unknown constructor type should fall back safely");
