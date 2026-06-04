(() => {
  const HIDDEN_COVERS_KEY = "reiki-power-place-hidden-cover-shortcuts";

  function readHiddenCovers() {
    try {
      return new Set(JSON.parse(window.localStorage.getItem(HIDDEN_COVERS_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function writeHiddenCovers(hidden) {
    try {
      window.localStorage.setItem(HIDDEN_COVERS_KEY, JSON.stringify([...hidden]));
    } catch {}
  }

  function buttonKey(button) {
    return (button.textContent || "").trim() || button.getAttribute("aria-label") || "";
  }

  function applyHiddenCoverShortcuts(root = document) {
    const hidden = readHiddenCovers();
    root.querySelectorAll?.(".profileLitePowerPlace .coverVariantList.coverVariantsGrid button").forEach((button) => {
      const index = [...button.parentElement.children].indexOf(button);
      const key = buttonKey(button);
      const isSavedShortcut = index >= 6;
      if (isSavedShortcut && key && hidden.has(key) && !button.classList.contains("active")) {
        button.hidden = true;
        button.setAttribute("data-cover-shortcut-hidden", "true");
      }
    });
  }

  function clickNoCoverButton(container) {
    const noCoverButton = [...(container?.querySelectorAll("button") || [])]
      .find((button) => /без фона/i.test(button.textContent || ""));
    noCoverButton?.click();
  }

  function handleDocumentClick(event) {
    const coverPreview = event.target.closest?.(".profileLitePowerPlace .coverPreview");
    if (coverPreview) {
      const hasImage = coverPreview.classList.contains("hasImage");
      const hasTone = [...coverPreview.classList].some((className) => className.startsWith("tone-") && className !== "tone-none");
      if (!hasImage && !hasTone) {
        event.preventDefault();
        event.stopPropagation();
        document.querySelector(".profileLitePowerPlace .coverPickerButton")?.click();
      }
      return;
    }

    const coverButton = event.target.closest?.(".profileLitePowerPlace .coverVariantList.coverVariantsGrid button");
    if (coverButton) {
      const rect = coverButton.getBoundingClientRect();
      const clickedDeleteBadge = event.clientX >= rect.right - 30 && event.clientY <= rect.top + 30;
      const index = [...coverButton.parentElement.children].indexOf(coverButton);
      const isSavedShortcut = index >= 6;
      if (isSavedShortcut && clickedDeleteBadge) {
        event.preventDefault();
        event.stopPropagation();
        const hidden = readHiddenCovers();
        const key = buttonKey(coverButton);
        if (key) hidden.add(key);
        writeHiddenCovers(hidden);
        coverButton.hidden = true;
        coverButton.setAttribute("data-cover-shortcut-hidden", "true");
        if (coverButton.classList.contains("active")) clickNoCoverButton(coverButton.parentElement);
      }
    }
  }

  function refresh() {
    applyHiddenCoverShortcuts(document);
  }

  document.addEventListener("click", handleDocumentClick, true);
  window.addEventListener("reiki-route-change", refresh);
  window.addEventListener("DOMContentLoaded", refresh);
  window.setTimeout(refresh, 300);
  window.setTimeout(refresh, 1000);
})();
