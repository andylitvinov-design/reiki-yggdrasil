(() => {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  if (!path.startsWith("/profile") || search.get("debugAuth") !== "1") return;

  const state = window.__REIKI_PROFILE_AUTH_REQUEST_DEBUG__ || {
    exchangeStatus: "idle",
    exchangeErrorMessage: "",
    exchangeErrorStatus: "",
    getCurrentUserStatus: "idle",
    getCurrentUserErrorMessage: "",
    getCurrentUserErrorStatus: ""
  };

  window.__REIKI_PROFILE_AUTH_REQUEST_DEBUG__ = state;

  function publish(patch) {
    Object.assign(state, patch || {});
    window.dispatchEvent(new CustomEvent("reiki-profile-auth-debug-update", { detail: { ...state } }));
  }

  function sanitizeMessage(value) {
    return String(value || "")
      .replace(/eyJ[a-zA-Z0-9._-]+/g, "[redacted]")
      .replace(/[a-zA-Z0-9_-]{24,}\.[a-zA-Z0-9_.-]{24,}/g, "[redacted]")
      .slice(0, 240);
  }

  function requestKind(input) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url) return "";
    if (url.includes("/auth/v1/token") && url.includes("grant_type=pkce")) return "exchange";
    if (url.includes("/auth/v1/user")) return "getCurrentUser";
    return "";
  }

  async function readSafeResponseMessage(response) {
    try {
      const text = await response.clone().text();
      if (!text) return "";
      const data = JSON.parse(text);
      return sanitizeMessage(data?.msg || data?.message || data?.error_description || data?.error || "");
    } catch (_error) {
      return "";
    }
  }

  const nativeFetch = window.fetch?.bind(window);
  if (!nativeFetch || window.__REIKI_PROFILE_AUTH_FETCH_PATCHED__) return;
  window.__REIKI_PROFILE_AUTH_FETCH_PATCHED__ = true;

  window.fetch = async function profileAuthDebugFetch(input, init) {
    const kind = requestKind(input);

    if (kind === "exchange") {
      publish({ exchangeStatus: "loading", exchangeErrorMessage: "", exchangeErrorStatus: "" });
    }
    if (kind === "getCurrentUser") {
      publish({ getCurrentUserStatus: "loading", getCurrentUserErrorMessage: "", getCurrentUserErrorStatus: "" });
    }

    try {
      const response = await nativeFetch(input, init);
      if (kind === "exchange") {
        if (response.ok) {
          publish({ exchangeStatus: "success", exchangeErrorMessage: "", exchangeErrorStatus: "" });
        } else {
          publish({
            exchangeStatus: "error",
            exchangeErrorMessage: await readSafeResponseMessage(response),
            exchangeErrorStatus: String(response.status || "")
          });
        }
      }
      if (kind === "getCurrentUser") {
        if (response.ok) {
          publish({ getCurrentUserStatus: "success", getCurrentUserErrorMessage: "", getCurrentUserErrorStatus: "" });
        } else {
          publish({
            getCurrentUserStatus: "error",
            getCurrentUserErrorMessage: await readSafeResponseMessage(response),
            getCurrentUserErrorStatus: String(response.status || "")
          });
        }
      }
      return response;
    } catch (error) {
      if (kind === "exchange") {
        publish({
          exchangeStatus: "error",
          exchangeErrorMessage: sanitizeMessage(error?.message || "network error"),
          exchangeErrorStatus: "network"
        });
      }
      if (kind === "getCurrentUser") {
        publish({
          getCurrentUserStatus: "error",
          getCurrentUserErrorMessage: sanitizeMessage(error?.message || "network error"),
          getCurrentUserErrorStatus: "network"
        });
      }
      throw error;
    }
  };
})();
