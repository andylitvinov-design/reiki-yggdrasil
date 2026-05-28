import { listPublicMaterials, publicationTypeLabel } from "./lib/profileMaterialsClient.js";

const PANEL_ID = "publicRightMaterialsPanel";
const SECTION_LABELS = {
  "ДАО РИ": "ДАО РИ",
  "МИСТЕРИИ": "Мистерии",
  "МАСТЕРСКАЯ": "Мастерская",
  "МАГАЗИН": "Магазин"
};
const SECTION_TOKENS = {
  "ДАО РИ": "дао ри рейки reiki иггдрасиль",
  "МИСТЕРИИ": "мистер гречес египет майян",
  "МАСТЕРСКАЯ": "мастерская мандала талисман артефакт место силы",
  "МАГАЗИН": "магазин услуг артефакт заказ каталог"
};
let rowsCache = null;
let timer = null;

function clean(value) {
  return String(value || "").trim();
}

function normalize(value) {
  return clean(value).toLowerCase().replace(/ё/g, "е");
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(clean(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function replaceDaoRiTitle() {
  document.querySelectorAll(".leftMenuCard b, .stageCard h2").forEach((node) => {
    if (clean(node.textContent) === "Школа Магии ДАО РИ") {
      node.textContent = "Школа ДАО РИ";
    }
  });
}

function activeNavLabel() {
  return clean(document.querySelector(".mainNav .activeNav")?.textContent);
}

function currentStepId() {
  const title = clean(document.querySelector(".pianoKey.selected")?.getAttribute("title"));
  const match = title.match(/RY-L\d{2}-S\d{2}/);
  return match ? match[0] : "";
}

function visibleTokens() {
  const text = Array.from(document.querySelectorAll(".leftMenuCard.active b, .leftMenuCard.active p, .mysteryTab.active span, .stageCard h2, .stageCard h3"))
    .map((node) => normalize(node.textContent))
    .join(" ");
  return text.split(" ").filter((token) => token.length >= 3);
}

function buildContext() {
  const nav = activeNavLabel();
  const seed = `${SECTION_TOKENS[nav] || ""} ${visibleTokens().join(" ")}`;
  return {
    nav,
    label: SECTION_LABELS[nav] || "Новые материалы сайта",
    stepId: nav === "ДАО РИ" ? currentStepId() : "",
    tokens: Array.from(new Set(seed.split(" ").map(normalize).filter((token) => token.length >= 3)))
  };
}

function rowText(row) {
  return normalize([row.title, row.description, row.step_id, row.step_title, row.setting_title, row.type].filter(Boolean).join(" "));
}

function selectRows(rows, ctx) {
  if (!ctx.nav) return { list: rows.slice(0, 8), fallback: false };
  const exact = ctx.stepId ? rows.filter((row) => normalize(row.step_id) === normalize(ctx.stepId)) : [];
  const exactIds = new Set(exact.map((row) => row.id));
  const tokenMatched = rows.filter((row) => !exactIds.has(row.id) && ctx.tokens.some((token) => rowText(row).includes(token)));
  const list = [...exact, ...tokenMatched].slice(0, 8);
  return list.length ? { list, fallback: false } : { list: rows.slice(0, 8), fallback: true };
}

function ensurePanel() {
  if (window.location.pathname !== "/") return null;
  const dashboard = document.querySelector(".dashboard");
  if (!dashboard) return null;
  let host = document.querySelector(".practicePanel");
  if (!host) {
    host = document.createElement("aside");
    host.className = "practicePanel publicMaterialsPanelHost";
    dashboard.appendChild(host);
  } else {
    host.classList.add("publicMaterialsPanelHost");
  }
  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "publicMaterialsBlock";
    host.prepend(panel);
  }
  return panel;
}

function shortDescription(row) {
  const value = clean(row.description || row.step_title || row.setting_title || "Описание будет добавлено мастером.");
  return value.length > 118 ? `${value.slice(0, 117).trim()}…` : value;
}

function appendCard(list, row, ctx) {
  const card = document.createElement("article");
  card.className = "publicMaterialCard";
  const preview = document.createElement("div");
  preview.className = "publicMaterialPreview";
  if (isPublicHttpUrl(row.image_url)) {
    const image = document.createElement("img");
    image.src = row.image_url;
    image.alt = clean(row.title) || "Материал сайта";
    image.loading = "lazy";
    preview.appendChild(image);
  } else {
    preview.textContent = row.type === "practice" ? "♪" : row.type === "artifact" ? "✧" : "◈";
  }
  const body = document.createElement("div");
  body.className = "publicMaterialText";
  const meta = document.createElement("div");
  meta.className = "publicMaterialMeta";
  [row.type === "practice" ? "Аудио / практика" : publicationTypeLabel(row.type), clean(row.setting_title || row.step_title || row.step_id) || ctx.label].forEach((label) => {
    const tag = document.createElement("span");
    tag.textContent = label;
    meta.appendChild(tag);
  });
  const title = document.createElement("b");
  title.textContent = clean(row.title) || "Новый материал";
  const description = document.createElement("p");
  description.textContent = shortDescription(row);
  body.append(meta, title, description);
  card.append(preview, body);
  list.appendChild(card);
}

async function getRows() {
  if (!rowsCache) rowsCache = await listPublicMaterials({ limit: 24 });
  return rowsCache;
}

async function renderPanel() {
  replaceDaoRiTitle();
  const panel = ensurePanel();
  if (!panel) return;
  const ctx = buildContext();
  panel.textContent = "";
  const header = document.createElement("div");
  header.className = "publicMaterialsHeader";
  const title = document.createElement("h3");
  title.textContent = ctx.label;
  header.appendChild(title);
  panel.appendChild(header);
  try {
    const result = selectRows(await getRows(), ctx);
    if (result.fallback) title.textContent = "Новые материалы сайта";
    const list = document.createElement("div");
    list.className = "publicMaterialsList";
    result.list.forEach((row) => appendCard(list, row, ctx));
    panel.appendChild(list);
  } catch {
    const error = document.createElement("p");
    error.className = "publicMaterialsError";
    error.textContent = "Новые материалы сайта сейчас не загрузились. Основные разделы сайта продолжают работать.";
    panel.appendChild(error);
  }
}

function scheduleRender() {
  clearTimeout(timer);
  timer = setTimeout(renderPanel, 180);
}

function startPublicRightMaterialsPanel() {
  scheduleRender();
  window.addEventListener("load", scheduleRender);
  window.addEventListener("popstate", scheduleRender);
  window.addEventListener("reiki-route-change", scheduleRender);
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.(".mainNav button, .leftMenuCard, .mysteryTab, .pianoKey")) scheduleRender();
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPublicRightMaterialsPanel, { once: true });
  } else {
    startPublicRightMaterialsPanel();
  }
}
