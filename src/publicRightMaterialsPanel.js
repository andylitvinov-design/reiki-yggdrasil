import { listPublicMaterials, publicationTypeLabel } from "./lib/profileMaterialsClient.js";

const PANEL_ID = "publicRightMaterialsPanel";
const PUBLIC_ROUTES_RE = /^\/$/;
const SECTION_LABELS = { "ДАО РИ": "ДАО РИ", "МИСТЕРИИ": "Мистерии", "МАСТЕРСКАЯ": "Мастерская", "МАГАЗИН": "Магазин" };
const SECTION_TOKENS = {
  "ДАО РИ": ["дао", "ри", "reiki", "рейки", "иггдрасиль"],
  "МИСТЕРИИ": ["мистер", "гречес", "египет", "майян"],
  "МАСТЕРСКАЯ": ["мастерская", "мандала", "талисман", "артефакт", "место"],
  "МАГАЗИН": ["магазин", "услуг", "артефакт", "заказ", "каталог"]
};

let cachedRows = null;
let loadingPromise = null;
let renderTimer = null;

function normalize(value) {
  return String(value || "").toLowerCase().replace(/ё/g, "е").trim();
}

function safeText(value, fallback = "Материал") {
  return String(value || "").trim() || fallback;
}

function isSafeHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function shortText(value, max = 110) {
  const text = safeText(value, "");
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
    : "дата не указана";
}

function replaceHomeDaoRiLabel() {
  document.querySelectorAll(".leftMenuCard b, .sectionStage h2, .stageCard h2").forEach((node) => {
    if (node.textContent?.trim() === "Школа Магии ДАО РИ") node.textContent = "Школа ДАО РИ";
  });
}

function activeNavLabel() {
  return document.querySelector(".mainNav .activeNav")?.textContent?.trim() || "";
}

function currentStepId() {
  const title = document.querySelector(".pianoKey.selected")?.getAttribute("title") || "";
  return title.match(/RY-L\d{2}-S\d{2}/)?.[0] || null;
}

function visibleTokens() {
  const selectors = [".leftMenuCard.active b", ".leftMenuCard.active p", ".mysteryTab.active span", ".stageCard .crumb", ".stageCard h2", ".stageCard h3", ".degreePanelEyebrow"];
  return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .map((node) => normalize(node.textContent))
    .flatMap((text) => text.split(/[\s·:,.—–/|«»"'()]+/))
    .filter((token) => token.length >= 3)
    .slice(0, 24);
}

function buildContext() {
  const nav = activeNavLabel();
  return {
    nav,
    label: SECTION_LABELS[nav] || "Новые материалы сайта",
    stepId: nav === "ДАО РИ" ? currentStepId() : null,
    tokens: nav ? Array.from(new Set([...(SECTION_TOKENS[nav] || []), ...visibleTokens()].map(normalize))) : [],
    isGlobal: !nav
  };
}

function materialText(row) {
  return normalize([row.title, row.description, row.step_id, row.step_title, row.setting_title, row.type].filter(Boolean).join(" "));
}

function filterRows(rows, context) {
  if (context.isGlobal) return { rows: rows.slice(0, 8), fallback: false };
  const exact = context.stepId ? rows.filter((row) => normalize(row.step_id) === normalize(context.stepId)) : [];
  const exactIds = new Set(exact.map((row) => row.id));
  const tokenRows = rows.filter((row) => !exactIds.has(row.id) && context.tokens.some((token) => materialText(row).includes(token)));
  const matched = [...exact, ...tokenRows].slice(0, 8);
  return matched.length ? { rows: matched, fallback: false } : { rows: rows.slice(0, 8), fallback: true };
}

function ensureHost() {
  const dashboard = document.querySelector(".dashboard");
  if (!dashboard) return null;
  let host = document.querySelector(".practicePanel");
  if (!host) {
    host = document.createElement("aside");
    host.className = "practicePanel publicMaterialsPanelHost";
    const stage = dashboard.querySelector(".stageCard");
    if (stage?.nextSibling) dashboard.insertBefore(host, stage.nextSibling);
    else dashboard.appendChild(host);
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

function typeLabel(row) {
  return row.type === "practice" ? "Аудио / практика" : publicationTypeLabel(row.type);
}

function categoryLabel(row, context) {
  return safeText(row.setting_title || row.step_title || row.step_id || context.label, context.label);
}

function card(row, context) {
  const item = document.createElement("article");
  item.className = "publicMaterialCard";
  const preview = document.createElement("div");
  preview.className = "publicMaterialPreview";
  if (isSafeHttpUrl(row.image_url)) {
    const img = document.createElement("img");
    img.src = row.image_url;
    img.alt = safeText(row.title, "Материал сайта");
    img.loading = "lazy";
    preview.appendChild(img);
  } else {
    preview.textContent = row.type === "practice" ? "♪" : row.type === "artifact" ? "✧" : "◈";
  }
  const text = document.createElement("div");
  text.className = "publicMaterialText";
  text.innerHTML = `<div class="publicMaterialMeta"><span></span><span></span></div><b></b><p></p><small></small>`;
  text.querySelectorAll("span")[0].textContent = typeLabel(row);
  text.querySelectorAll("span")[1].textContent = categoryLabel(row, context);
  text.querySelector("b").textContent = safeText(row.title, "Новый материал");
  text.querySelector("p").textContent = shortText(row.description || row.step_title || row.setting_title || "Описание будет добавлено мастером.");
  text.querySelector("small").textContent = formatDate(row.created_at || row.updated_at);
  item.append(preview, text);
  return item;
}

function renderRows(panel, rows, context, fallback) {
  panel.innerHTML = `<div class="publicMaterialsHeader"><div><p>${fallback || context.isGlobal ? "Последнее" : "Материалы раздела"}</p><h3>${fallback ? "Новые материалы сайта" : context.label}</h3></div><span class="publicMaterialsNote">${fallback ? "fallback" : "обновления"}</span></div>`;
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "publicMaterialsEmpty";
    empty.textContent = "Пока нет опубликованных материалов. Когда мастера добавят аудио, мандалы или артефакты, они появятся здесь.";
    panel.appendChild(empty);
    return;
  }
  const list = document.createElement("div");
  list.className = "publicMaterialsList";
  rows.forEach((row) => list.appendChild(card(row, fallback ? { ...context, label: "Новые материалы сайта" } : context)));
  panel.appendChild(list);
}

async function getRows() {
  if (cachedRows) return cachedRows;
  if (!loadingPromise) loadingPromise = listPublicMaterials({ limit: 24 }).then((rows) => (cachedRows = rows));
  return loadingPromise;
}

async function renderPanel() {
  if (!PUBLIC_ROUTES_RE.test(window.location.pathname)) {
    document.getElementById(PANEL_ID)?.remove();
    return;
  }
  replaceHomeDaoRiLabel();
  const panel = ensureHost();
  if (!panel) return;
  const context = buildContext();
  panel.innerHTML = `<div class="publicMaterialsHeader"><div><p>Последнее</p><h3>${context.label}</h3></div><span class="publicMaterialsNote">Загрузка…</span></div><p class="publicMaterialsEmpty">Загружаю новые опубликованные материалы сайта.</p>`;
  try {
    const result = filterRows(await getRows(), context);
    renderRows(panel, result.rows, context, result.fallback);
  } catch {
    panel.innerHTML = `<p class="publicMaterialsError">Новые материалы сайта сейчас не загрузились. Основные разделы сайта продолжают работать.</p>`;
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPanel, 120);
}

scheduleRender();
window.addEventListener("popstate", scheduleRender);
window.addEventListener("reiki-route-change", scheduleRender);
document.addEventListener("click", (event) => {
  if (event.target?.closest?.(".mainNav button, .leftMenuCard, .mysteryTab, .pianoKey")) scheduleRender();
});
new MutationObserver(scheduleRender).observe(document.body, { childList: true, subtree: true });
