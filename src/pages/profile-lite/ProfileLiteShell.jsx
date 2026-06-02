import React from "react";
import { PROFILE_LITE_TABS } from "../../lib/profileLiteClient.js";

export default function ProfileLiteShell({
  activeTab,
  authStatus,
  children,
  onNavigateHome,
  onNavigateMasters,
  onRefresh,
  onReset,
  onTabNavigate,
  profile,
  user
}) {
  return (
    <div className={`cabinetShell profileLiteShell profileLiteFullShell profileLiteShell-${activeTab}`}>
      <header className="cabinetTopbar profileLiteTopbar">
        <button type="button" onClick={onNavigateHome}>На главную</button>
        <div>
          <p>Альтернативный кабинет</p>
          <h1>Кабинет мастера Lite</h1>
          <small>{user?.email || "вход не выполнен"} · {profile?.display_name || "профиль загружается отдельно"}</small>
        </div>
        <button type="button" onClick={onNavigateMasters}>Мастера</button>
      </header>

      <nav className="profileLiteTabs" aria-label="Разделы кабинета Profile Lite">
        {PROFILE_LITE_TABS.map((tab) => (
          <a
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "active" : ""}
            href={tab.href}
            key={tab.id}
            onClick={(event) => {
              event.preventDefault();
              onTabNavigate(tab);
            }}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <div className="profileLiteStatusRail">
        <span>Auth: {authStatus}</span>
        <span>Профиль: {profile?.status || "needs verification"}</span>
        <div className="cabinetActions">
          <button className="cabinetSecondary" type="button" onClick={onRefresh}>Обновить</button>
          <button className="cabinetGhost" type="button" onClick={onReset}>Выйти / сбросить</button>
        </div>
      </div>

      <main className="cabinetMain profileLiteWorkspace">
        {children}
      </main>
    </div>
  );
}
