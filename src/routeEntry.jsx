import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ProfilePage from "./pages/ProfilePage.jsx";
import MastersPage from "./pages/MastersPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import "./index.css";
import "./profileCabinet.css";

const HOME_PATHS = new Set(["/", ""]);
const PROFILE_PATH = "/profile";
const MASTERS_PATH = "/masters";
const ADMIN_PATH = "/profile/admin";

if (HOME_PATHS.has(window.location.pathname)) {
  enableHomeCabinetLinks();
  import("./main.jsx");
} else {
  createRoot(document.getElementById("root")).render(<RouteApp />);
}

function enableHomeCabinetLinks() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const profileButton = target.closest(".masterInvite button");
    if (!profileButton) return;

    event.preventDefault();
    window.location.href = PROFILE_PATH;
  });
}

function RouteApp() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const navigateHome = () => {
    window.location.href = "/";
  };

  if (path === PROFILE_PATH) {
    return <ProfilePage onNavigateHome={navigateHome} onNavigateMasters={() => navigate(MASTERS_PATH)} />;
  }

  if (path === MASTERS_PATH) {
    return <MastersPage onNavigateHome={navigateHome} onNavigateProfile={() => navigate(PROFILE_PATH)} />;
  }

  if (path === ADMIN_PATH) {
    return <AdminPage onNavigateHome={navigateHome} onNavigateMasters={() => navigate(MASTERS_PATH)} />;
  }

  return (
    <div className="cabinetShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={navigateHome}>← На главную</button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>Страница не найдена</h1>
        </div>
        <button type="button" onClick={() => navigate(PROFILE_PATH)}>Кабинет →</button>
      </header>
      <main className="cabinetMain">
        <div className="cabinetNotice">
          <b>Такого раздела пока нет.</b>
          <p>Можно вернуться на главную или открыть кабинет мастера.</p>
        </div>
      </main>
    </div>
  );
}
