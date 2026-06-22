import React from "react";
import {
  getProfileLiteRoleNav,
  getProfileLiteRouteByTabId,
  PROFILE_LITE_CABINET_ROLES,
  PROFILE_LITE_TABS
} from "../../lib/profileLiteClient.js";

export default function ProfileLiteShell({
  activeTab,
  authStatus,
  cabinetRole,
  children,
  onCabinetRoleChange,
  onNavigateHome,
  onNavigateMasters,
  onRefresh,
  onReset,
  onTabNavigate,
  profile,
  user
}) {
  const roleNav = getProfileLiteRoleNav(cabinetRole);

  const shellChrome = (
    <div className="profileLiteShellChrome">
      <div className="profileLiteRoleSwitcher" aria-label="Роль кабинета Profile Lite">
        {PROFILE_LITE_CABINET_ROLES.map((role) => (
          <button
            aria-pressed={cabinetRole === role.id}
            className={cabinetRole === role.id ? "active" : ""}
            key={role.id}
            onClick={() => onCabinetRoleChange(role)}
            type="button"
          >
            {role.label}
          </button>
        ))}
      </div>

      <nav className="profileLiteRoleNav" aria-label={`Навигация ${cabinetRole === "master" ? "Кабинет Мастера" : "Кабинет Личный"}`}>
        {roleNav.map((item) => {
          const href = getProfileLiteRouteByTabId(item.tabId);
          return (
            <a
              aria-current={activeTab === item.tabId ? "page" : undefined}
              className={activeTab === item.tabId ? "active" : ""}
              href={href}
              key={item.label}
              onClick={(event) => {
                event.preventDefault();
                onTabNavigate({ id: item.tabId, href });
              }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

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
    </div>
  );

  const content = typeof children === "function" ? children(shellChrome) : (
    <>
      {shellChrome}
      {children}
    </>
  );

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

      <main className="cabinetMain profileLiteWorkspace">
        {content}
      </main>
    </div>
  );
}
