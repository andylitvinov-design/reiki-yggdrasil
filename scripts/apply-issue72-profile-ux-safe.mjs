import { readFileSync, writeFileSync } from "node:fs";

const filePath = new URL("../src/pages/ProfilePage.jsx", import.meta.url);
let source = readFileSync(filePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (source.includes(search)) {
    source = source.replace(search, replacement);
    return;
  }

  if (source.includes(replacement)) return;

  throw new Error(`Issue #72 patch failed: missing pattern for ${label}.`);
}

function replaceEvery(search, replacement) {
  source = source.split(search).join(replacement);
}

replaceOnce(
  "const POWER_SOURCE_COUNTS = [2, 4, 6, 8, 12];",
  "const POWER_SOURCE_COUNTS = [2, 4, 6, 8, 12, 18];",
  "Power Place source counts"
);

replaceOnce(
  "    label: \"Мистерия / Каналы Богов\",",
  "    label: \"Мистерии\",",
  "mysteries material tab label"
);

replaceOnce(
  "      label: \"Каналы Богов\",",
  "      label: \"Мистерии\",",
  "power library mysteries label"
);

replaceOnce(
  "      id: \"client-goals\",\n      label: \"Фото клиентов / целей\",",
  "      id: \"client-goals\",\n      label: \"Клиенты\",",
  "client source category label"
);

replaceOnce(
  "      source: \"Фото клиентов / целей\",",
  "      source: \"Клиенты\",",
  "client saved image source label"
);

replaceOnce(
  "      source: \"Каналы Богов\",",
  "      source: \"Мистерии\",",
  "tradition saved image source label"
);

replaceOnce(
  "  const [resourceComparisonMode, setResourceComparisonMode] = useState(\"client_photo\");",
  "  const [resourceComparisonMode, setResourceComparisonMode] = useState(\"photo_mandala\");",
  "resource comparison default"
);

replaceOnce(
  "  const [activeTopTab, setActiveTopTab] = useState(\"mandalas\");",
  "  const [activeTopTab, setActiveTopTab] = useState(\"power-place\");",
  "workspace default tab"
);

replaceOnce(
  "    setResourceComparisonMode(composition.resource_comparison_mode || \"client_photo\");",
  "    setResourceComparisonMode(composition.resource_comparison_mode || \"photo_mandala\");",
  "composition resource comparison fallback"
);

replaceOnce(
  "                <button className={activeTopTab === \"mandalas\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"mandalas\")}>Мои мандалы</button>\n                <button className={activeTopTab === \"power-place\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"power-place\")}>Место силы</button>",
  "                <button className={activeTopTab === \"power-place\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"power-place\")}>Место силы</button>\n                <button className={activeTopTab === \"mandalas\" ? \"active\" : \"\"} type=\"button\" onClick={() => setActiveTopTab(\"mandalas\")}>Мои мандалы</button>",
  "workspace tab order"
);

replaceOnce(
  "                  <p className=\"cabinetEyebrow\">Браузер материалов</p>\n                  <h3>Фильтр мастерской</h3>",
  "                  <p className=\"cabinetEyebrow\">Источники силы</p>\n                  <h3>Источники силы</h3>",
  "mandala source block title"
);

replaceOnce(
  "                  <p className=\"cabinetEyebrow\">Место силы</p>\n                  <h3>Библиотека образов</h3>",
  "                  <p className=\"cabinetEyebrow\">Источники силы</p>\n                  <h3>Источники силы</h3>",
  "power place source block title"
);

replaceOnce(
  "        <span>Ресурс без / с мандалой</span>",
  "",
  "duplicate resource toggle helper"
);

replaceOnce(
  "        Ресурс без мандалы\n        <textarea\n          value={resourceWithoutMandalaComment}\n          onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}\n          rows=\"2\"\n        />",
  "        <span className=\"srOnly\">Ресурс без мандалы</span>\n        <textarea\n          value={resourceWithoutMandalaComment}\n          onChange={(event) => setResourceWithoutMandalaComment(event.target.value)}\n          rows=\"1\"\n          placeholder=\"Ресурс без мандалы — кратко опишите состояние до включения мандалы.\"\n          aria-label=\"Ресурс без мандалы\"\n        />",
  "resource without mandala compact textarea"
);

replaceOnce(
  "        Ресурс с мандалой\n        <textarea\n          value={resourceWithMandalaComment}\n          onChange={(event) => setResourceWithMandalaComment(event.target.value)}\n          rows=\"2\"\n        />",
  "        <span className=\"srOnly\">Ресурс с мандалой</span>\n        <textarea\n          value={resourceWithMandalaComment}\n          onChange={(event) => setResourceWithMandalaComment(event.target.value)}\n          rows=\"1\"\n          placeholder=\"Ресурс с мандалой — кратко опишите изменение после включения мандалы.\"\n          aria-label=\"Ресурс с мандалой\"\n        />",
  "resource with mandala compact textarea"
);

replaceOnce(
  "                       ? \"Центр использует только фото из раздела «Фото клиентов / целей». В раскладе 12 добавлены четыре внешних хранителя пространства.\"",
  "                       ? \"Центр использует фото из раздела «Источники силы → Клиенты». В раскладе 18 добавлены расширенные внешние позиции пространства.\"",
  "client constructor hint"
);

replaceOnce(
  "                             ? \"Зодиак ставит фото клиента или цели в центр и раскладывает до 12 образов по часовому кругу.\"",
  "                             ? \"Зодиак ставит фото клиента или цели в центр и раскладывает образы по часовому кругу.\"",
  "zodiac constructor hint"
);

replaceEvery("Каналы Богов", "Мистерии");
replaceEvery("Каналы богов", "Мистерии");
replaceEvery("Мистерия / Мистерии", "Мистерии");
replaceEvery("Фото клиентов / целей", "Клиенты");
replaceEvery("Фото клиентов / цели", "Клиенты");

if (source !== original) {
  writeFileSync(filePath, source);
}

console.log("Issue #72 profile UX patch applied.");
