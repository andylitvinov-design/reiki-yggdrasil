(() => {
  const PROFILE_PATH = "/profile";
  const SESSION_KEY = "reiki-yggdrasil-session";
  const LOADING_TEXT = "Загружаю кабинет";
  const TIMEOUT_MS = 15000;

  function isProfileRoute() {
    return window.location.pathname === PROFILE_PATH;
  }

  function hasLoadingText() {
    return document.body?.textContent?.includes(LOADING_TEXT);
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

  function showRecoveryNotice() {
    if (!isProfileRoute() || !hasLoadingText() || hasRecoveredNotice()) return;

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
      "font-family:inherit"
    ].join(";");

    const title = document.createElement("b");
    title.textContent = "Кабинет загружается слишком долго.";

    const text = document.createElement("p");
    text.textContent = "Можно сбросить текущий вход и открыть форму входа заново. Токены и настройки не показываются.";
    text.style.margin = "8px 0 12px";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Войти заново";
    button.style.cssText = [
      "border:0",
      "border-radius:999px",
      "padding:10px 16px",
      "background:#6f431f",
      "color:#fff",
      "font-weight:700",
      "cursor:pointer"
    ].join(";");
    button.addEventListener("click", clearSessionAndReload);

    notice.append(title, text, button);
    host.append(notice);
  }

  function scheduleRecoveryCheck() {
    if (!isProfileRoute()) return;
    window.setTimeout(showRecoveryNotice, TIMEOUT_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRecoveryCheck, { once: true });
  } else {
    scheduleRecoveryCheck();
  }
})();
