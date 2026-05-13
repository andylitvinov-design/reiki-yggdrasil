import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const MIN_EXPECTED_VIDEO_STEPS = 20;

const videosSourcePath = new URL("../src/data/reikiStepVideos.js", import.meta.url);
const videosSource = await readFile(videosSourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(videosSource).toString("base64")}`;
const { reikiStepVideos } = await import(moduleUrl);

const errors = [];
const warnings = [];

function isYoutubeUrl(value) {
  return typeof value === "string" && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(value);
}

const stepEntries = Object.entries(reikiStepVideos);

if (stepEntries.length < MIN_EXPECTED_VIDEO_STEPS) {
  errors.push(`Expected at least ${MIN_EXPECTED_VIDEO_STEPS} step video records, found ${stepEntries.length}.`);
}

for (const [stepId, video] of stepEntries) {
  if (!/^RY-L\d{2}-S\d{2}$/.test(stepId)) {
    errors.push(`${stepId} is not a stable Reiki step id.`);
  }

  if (!video) {
    errors.push(`${stepId} has empty video data.`);
    continue;
  }

  if (!video.title) errors.push(`${stepId} video slot is missing title.`);
  if (!video.sourcePage || !video.sourcePage.startsWith("https://reiki-yggdrasil.com/")) {
    errors.push(`${stepId} video slot must keep the verified reiki-yggdrasil.com sourcePage.`);
  }
  if (video.sourceStatus !== "source_verified") {
    errors.push(`${stepId} video slot must be marked source_verified after source extraction.`);
  }
  if (!Array.isArray(video.videos)) {
    errors.push(`${stepId} videos must be an array.`);
    continue;
  }
  if (video.videos.length === 0) {
    warnings.push(`${stepId} has a source-verified placeholder without extracted videos yet.`);
    continue;
  }
  if (!isYoutubeUrl(video.primaryUrl)) {
    errors.push(`${stepId} primaryUrl must be a verified https YouTube/youtu.be URL, found: ${video.primaryUrl}`);
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

if (warnings.length > 0) {
  console.warn("Reiki step video validation warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("Reiki step video validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const verifiedLinks = stepEntries.reduce((sum, [, video]) => sum + (Array.isArray(video.videos) ? video.videos.length : 0), 0);
console.log(`Reiki step video slots OK: ${stepEntries.length} step records, ${verifiedLinks} verified YouTube links.`);
