import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const EXPECTED_BASIC_STEP_IDS = [
  "RY-L01-S01",
  "RY-L01-S02",
  "RY-L01-S03",
  "RY-L01-S04",
  "RY-L01-S05"
];

const EXPECTED_VIDEO_COUNT_PER_STEP = 3;

const videosSourcePath = new URL("../src/data/reikiStepVideos.js", import.meta.url);
const videosSource = await readFile(videosSourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(videosSource).toString("base64")}`;
const { reikiStepVideos } = await import(moduleUrl);

const errors = [];
const warnings = [];

function isYoutubeUrl(value) {
  return typeof value === "string" && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(value);
}

for (const stepId of EXPECTED_BASIC_STEP_IDS) {
  const video = reikiStepVideos[stepId];

  if (!video) {
    errors.push(`${stepId} is missing a video slot.`);
    continue;
  }

  if (!video.title) errors.push(`${stepId} video slot is missing title.`);
  if (!video.sourcePage || !video.sourcePage.startsWith("https://reiki-yggdrasil.com/")) {
    errors.push(`${stepId} video slot must keep the verified reiki-yggdrasil.com sourcePage.`);
  }
  if (video.sourceStatus !== "source_verified") {
    errors.push(`${stepId} video slot must be marked source_verified after source extraction.`);
  }
  if (!isYoutubeUrl(video.primaryUrl)) {
    errors.push(`${stepId} primaryUrl must be a verified https YouTube/youtu.be URL, found: ${video.primaryUrl}`);
  }
  if (!Array.isArray(video.videos)) {
    errors.push(`${stepId} videos must be an array.`);
    continue;
  }
  if (video.videos.length !== EXPECTED_VIDEO_COUNT_PER_STEP) {
    errors.push(`${stepId} must have ${EXPECTED_VIDEO_COUNT_PER_STEP} video records, found ${video.videos.length}.`);
  }
  if (video.videos[0]?.url !== video.primaryUrl) {
    errors.push(`${stepId} primaryUrl must match the first video URL for embedded playback.`);
  }

  for (const [index, item] of video.videos.entries()) {
    if (!item.title) errors.push(`${stepId} video ${index + 1} is missing title.`);
    if (!item.label) errors.push(`${stepId} video ${index + 1} is missing label.`);
    if (!isYoutubeUrl(item.url)) {
      errors.push(`${stepId} video ${index + 1} URL must be a verified https YouTube/youtu.be URL, found: ${item.url}`);
    }
  }
}

const extraIds = Object.keys(reikiStepVideos).filter((stepId) => !EXPECTED_BASIC_STEP_IDS.includes(stepId));
if (extraIds.length > 0) {
  warnings.push(`Extra non-basic video slots found: ${extraIds.join(", ")}. Keep them only if source-verified.`);
}

if (warnings.length > 0) {
  console.warn("Reiki step video validation warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("Reiki step video validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Reiki step video slots OK: ${EXPECTED_BASIC_STEP_IDS.length} basic step slots, ${EXPECTED_BASIC_STEP_IDS.length * EXPECTED_VIDEO_COUNT_PER_STEP} verified YouTube links.`
);
