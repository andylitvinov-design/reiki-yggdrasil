import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync("public/profile-auth-render-recovery.js", "utf8");

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) || null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value))
  };
}

function runRecoveryScript({ pathname = "/profile", search = "", bodyText = "Загружаю кабинет" } = {}) {
  const timers = [];
  const events = [];
  let replaceTarget = "";
  let fetchPatched = false;

  const context = {
    URL,
    URLSearchParams,
    document: {
      body: { innerText: bodyText },
      querySelector: () => null
    },
    window: {
      __REIKI_PROFILE_REACT_DEBUG__: {},
      location: {
        pathname,
        search,
        href: `https://mentalica.vercel.app${pathname}${search}`,
        replace: (nextUrl) => {
          replaceTarget = nextUrl;
        }
      },
      localStorage: createStorage({ "reiki-yggdrasil-session": "stored" }),
      sessionStorage: createStorage(),
      fetch: async () => ({ ok: true }),
      setTimeout(callback) {
        timers.push(callback);
        return timers.length;
      },
      addEventListener(type) {
        events.push(type);
      }
    }
  };

  vm.runInNewContext(source, context);
  fetchPatched = Boolean(context.window.__REIKI_PROFILE_AUTH_RENDER_RECOVERY_FETCH_PATCHED__);

  return { timers, events, fetchPatched, replaceTarget };
}

const defaultProfile = runRecoveryScript({ pathname: "/profile" });
assert.equal(defaultProfile.fetchPatched, false, "render recovery must not auto-patch /profile without an explicit flag");
assert.equal(defaultProfile.timers.length, 0, "render recovery must not schedule reload checks on /profile by default");
assert.deepEqual(defaultProfile.events, [], "render recovery must not attach listeners on /profile by default");

const explicitProfile = runRecoveryScript({ pathname: "/profile", search: "?enableRenderRecovery=1" });
assert.equal(explicitProfile.fetchPatched, true, "render recovery may run on /profile only with enableRenderRecovery=1");
assert.ok(explicitProfile.timers.length > 0, "explicit render recovery should schedule its guarded checks");
assert.ok(explicitProfile.events.includes("DOMContentLoaded"), "explicit render recovery should keep the old DOMContentLoaded check");

const profileOld = runRecoveryScript({ pathname: "/profile-old", search: "?enableRenderRecovery=1" });
assert.equal(profileOld.fetchPatched, false, "render recovery must not patch /profile-old even when the flag is present");
assert.equal(profileOld.timers.length, 0, "render recovery must not schedule checks on /profile-old");

const profileMandalas = runRecoveryScript({ pathname: "/profile/mandalas", search: "?enableRenderRecovery=1" });
assert.equal(profileMandalas.fetchPatched, false, "render recovery must not patch modular heavy profile routes");
assert.equal(profileMandalas.timers.length, 0, "render recovery must not schedule checks on modular heavy profile routes");

assert.match(
  source,
  /search\.get\("enableRenderRecovery"\) === "1"/,
  "render recovery must remain explicitly opt-in"
);
