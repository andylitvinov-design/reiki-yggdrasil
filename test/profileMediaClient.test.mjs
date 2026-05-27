import assert from "node:assert/strict";

import {
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_MAX_BYTES,
  buildProfileMediaPath,
  isStorageRef,
  parseStorageRef,
  sanitizeMediaFilename,
  toStorageRef,
  validateProfileMediaFile
} from "../src/lib/profileMediaClient.js";

const imageFile = {
  name: " Клиент / Goal 01.PNG ",
  type: "image/png",
  size: 1024
};

assert.equal(sanitizeMediaFilename(" Клиент / Goal 01.PNG "), "goal-01.png");
assert.equal(sanitizeMediaFilename("../My Fancy Photo.webp"), "my-fancy-photo.webp");
assert.equal(sanitizeMediaFilename("###"), "image");

assert.equal(
  buildProfileMediaPath(imageFile, { profileId: "profile-1", kind: "client-goal" }, "uuid-1"),
  "profile-1/client-goal/uuid-1-goal-01.png"
);

assert.equal(
  buildProfileMediaPath(imageFile, { profileId: "profile-1", kind: "tradition", traditionId: "Greek Mysteries" }, "uuid-2"),
  "profile-1/traditions/greek-mysteries/uuid-2-goal-01.png"
);

assert.equal(
  buildProfileMediaPath(imageFile, { profileId: "profile-1", kind: "power-place", compositionId: "composition-1", slotId: "dao-water" }, "uuid-3"),
  "profile-1/power-place/composition-1/dao-water-uuid-3-goal-01.png"
);

assert.equal(
  buildProfileMediaPath(imageFile, { profileId: "profile-1", kind: "material" }, "uuid-4"),
  "profile-1/materials/uuid-4-goal-01.png"
);

assert.equal(
  buildProfileMediaPath(imageFile, { profileId: "profile-1", kind: "underlay" }, "uuid-5"),
  "profile-1/underlays/uuid-5-goal-01.png"
);

assert.doesNotThrow(() => validateProfileMediaFile(imageFile));
assert.throws(
  () => validateProfileMediaFile({ name: "x.svg", type: "image/svg+xml", size: 100 }),
  /Недопустимый тип/
);
assert.throws(
  () => validateProfileMediaFile({ name: "x.png", type: "image/png", size: PROFILE_MEDIA_MAX_BYTES + 1 }),
  /Файл слишком большой/
);

const ref = toStorageRef(PROFILE_MEDIA_BUCKET, "profile-1/client-goal/uuid-1-goal-01.png");
assert.equal(ref, "storage://profile-cabinet-media/profile-1/client-goal/uuid-1-goal-01.png");
assert.equal(isStorageRef(ref), true);
assert.deepEqual(parseStorageRef(ref), {
  bucket: PROFILE_MEDIA_BUCKET,
  path: "profile-1/client-goal/uuid-1-goal-01.png"
});
assert.equal(parseStorageRef("https://example.com/image.png"), null);
