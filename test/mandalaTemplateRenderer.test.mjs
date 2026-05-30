import assert from "node:assert/strict";

import {
  DEFAULT_CENTER_SIZE_RATIO,
  calculateCenterPhotoBox,
  clampCenterSizeRatio
} from "../src/lib/mandalaTemplateRenderer.js";

assert.equal(clampCenterSizeRatio(), DEFAULT_CENTER_SIZE_RATIO);
assert.equal(clampCenterSizeRatio("bad"), DEFAULT_CENTER_SIZE_RATIO);
assert.equal(clampCenterSizeRatio(0.01), 0.12);
assert.equal(clampCenterSizeRatio(0.8), 0.5);
assert.equal(clampCenterSizeRatio(0.3), 0.3);

assert.deepEqual(calculateCenterPhotoBox(1000, 800, 0.25), {
  x: 400,
  y: 300,
  size: 200
});

assert.deepEqual(calculateCenterPhotoBox(900, 900, 0.28), {
  x: 324,
  y: 324,
  size: 252
});
