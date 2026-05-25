(() => {
  const CABINET_LABEL = "КАБИНЕТ";
  const PROFILE_PATH = "/profile";
  const ROUTE_CHANGE_EVENT = "reiki-route-change";

  function openProfileFromHeader(event) {
    const button = event.target?.closest?.(".mainNav button");
    if (!button || button.textContent.trim() !== CABINET_LABEL) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    if (window.location.pathname !== PROFILE_PATH) {
      window.history.pushState({}, "", PROFILE_PATH);
    }

    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", openProfileFromHeader, true);
})();
