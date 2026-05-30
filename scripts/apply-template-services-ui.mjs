#!/usr/bin/env node
import fs from "node:fs";

const dryRun = process.argv.includes("--dry-run");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  if (dryRun) return;
  fs.writeFileSync(path, content);
}

function insertAfter(content, needle, addition, label) {
  if (content.includes(addition.trim())) {
    console.log(`skip: ${label}`);
    return content;
  }
  if (!content.includes(needle)) throw new Error(`Patch point not found: ${label}`);
  console.log(`patch: ${label}`);
  return content.replace(needle, `${needle}${addition}`);
}

function insertBefore(content, needle, addition, label) {
  if (content.includes(addition.trim())) {
    console.log(`skip: ${label}`);
    return content;
  }
  if (!content.includes(needle)) throw new Error(`Patch point not found: ${label}`);
  console.log(`patch: ${label}`);
  return content.replace(needle, `${addition}${needle}`);
}

function assertContains(content, needle, label) {
  if (!content.includes(needle)) throw new Error(`Post-patch check failed: ${label}`);
}

function patchProfilePage() {
  const path = "src/pages/ProfilePage.jsx";
  let content = read(path);

  content = insertAfter(
    content,
    `import { formatCabinetId } from "../lib/masterChatClient.js";`,
    `\nimport MasterTemplateServicesPanel from "../components/MasterTemplateServicesPanel.jsx";`,
    "ProfilePage MasterTemplateServicesPanel import"
  );

  content = insertAfter(
    content,
    `  const [activeTopTab, setActiveTopTab] = useState("power-place");`,
    `\n  const [templateServicesTab, setTemplateServicesTab] = useState("services");\n  const [powerPlaceServiceDraft, setPowerPlaceServiceDraft] = useState(null);`,
    "ProfilePage template services state"
  );

  content = insertAfter(
    content,
    `      setMessage(selectedCompositionId ? "Место силы обновлено." : "Место силы сохранено.");`,
    `\n      setPowerPlaceServiceDraft({\n        composition_id: saved?.id || selectedCompositionId || "",\n        title: saved?.title || compositionTitle || "Мандала Места Силы",\n        image_url: saved?.cover_ref?.src || selectedCover?.src || customCoverImage || centerImage || "",\n        template_image_url: saved?.cover_ref?.src || selectedCover?.src || customCoverImage || centerImage || "",\n        image_bucket: saved?.cover_ref?.bucket || null,\n        image_path: saved?.cover_ref?.path || null\n      });`,
    "ProfilePage draft service after composition save"
  );

  content = insertAfter(
    content,
    `  const handleLogout = () => {`,
    `\n    setTemplateServicesTab("services");\n    setPowerPlaceServiceDraft(null);`,
    "ProfilePage logout service reset"
  );

  content = insertAfter(
    content,
    `                <button className={activeTopTab === "mandalas" ? "active" : ""} type="button" onClick={() => setActiveTopTab("mandalas")}>Мои мандалы</button>`,
    `\n                <button className={activeTopTab === "services" ? "active" : ""} type="button" onClick={() => { setActiveTopTab("services"); setTemplateServicesTab("services"); }}>Услуги</button>\n                <button className={activeTopTab === "orders" ? "active" : ""} type="button" onClick={() => { setActiveTopTab("orders"); setTemplateServicesTab("orders"); }}>Заявки</button>`,
    "ProfilePage workspace service tabs"
  );

  content = insertAfter(
    content,
    `                <button className="cabinetPrimary" type="button" disabled={!profile?.id} onClick={handleCompositionSave}>\n                  {selectedCompositionId ? "Обновить место силы" : "Сохранить место силы"}\n                </button>`,
    `\n                <button\n                  className="cabinetSecondary"\n                  type="button"\n                  disabled={!profile?.id}\n                  onClick={() => {\n                    setPowerPlaceServiceDraft({\n                      composition_id: selectedCompositionId || "",\n                      title: compositionTitle || "Мандала Места Силы",\n                      image_url: selectedCover?.src || customCoverImage || centerImage || "",\n                      template_image_url: selectedCover?.src || customCoverImage || centerImage || ""\n                    });\n                    setTemplateServicesTab("services");\n                    setActiveTopTab("services");\n                    setMessage("Черновик услуги создан из текущего шаблона мандалы. Добавьте описание и цены.");\n                  }}\n                >\n                  В услуги\n                </button>`,
    "ProfilePage power place to services action"
  );

  content = insertBefore(
    content,
    `            {activeTopTab === "mandalas" && (\n            <div className="mandalaGallery">`,
    `            {(activeTopTab === "services" || activeTopTab === "orders") && (\n              <MasterTemplateServicesPanel\n                activeTab={templateServicesTab}\n                onActiveTabChange={(nextTab) => {\n                  setTemplateServicesTab(nextTab);\n                  setActiveTopTab(nextTab === "orders" ? "orders" : "services");\n                }}\n                profile={profile}\n                session={session}\n                powerPlaceDraft={powerPlaceServiceDraft}\n              />\n            )}\n\n`,
    "ProfilePage services panel render"
  );

  assertContains(content, "MasterTemplateServicesPanel", "ProfilePage imports/services panel");
  assertContains(content, ">Услуги</button>", "ProfilePage services tab");
  assertContains(content, ">Заявки</button>", "ProfilePage orders tab");
  assertContains(content, ">\n                  В услуги\n                </button>", "ProfilePage power place action");

  write(path, content);
}

function patchMain() {
  const path = "src/main.jsx";
  let content = read(path);

  content = insertAfter(
    content,
    `import AdminPage from "./pages/AdminPage.jsx";`,
    `\nimport PublicTemplateServicesPanel from "./components/PublicTemplateServicesPanel.jsx";`,
    "main public services import"
  );

  content = insertBefore(
    content,
    `      </section>\n    );\n  }\n\n  const page = item.page || {`,
    `\n        {/(магазин|услуг|предлож)/i.test(section.title || "") && (\n          <PublicTemplateServicesPanel enabled />\n        )}\n`,
    "main public services section overview render"
  );

  content = insertBefore(
    content,
    `      {page.cta && <div className="knowledgeMeta"><b>Статус:</b> {page.cta}</div>}`,
    `      {/(магазин|услуг|предлож)/i.test([section.title, item.label, page.title, page.subtitle].filter(Boolean).join(" ")) && (\n        <PublicTemplateServicesPanel enabled />\n      )}\n\n`,
    "main public services render"
  );

  assertContains(content, "PublicTemplateServicesPanel", "main public services panel");

  write(path, content);
}

patchProfilePage();
patchMain();
console.log(dryRun ? "Template services UI patch dry-run passed." : "Template services UI patch applied.");
