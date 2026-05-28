const PANEL_ID = "publicRightMaterialsPanel";

function replaceDaoRiTitle() {
  document.querySelectorAll(".leftMenuCard b, .stageCard h2").forEach((node) => {
    if (node.textContent?.trim() === "Школа Магии ДАО РИ") {
      node.textContent = "Школа ДАО РИ";
    }
  });
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

function renderPanel() {
  replaceDaoRiTitle();
  const panel = ensurePanel();
  if (!panel) return;
  panel.innerHTML = "<div class='publicMaterialsHeader'><div><p>Последнее</p><h3>Новые материалы сайта</h3></div><span class='publicMaterialsNote'>обновления</span></div><p class='publicMaterialsEmpty'>Публичная лента материалов подключена. Данные подгружаются через Supabase после настройки published-materials API.</p>";
}

setTimeout(renderPanel, 180);
window.addEventListener("load", renderPanel);
window.addEventListener("reiki-route-change", () => setTimeout(renderPanel, 180));
document.addEventListener("click", (event) => {
  if (event.target?.closest?.(".mainNav button, .leftMenuCard, .mysteryTab, .pianoKey")) {
    setTimeout(renderPanel, 180);
  }
});
