import assert from "node:assert/strict";

import {
  PROFILE_AUDIO_MAX_BYTES,
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_MAX_BYTES,
  buildCourseAudioPath,
  buildProfileMediaPath,
  encodeStorageObjectPath,
  hydrateMediaRowsForDisplay,
  isStorageRef,
  normalizeSignedStorageUrl,
  parseStorageRef,
  resolveLessonAudioDisplayUrl,
  sanitizeMediaFilename,
  toStorageRef,
  validateProfileAudioFile,
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
assert.match(
  buildProfileMediaPath({ name: "free meditations 01.jpg", type: "image/jpeg", size: 1024 }, { profileId: "profile-1", kind: "client-goal" }, "uuid-6"),
  /^profile-1\/client-goal\/uuid-6-free-meditations-01\.jpg$/,
  "profile media path should start with profile id and sanitize filename"
);
assert.doesNotMatch(
  buildProfileMediaPath({ name: "../IMG 1678 ?.jpg", type: "image/jpeg", size: 1024 }, { profileId: "profile-1", kind: "client-goal" }, "uuid-7"),
  /[ ?\\]|\.{2}/,
  "profile media path should not contain unsafe path characters"
);
assert.equal(
  encodeStorageObjectPath("profile 1/client goal/фото 01.jpg"),
  "profile%201/client%20goal/%D1%84%D0%BE%D1%82%D0%BE%2001.jpg",
  "storage sign/upload paths should encode URL segments without encoding slashes"
);

const supabaseUrl = "https://project.supabase.co";
assert.equal(
  normalizeSignedStorageUrl("/object/sign/profile-cabinet-media/profile-1/photo.png?token=abc", supabaseUrl),
  "https://project.supabase.co/storage/v1/object/sign/profile-cabinet-media/profile-1/photo.png?token=abc"
);
assert.equal(
  normalizeSignedStorageUrl("/storage/v1/object/sign/profile-cabinet-media/profile-1/photo.png?token=abc", supabaseUrl),
  "https://project.supabase.co/storage/v1/object/sign/profile-cabinet-media/profile-1/photo.png?token=abc"
);
assert.equal(
  normalizeSignedStorageUrl("https://cdn.example.com/signed/photo.png?token=abc", supabaseUrl),
  "https://cdn.example.com/signed/photo.png?token=abc"
);
assert.equal(
  normalizeSignedStorageUrl("object/sign/profile-cabinet-media/profile-1/photo.png?token=abc", supabaseUrl),
  "https://project.supabase.co/storage/v1/object/sign/profile-cabinet-media/profile-1/photo.png?token=abc"
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

assert.doesNotThrow(() => validateProfileAudioFile({ name: "lesson.mp3", type: "audio/mpeg", size: 20 * 1024 * 1024 }));
assert.throws(
  () => validateProfileAudioFile({ name: "lesson.exe", type: "application/octet-stream", size: 100 }),
  /Недопустимый тип аудио/
);
assert.throws(
  () => validateProfileAudioFile({ name: "lesson.mp3", type: "audio/mpeg", size: PROFILE_AUDIO_MAX_BYTES + 1 }),
  /Максимальный размер аудио — 100 MB/
);
assert.equal(
  buildCourseAudioPath({ name: "Градус 1 Intro.MP3", type: "audio/mpeg", size: 1000 }, {
    courseSlug: "magic money!",
    stepSlug: "degree 1",
    lessonId: "lesson-1"
  }, "uuid-audio"),
  "courses/magic-money/degree-1/lesson-1/uuid-audio-1-intro.mp3"
);

const ref = toStorageRef(PROFILE_MEDIA_BUCKET, "profile-1/client-goal/uuid-1-goal-01.png");
assert.equal(ref, "storage://profile-cabinet-media/profile-1/client-goal/uuid-1-goal-01.png");
assert.equal(isStorageRef(ref), true);
assert.equal(isStorageRef("storage://other-bucket/path.mp3"), true);
assert.deepEqual(parseStorageRef(ref), {
  bucket: PROFILE_MEDIA_BUCKET,
  path: "profile-1/client-goal/uuid-1-goal-01.png"
});
assert.equal(parseStorageRef("https://example.com/image.png"), null);

const hydratedRows = await hydrateMediaRowsForDisplay([{
  id: "photo-1",
  image_url: "",
  image_bucket: PROFILE_MEDIA_BUCKET,
  image_path: "profile-1/client-goal/uuid-1-goal-01.png"
}], {
  access_token: "session-token"
}, async (path, session, bucket) => {
  assert.equal(path, "profile-1/client-goal/uuid-1-goal-01.png");
  assert.equal(session.access_token, "session-token");
  assert.equal(bucket, PROFILE_MEDIA_BUCKET);
  return "https://signed.example/image.png";
});

assert.equal(hydratedRows[0].image_ref, ref);
assert.equal(hydratedRows[0].signed_url, "https://signed.example/image.png");
assert.equal(hydratedRows[0].display_url, "https://signed.example/image.png");

const failedHydrationRows = await hydrateMediaRowsForDisplay([{
  id: "photo-2",
  image_url: "",
  image_bucket: PROFILE_MEDIA_BUCKET,
  image_path: "profile-1/client-goal/broken.png"
}], {
  access_token: "session-token"
}, async () => {
  throw new Error("403 RLS denied");
});

assert.equal(failedHydrationRows[0].image_ref, "storage://profile-cabinet-media/profile-1/client-goal/broken.png");
assert.equal(failedHydrationRows[0].display_url, "");
assert.equal(failedHydrationRows[0].media_signing_status, "error");
assert.match(failedHydrationRows[0].media_signing_error, /signed URL не создан/);

const externalRows = await hydrateMediaRowsForDisplay([{
  id: "photo-3",
  image_url: "https://example.com/old.jpg",
  image_bucket: PROFILE_MEDIA_BUCKET,
  image_path: ""
}], { access_token: "session-token" });

assert.equal(externalRows[0].image_ref, "https://example.com/old.jpg");
assert.equal(externalRows[0].display_url, "https://example.com/old.jpg");

const externalAudio = await resolveLessonAudioDisplayUrl({ audio_url: "https://cdn.example.com/lesson.mp3" }, {});
assert.equal(externalAudio.audioUrl, "https://cdn.example.com/lesson.mp3");
assert.equal(externalAudio.status, "external");

const signedAudio = await resolveLessonAudioDisplayUrl({
  audio_url: "storage://profile-cabinet-media/courses/magic-money/degree-1/lesson-1/audio.mp3"
}, { access_token: "session-token" }, async (refOrPath, session) => {
  assert.equal(refOrPath, "storage://profile-cabinet-media/courses/magic-money/degree-1/lesson-1/audio.mp3");
  assert.equal(session.access_token, "session-token");
  return "https://signed.example/audio.mp3";
});
assert.equal(signedAudio.audioUrl, "https://signed.example/audio.mp3");
assert.equal(signedAudio.status, "signed");

const failedAudio = await resolveLessonAudioDisplayUrl({
  audio_storage_bucket: PROFILE_MEDIA_BUCKET,
  audio_storage_path: "courses/magic-money/degree-1/lesson-1/audio.mp3"
}, { access_token: "session-token" }, async () => {
  throw new Error("403");
});
assert.equal(failedAudio.audioUrl, "");
assert.equal(failedAudio.status, "error");
assert.match(failedAudio.error, /signed URL не создан/);

console.log("profileMediaClient tests passed");
