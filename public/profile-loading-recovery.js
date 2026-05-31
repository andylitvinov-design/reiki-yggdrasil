(() => {
  const PROFILE_PATH = "/profile";
  const SESSION_KEY = "reiki-yggdrasil-session";
  const AUTO_RESET_KEY = "reiki-profile-auto-reset-done";
  const LOADING_TEXT = "Загружаю кабинет";
  const NOTICE_DELAY_MS = 1200;
  const FORCE_NOTICE_MS = 5000;
  const AUTO_RESET_MS = 8000;

  function isProfileRoute() {
    return window.location.pathname === PROFILE_PATH;
  }

  function pageText() {
    return document.body?.textContent || "";
  }

  function hasLoadingText() {
    return pageText().includes(LOADING_TEXT);
  }

  function hasLoginUi() {
    const text = pageText();
    return text.includes("Войти через Google") || text.includes("Отправить ссылку") || text.includes("Кабинет мастера подготовлен, но Supabase ещё не подключён");
  }

  function hasLoadedCabinetUi() {
    const text = pageText();
    return text.includes("Мастерская мандал") || text.includes("Магическая мандала") || text.includes("Галерея мастера");
  }

  function hasStoredSession() {
    try {
      return Boolean(window.localStorage.getItem(SESSION_KEY));
    } catch (_error) {
      return false;
    }
  }

  function wasAutoResetDone() {
    try {
      return window.sessionStorage.getItem(AUTO_RESET_KEY) === "true";
    } catch (_error) {
      return false;
    }
  }

  function markAutoResetDone() {
    try {
      window.sessionStorage.setItem(AUTO_RESET_KEY, "true");
    } catch (_error) {
      // Non-critical: the reset still works without the loop guard.
    }
  }

  function clearAutoResetMarkerWhenRecovered() {
    if (!isProfileRoute()) return;
    if (!hasLoginUi() && !hasLoadedCabinetUi()) return;
    try {
      window.sessionStorage.removeItem(AUTO_RESET_KEY);
    } catch (_error) {
      // Non-critical.
    }
  }

  function shouldShowRecoveryNotice({ force = false } = {}) {
    if (!isProfileRoute() || hasRecoveredNotice() || hasLoginUi() || hasLoadedCabinetUi()) return false;
    return hasLoadingText() || force;
  }

  function hasRecoveredNotice() {
    return Boolean(document.querySelector("[data-profile-loading-recovery='true']"));
  }

  function clearSessionAndReload() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (_error) {
      // Non-critical: reload still gives the app a chance to recover.
    }
    window.location.replace(PROFILE_PATH);
  }

  function autoResetStaleSession() {
    if (!isProfileRoute()) return;
    if (hasLoginUi() || hasLoadedCabinetUi()) return;
    if (!hasStoredSession() || wasAutoResetDone()) return;
    markAutoResetDone();
    clearSessionAndReload();
  }

  function showRecoveryNotice(options = {}) {
    if (!shouldShowRecoveryNotice(options)) return;

    const host = document.querySelector(".authCard") || document.querySelector("main") || document.getElementById("root") || document.body;
    const notice = document.createElement("section");
    notice.dataset.profileLoadingRecovery = "true";
    notice.setAttribute("role", "alert");
    notice.style.cssText = [
      "margin:16px auto",
      "max-width:680px",
      "padding:16px",
      "border:1px solid rgba(180, 124, 42, 0.35)",
      "border-radius:18px",
      "background:#fff8e9",
      "color:#3b2a16",
      "box-shadow:0 12px 28px rgba(73, 42, 10, 0.12)",
      "font-family:inherit",
      "position:relative",
      "z-index:2147483647",
      "pointer-events:auto"
    ].join(";");

    const title = document.createElement("b");
    title.textContent = "Кабинет загружается слишком долго.";

    const text = document.createElement("p");
    text.textContent = "Можно сбросить текущий вход и открыть форму входа заново. Токены и настройки не показываются.";
    text.style.margin = "8px 0 12px";

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.profileLoadingReset = "true";
    button.textContent = "Войти заново / сбросить вход";
    button.style.cssText = [
      "border:0",
      "border-radius:999px",
      "padding:10px 16px",
      "background:#6f431f",
      "color:#fff",
      "font-weight:700",
      "cursor:pointer",
      "position:relative",
      "z-index:2147483647",
      "pointer-events:auto"
    ].join(";");
    button.addEventListener("click", clearSessionAndReload);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      clearSessionAndReload();
    });

    notice.append(title, text, button);
    host.append(notice);
  }

  function guardUnsafeSaveAsNew(event) {
    if (!isProfileRoute()) return;

    const recoveryReset = event.target?.closest?.('[data-profile-loading-reset="true"]');
    if (recoveryReset) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      clearSessionAndReload();
      return;
    }

    const trigger = event.target?.closest?.('[data-profile-save-new="true"]');
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    window.alert("Сохранение выбранной мандалы как новой временно отключено для защиты кабинета. Используйте обычное сохранение/обновление, пока мы переносим эту функцию в React без runtime-патча.");
  }

  function scheduleRecoveryChecks() {
    if (!isProfileRoute()) return;

    window.setTimeout(() => showRecoveryNotice(), NOTICE_DELAY_MS);
    window.setTimeout(() => showRecoveryNotice({ force: true }), FORCE_NOTICE_MS);
    window.setTimeout(autoResetStaleSession, AUTO_RESET_MS);

    const observer = new MutationObserver(() => {
      clearAutoResetMarkerWhenRecovered();
      showRecoveryNotice();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.setTimeout(() => observer.disconnect(), AUTO_RESET_MS + 20000);
  }

  // This listener must be registered before profile-power-place-visual-export.js.
  // It prevents the older runtime helper from mutating React state through a hardcoded hook index.
  document.addEventListener("click", guardUnsafeSaveAsNew, true);
  document.addEventListener("pointerdown", guardUnsafeSaveAsNew, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRecoveryChecks, { once: true });
  } else {
    scheduleRecoveryChecks();
  }
})();
