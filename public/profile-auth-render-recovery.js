(() => {
  if (window.location.pathname !== "/profile") return;

  const SESSION_KEY = "reiki-yggdrasil-session";
  const RECOVERY_KEY = "reiki-profile-auth-render-recovery-v1";
  const CHECK_DELAY_MS = 5000;
  const USER_SUCCESS_GRACE_MS = 1800;

  let currentUserOkAt = 0;

  function safeHasStoredSession() {
    try {
      return Boolean(window.localStorage?.getItem(SESSION_KEY));
    } catch (_error) {
      return false;
    }
  }

  function hasRecoveredOnce() {
    try {
      return window.sessionStorage?.getItem(RECOVERY_KEY) === "1";
    } catch (_error) {
      return true;
    }
  }

  function markRecoveredOnce() {
    try {
      window.sessionStorage?.setItem(RECOVERY_KEY, "1");
    } catch (_error) {
      // Ignore storage failures. The reload guard is best-effort only.
    }
  }

  function isProfileCabinetVisible() {
    return Boolean(document.querySelector(".cabinetGrid"));
  }

  function isProfileStillLoading() {
    const text = document.body?.innerText || "";
    return text.includes("Загружаю кабинет") && !isProfileCabinetVisible();
  }

  function shouldRecover() {
    if (!safeHasStoredSession()) return false;
    if (isProfileCabinetVisible()) return false;
    if (!isProfileStillLoading()) return false;
    if (hasRecoveredOnce()) return false;
    if (currentUserOkAt && Date.now() - currentUserOkAt < USER_SUCCESS_GRACE_MS) return false;
    return true;
  }

  function recoverIfStalled() {
    if (!shouldRecover()) return;
    markRecoveredOnce();
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("resetProfileSession");
    window.location.replace(url.toString());
  }

  const nativeFetch = window.fetch?.bind(window);
  if (nativeFetch && !window.__REIKI_PROFILE_AUTH_RENDER_RECOVERY_FETCH_PATCHED__) {
    window.__REIKI_PROFILE_AUTH_RENDER_RECOVERY_FETCH_PATCHED__ = true;
    window.fetch = async function profileAuthRenderRecoveryFetch(input, init) {
      const response = await nativeFetch(input, init);
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/auth/v1/user") && response.ok) {
        currentUserOkAt = Date.now();
        window.setTimeout(recoverIfStalled, USER_SUCCESS_GRACE_MS);
      }
      return response;
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(recoverIfStalled, CHECK_DELAY_MS);
  });
  window.setTimeout(recoverIfStalled, CHECK_DELAY_MS);
})();
