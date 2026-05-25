import { reikiKnowledgeMeta, reikiLevels, reikiSteps, reikiStepsById } from "./reikiKnowledgeBase.js";
import { sourcedStepSettings } from "./reikiStepSettings.js";

const OVERVIEW_TAB = {
  id: "overview",
  title: "Обзор",
  label: "Обзор",
  type: "overview"
};

const PRACTICE_TAB = {
  id: "practice",
  title: "Практика",
  label: "Практика",
  type: "practice"
};

function normalizeSettingTitle(title = "") {
  return title
    .replace(/^Настройка\s+«/i, "")
    .replace(/»$/i, "")
    .trim() || title;
}

function buildOverview(step) {
  return {
    id: `${step.id}-overview`,
    title: "Обзор",
    intro: step.intro,
    meaning: step.meaning,
    opens: step.opens || [],
    skills: step.skills || [],
    result: step.result,
    contentStatus: step.contentStatus || "needs_review"
  };
}

function buildSettingTab(setting) {
  const title = normalizeSettingTitle(setting.title);

  return {
    id: setting.id,
    settingId: setting.id,
    title,
    label: title,
    type: "setting",
    contentStatus: setting.contentStatus || "needs_review"
  };
}

function buildSettingRecord(setting, step, index) {
  const title = normalizeSettingTitle(setting.title);
  const id = setting.id || `${step.id}-A${String(index + 1).padStart(2, "0")}`;
  const hasSourcedSettings = Boolean(sourcedStepSettings[step.id]);

  return {
    ...setting,
    id,
    title,
    originalTitle: setting.title,
    stepId: step.id,
    levelId: step.levelId,
    tabId: id,
    type: "setting",
    source: hasSourcedSettings ? "sourcedStepSettings" : "reikiKnowledgeBase",
    contentStatus: setting.contentStatus || (hasSourcedSettings ? "source_reviewed" : "needs_review")
  };
}

function buildDegreeStep(step, level) {
  const sourceSettings = sourcedStepSettings[step.id] || step.settings || [];
  const settings = sourceSettings.map((setting, index) => buildSettingRecord(setting, step, index));

  return {
    id: step.id,
    levelId: step.levelId,
    levelTitle: level.name,
    number: step.number,
    label: `${step.label} ${step.number}`,
    stepLabel: step.label,
    title: step.title,
    status: step.status,
    contentStatus: step.contentStatus || "needs_review",
    overview: buildOverview(step),
    settings,
    tabs: [OVERVIEW_TAB, PRACTICE_TAB, ...settings.map(buildSettingTab)]
  };
}

export const degreeSettingsMeta = {
  project: "Reiki Yggdrasil",
  language: "ru",
  source: "src/data/degreeSettings.js",
  upstreamSource: reikiKnowledgeMeta.source,
  sourcedSettingsSource: "src/data/reikiStepSettings.js",
  status: "ui_structure_for_degree_right_panel",
  sourceStatus: reikiKnowledgeMeta.status,
  stableIdPattern: reikiKnowledgeMeta.stableIdPattern,
  totalLevels: reikiKnowledgeMeta.totalLevels,
  totalSteps: reikiKnowledgeMeta.totalSteps,
  policy:
    "This file is a normalized UI layer for levels, steps and setting tabs. It derives the course hierarchy from src/data/reikiKnowledgeBase.js and prefers author-sourced settings from src/data/reikiStepSettings.js. It must not invent course settings."
};

export const degreeSettings = reikiLevels.map((level) => ({
  id: `level-${String(level.id).padStart(2, "0")}`,
  levelId: level.id,
  title: level.name,
  name: level.name,
  stepLabel: level.stepLabel,
  theme: level.theme,
  count: level.count,
  steps: level.steps.map((step) => buildDegreeStep(step, level))
}));

export const degreeSteps = degreeSettings.flatMap((level) => level.steps);

export const degreeStepsById = Object.fromEntries(degreeSteps.map((step) => [step.id, step]));

export const degreeSettingsByLevelId = Object.fromEntries(
  degreeSettings.map((level) => [level.levelId, level])
);

export const degreeSettingsByStepId = degreeStepsById;

export const degreeSettingTabsByStepId = Object.fromEntries(
  degreeSteps.map((step) => [step.id, step.tabs])
);

export function getDegreeLevelById(levelId) {
  return degreeSettingsByLevelId[Number(levelId)] || null;
}

export function getDegreeStepById(stepId) {
  return degreeStepsById[stepId] || null;
}

export function getDegreeTabsForStep(stepId) {
  return getDegreeStepById(stepId)?.tabs || [OVERVIEW_TAB, PRACTICE_TAB];
}

export function getDegreeOverviewByStepId(stepId) {
  return getDegreeStepById(stepId)?.overview || null;
}

export function getDegreeSettingByTabId(stepId, tabId) {
  if (!stepId || !tabId || tabId === OVERVIEW_TAB.id || tabId === PRACTICE_TAB.id) return null;

  return getDegreeStepById(stepId)?.settings.find((setting) => setting.tabId === tabId || setting.id === tabId) || null;
}

export function getDegreePanelContent(stepId, tabId = OVERVIEW_TAB.id) {
  const step = getDegreeStepById(stepId) || degreeSteps[0] || null;

  if (!step) {
    return {
      type: "empty",
      title: "Обзор",
      contentStatus: "needs verification"
    };
  }

  if (!tabId || tabId === OVERVIEW_TAB.id) {
    return {
      type: "overview",
      step,
      tab: OVERVIEW_TAB,
      ...step.overview
    };
  }

  if (tabId === PRACTICE_TAB.id) {
    return {
      type: "practice",
      step,
      tab: PRACTICE_TAB,
      title: PRACTICE_TAB.title,
      description: "Практические упражнения и аудио для закрепления выбранной ступени.",
      contentStatus: step.contentStatus || "needs_review"
    };
  }

  const setting = getDegreeSettingByTabId(step.id, tabId);

  if (!setting) {
    return {
      type: "missing",
      step,
      title: "Материал уточняется",
      description: "Настройка для выбранной вкладки не найдена в структуре ступени.",
      contentStatus: "needs verification"
    };
  }

  return {
    type: "setting",
    step,
    tab: step.tabs.find((tab) => tab.id === tabId) || null,
    ...setting
  };
}

export function getSourceStepById(stepId) {
  return reikiStepsById[stepId] || reikiSteps.find((step) => step.id === stepId) || null;
}
