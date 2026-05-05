import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const EXPECTED_TOTAL_LEVELS = 7;
const EXPECTED_TOTAL_STEPS = 37;
const EXPECTED_LEVEL_COUNTS = new Map([
  [1, 5],
  [2, 6],
  [3, 5],
  [4, 5],
  [5, 5],
  [6, 5],
  [7, 6]
]);

const sourcePath = new URL("../src/data/reikiKnowledgeBase.js", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { reikiKnowledgeMeta, reikiLevels, reikiSteps } = await import(moduleUrl);

const errors = [];
const idPattern = /^RY-L\d{2}-S\d{2}$/;
const ids = new Set();

if (reikiKnowledgeMeta.totalLevels !== EXPECTED_TOTAL_LEVELS) {
  errors.push(`Expected meta.totalLevels ${EXPECTED_TOTAL_LEVELS}, found ${reikiKnowledgeMeta.totalLevels}.`);
}

if (reikiKnowledgeMeta.totalSteps !== EXPECTED_TOTAL_STEPS) {
  errors.push(`Expected meta.totalSteps ${EXPECTED_TOTAL_STEPS}, found ${reikiKnowledgeMeta.totalSteps}.`);
}

if (reikiLevels.length !== EXPECTED_TOTAL_LEVELS) {
  errors.push(`Expected ${EXPECTED_TOTAL_LEVELS} levels, found ${reikiLevels.length}.`);
}

if (reikiSteps.length !== EXPECTED_TOTAL_STEPS) {
  errors.push(`Expected ${EXPECTED_TOTAL_STEPS} steps, found ${reikiSteps.length}.`);
}

for (const level of reikiLevels) {
  if (!Number.isInteger(level.id)) errors.push(`Level has invalid id: ${JSON.stringify(level)}`);
  if (!level.name) errors.push(`Level ${level.id} is missing name.`);
  if (!level.stepLabel) errors.push(`Level ${level.id} is missing stepLabel.`);
  if (!Array.isArray(level.steps)) errors.push(`Level ${level.id} is missing steps array.`);

  const expectedLevelCount = EXPECTED_LEVEL_COUNTS.get(level.id);
  if (expectedLevelCount === undefined) {
    errors.push(`Unexpected level id: ${level.id}.`);
  } else if (level.steps.length !== expectedLevelCount) {
    errors.push(`Level ${level.id} expected ${expectedLevelCount} steps, found ${level.steps.length}.`);
  }

  if (level.steps.length !== level.count) {
    errors.push(`Level ${level.id} has count=${level.count}, but ${level.steps.length} step records.`);
  }

  for (const step of level.steps) {
    if (!idPattern.test(step.id)) errors.push(`Step has invalid id: ${step.id}`);
    if (ids.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    ids.add(step.id);
    if (step.levelId !== level.id) errors.push(`Step ${step.id} has wrong levelId ${step.levelId}, expected ${level.id}.`);
    if (!Number.isInteger(step.number)) errors.push(`Step ${step.id} has invalid number.`);
    if (!step.label) errors.push(`Step ${step.id} is missing label.`);
    if (!step.title) errors.push(`Step ${step.id} is missing title.`);
    if (!step.contentStatus) errors.push(`Step ${step.id} is missing contentStatus.`);
  }
}

if (errors.length > 0) {
  console.error("Knowledge base validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Knowledge base OK: ${EXPECTED_TOTAL_LEVELS} levels, ${EXPECTED_TOTAL_STEPS} records, ${ids.size} unique ids.`
);
