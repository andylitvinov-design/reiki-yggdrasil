import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const sourcePath = new URL("../src/data/freeCourseLinks.js", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { freeCourseLinks, freeVideoCategories, psimasterSourcePageUrl } = await import(moduleUrl);

const errors = [];
const warnings = [];

function isHttpsUrl(value) {
  return typeof value === "string" && /^https:\/\//.test(value);
}

function isNullableHttpsUrl(value) {
  return value === null || isHttpsUrl(value);
}

if (!isHttpsUrl(psimasterSourcePageUrl)) {
  errors.push("psimasterSourcePageUrl must be an HTTPS URL.");
}

if (!Array.isArray(freeVideoCategories) || freeVideoCategories.length === 0) {
  errors.push("freeVideoCategories must be a non-empty array.");
}

if (!Array.isArray(freeCourseLinks) || freeCourseLinks.length === 0) {
  errors.push("freeCourseLinks must be a non-empty array.");
}

const categoryIds = new Set((freeVideoCategories || []).map((category) => category.id));
const seenIds = new Set();

for (const [index, item] of (freeCourseLinks || []).entries()) {
  const prefix = `freeCourseLinks[${index}]`;

  if (!item.id || !/^FREE-[A-Z0-9-]+$/.test(item.id)) {
    errors.push(`${prefix} has invalid stable id: ${item.id}`);
  }

  if (seenIds.has(item.id)) {
    errors.push(`${prefix} duplicates id ${item.id}`);
  }
  seenIds.add(item.id);

  for (const field of ["title", "type", "typeLabel", "category", "categoryLabel", "tradition", "description", "source", "notes"]) {
    if (!item[field] || typeof item[field] !== "string") {
      errors.push(`${item.id || prefix} is missing string field ${field}.`);
    }
  }

  if (!categoryIds.has(item.category)) {
    errors.push(`${item.id} uses unknown category ${item.category}.`);
  }

  if (item.source !== "psimaster") {
    errors.push(`${item.id} source must stay psimaster.`);
  }

  if (item.sourcePageUrl !== psimasterSourcePageUrl) {
    errors.push(`${item.id} sourcePageUrl must match psimasterSourcePageUrl.`);
  }

  if (!isNullableHttpsUrl(item.courseUrl)) {
    errors.push(`${item.id} courseUrl must be null or an HTTPS URL.`);
  }

  if (!isNullableHttpsUrl(item.embedUrl)) {
    errors.push(`${item.id} embedUrl must be null or an HTTPS URL.`);
  }

  if (item.urlStatus === "verified" && !item.courseUrl && !item.embedUrl) {
    errors.push(`${item.id} cannot be verified without courseUrl or embedUrl.`);
  }

  if (item.urlStatus !== "verified" && item.urlStatus !== "needs verification") {
    errors.push(`${item.id} urlStatus must be verified or needs verification.`);
  }

  if (!Array.isArray(item.recommendedPlacement) || item.recommendedPlacement.length === 0) {
    warnings.push(`${item.id} has no recommendedPlacement values.`);
  }
}

if (warnings.length > 0) {
  console.warn("Free course link validation warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("Free course link validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Free course links OK: ${freeCourseLinks.length} records, ${freeVideoCategories.length} categories.`);
