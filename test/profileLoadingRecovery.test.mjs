import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.parentNode = null;
    this._ownText = "";
  }

  get textContent() {
    return [this._ownText, ...this.children.map((child) => child.textContent)].join("");
  }

  set textContent(value) {
    this._ownText = String(value || "");
    this.children = [];
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener() {}

  closest(selector) {
    if (selector === '[data-profile-loading-reset="true"]' && this.dataset.profileLoadingReset === "true") return this;
    if (selector === '[data-profile-save-new="true"]' && this.dataset.profileSaveNew === "true") return this;
    return null;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      node.parentNode = this;
      this.children.push(node);
    });
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
}

class FakeDocument {
  constructor() {
    this.readyState = "complete";
    this.body = new FakeElement("body", this);
    this.listeners = {};
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  getElementById(id) {
    return id === "root" ? this.body : null;
  }

  querySelector(selector) {
    if (selector === "main" || selector === ".authCard") return null;
    if (selector === "[data-profile-loading-recovery='true']") {
      return this.find((element) => element.dataset.profileLoadingRecovery === "true");
    }
    return null;
  }

  find(predicate, root = this.body) {
    if (predicate(root)) return root;
    for (const child of root.children) {
      const result = this.find(predicate, child);
      if (result) return result;
    }
    return null;
  }
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value))
  };
}

const document = new FakeDocument();
document.body.textContent = "Загружаю кабинет";

const timers = [];
let mutationObserverCallback = null;
const context = {
  document,
  window: {
    location: {
      pathname: "/profile",
      replace() {}
    },
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    setTimeout(callback) {
      timers.push(callback);
      return timers.length;
    },
    alert() {}
  },
  MutationObserver: class {
    constructor(callback) {
      mutationObserverCallback = callback;
    }
    observe() {}
    disconnect() {}
  }
};

vm.runInNewContext(readFileSync("public/profile-loading-recovery.js", "utf8"), context);

timers[0]();
assert.ok(document.querySelector("[data-profile-loading-recovery='true']"), "recovery notice should appear while profile is still loading");

document.body._ownText = "Войти через Google";
mutationObserverCallback();

assert.equal(
  document.querySelector("[data-profile-loading-recovery='true']"),
  null,
  "stale recovery notice should be removed once login UI is visible"
);
