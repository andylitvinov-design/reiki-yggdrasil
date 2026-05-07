import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const EXPECTED_BASIC_STEP_IDS = [
  "RY-L01-S01",
  "RY-L01-S02",
  "RY-L01-S03",
  "RY-L01-S04",
  "RY-L01-S05"
];

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
  if (!video.sourcePage || !video.sourcePage.startsWith("https://psimaster.net/")) {
    errors.push(`${stepId} video slot must keep psimaster.net sourcePage.`);
  }

  if (video.url === "needs verification") {
    warnings.push(`${stepId} has no verified YouTube URL yet.`);
  } else if (!isYoutubeUrl(video.url)) {
    errors.push(`${stepId} video URL must be a verified https YouTube/youtu.be URL, found: ${video.url}`);
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

console.log(`Reiki step video slots OK: ${EXPECTED_BASIC_STEP_IDS.length} basic step slots present.`);
