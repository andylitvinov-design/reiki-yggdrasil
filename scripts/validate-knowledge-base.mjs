import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const sourcePath = new URL("../src/data/reikiKnowledgeBase.js", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { reikiKnowledgeMeta, reikiLevels, reikiSteps } = await import(moduleUrl);

const errors = [];
const idPattern = /^RY-L\d{2}-S\d{2}$/;
const ids = new Set();

if (reikiLevels.length !== reikiKnowledgeMeta.totalLevels) {
  errors.push(`Expected ${reikiKnowledgeMeta.totalLevels} levels, found ${reikiLevels.length}.`);
}

if (reikiSteps.length !== reikiKnowledgeMeta.totalSteps) {
  errors.push(`Expected ${reikiKnowledgeMeta.totalSteps} steps, found ${reikiSteps.length}.`);
}

for (const level of reikiLevels) {
  if (!Number.isInteger(level.id)) errors.push(`Level has invalid id: ${JSON.stringify(level)}`);
  if (!level.name) errors.push(`Level ${level.id} is missing name.`);
  if (!Array.isArray(level.steps)) errors.push(`Level ${level.id} is missing steps array.`);
  if (level.steps.length !== level.count) {
    errors.push(`Level ${level.id} expected ${level.count} steps, found ${level.steps.length}.`);
  }

  for (const step of level.steps) {
    if (!idPattern.test(step.id)) errors.push(`Step has invalid id: ${step.id}`);
    if (ids.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
    ids.add(step.id);
    if (step.levelId !== level.id) errors.push(`Step ${step.id} has wrong levelId ${step.levelId}, expected ${level.id}.`);
    if (!Number.isInteger(step.number)) errors.push(`Step ${step.id} has invalid number.`);
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
  `Knowledge base OK: ${reikiKnowledgeMeta.totalLevels} levels, ${reikiKnowledgeMeta.totalSteps} steps, ${ids.size} unique ids.`
);
