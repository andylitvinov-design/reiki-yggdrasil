import { readFileSync, writeFileSync } from "node:fs";

const filePath = new URL("../src/pages/ProfilePage.jsx", import.meta.url);
let source = readFileSync(filePath, "utf8");
const original = source;

function replaceRequired(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Issue #72 patch failed: missing pattern for ${label}.`);
  }
  source = source.replace(search, replacement);
}

function replaceAll(search, replacement) {
  source = source.split(search).join(replacement);
}

replaceRequired(
  "const POWER_SOURCE_COUNTS = [2, 4, 6, 8, 12];",
  "const POWER_SOURCE_COUNTS = [2, 4, 6, 8, 12, 18];",
  "Power Place source counts"
);

replaceRequired(
  "    label: \"Мистерия / Каналы Богов\",",
  "    label: \"Мистерии\",",
  "mysteries material tab label"
);

replaceRequired(
  "      label: \"Каналы Богов\",",
  "      label: \"Мистерии\",",
  "power library mysteries label"
);

replaceRequired(
  "      id: \"client-goals\",\n      label: \"Фото клиентов / целей\",",
  "      id: \"client-goals\",\n      label: \"Клиенты\",",
  "client source category label"
);

replaceRequired(
  "      source: \"Фото клиентов / целей\",",
  "      source: \"Клиенты\",",
  "client saved image source label"
);

replaceRequired(
  "      source: \"Каналы Богов\",",
  "      source: \"Мистерии\",",
  "tradition saved image source label"
);

replaceRequired(
  "  const [resourceComparisonMode, setResourceComparisonMode] = useState(\"client_photo\");",
  "  const [resourceComparisonMode, setResourceComparisonMode] = useState(\"photo_mandala\");",
  "resource comparison default"
);

replaceRequired(
  "  const [activeTopTab, setActiveTopTab] = useState(\"mandalas\");",
  "  const [activeTopTab, setActiveTopTab] = useState(\"power-place\");",
  "workspace default tab"
);

replaceRequired(
  "    setResourceComparisonMode(composition.resource_comparison_mode || \"client_photo\");",
  "    setResourceComparisonMode(composition.resource_comparison_mode || \"photo_mandala\");",
  "composition resource comparison fallback"
);

replaceRequired(
  "                <button className={activeTopTab === \"mandalas\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"mandalas\")}>Мои мандалы</button>\n                <button className={activeTopTab === \"power-place\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"power-place\")}>Место силы</button>",
  "                <button className={activeTopTab === \"power-place\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"power-place\")}>Место силы</button>\n                <button className={activeTopTab === \"mandalas\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"mandalas\")}>Мои мандалы</button>",
  "workspace tab order"
);

replaceRequired(
  "                  <p className=\"cabinetEyebrow\">Браузер материалов</p>\n                  <h3>Фильтр мастерской</h3>",
  "                  <p className=\"cabinetEyebrow\">Источники силы</p>\n                  <h3>Источники силы</h3>",
  "mandala source block title"
);

replaceRequired(
  "                  <p className=\"cabinetEyebrow\">Место силы</p>\n                  <h3>Библиотека образов</h3>",
  "                  <p className=\"cabinetEyebrow\">Источники силы</p>\n                  <h3>Источники силы</h3>",
  "power place source block title"
);

replaceRequired(
  "        <span>Ресурс без / с мандалой</span>",
  "",
  "duplicate resource toggle helper"
);

replaceRequired(
  "        Ресурс без мандалы\n        <textarea\n          value={resourceWithoutMandalaComment}\n          onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}\n          rows=\"2\"\n        />",
  "        <span className=\"srOnly\">Ресурс без мандалы</span>\n        <textarea\n          value={resourceWithoutMandalaComment}\n          onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}\n          rows=\"1\"\n          placeholder=\"Ресурс без мандалы — кратко опишите состояние до включения мандалы.\"\n          aria-label=\"Ресурс без мандалы\"\n        />",
  "resource without mandala compact textarea"
);

replaceRequired(
  "        Ресурс с мандалой\n        <textarea\n          value={resourceWithMandalaComment}\n          onChange={(event) => setResourceWithMandalaComment(event.target.value)}\n          rows=\"2\"\n        />",
  "        <span className=\"srOnly\">Ресурс с мандалой</span>\n        <textarea\n          value={resourceWithMandalaComment}\n          onChange={(event) => setResourceWithMandalaComment(event.target.value)}\n          rows=\"1\"\n          placeholder=\"Ресурс с мандалой — кратко опишите изменение после включения мандалы.\"\n          aria-label=\"Ресурс с мандалой\"\n        />",
  "resource with mandala compact textarea"
);

replaceRequired(
  "                       ? \"Центр использует только фото из раздела «Фото клиентов / целей». В раскладе 12 добавлены четыре внешних хранителя пространства.\"",
  "                       ? \"Центр использует фото из раздела «Источники силы → Клиенты». В раскладе 18 добавлены расширенные внешние позиции пространства.\"",
  "client constructor hint"
);

replaceRequired(
  "                             ? \"Зодиак ставит фото клиента или цели в центр и раскладывает до 12 образов по часовому кругу.\"",
  "                             ? \"Зодиак ставит фото клиента или цели в центр и раскладывает образы по часовому кругу.\"",
  "zodiac constructor hint"
);

replaceAll("Каналы Богов", "Мистерии");
replaceAll("Каналы богов", "Мистерии");
replaceAll("Мистерия / Мистерии", "Мистерии");
replaceAll("Фото клиентов / целей", "Клиенты");
replaceAll("Фото клиентов / цели", "Клиенты");

if (source !== original) {
  writeFileSync(filePath, source);
}

console.log("Issue #72 profile UX patch applied.");
