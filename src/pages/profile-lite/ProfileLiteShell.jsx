import React from "react";
import {
  getProfileLiteRoleNav,
  getProfileLiteRouteByTabId,
  PROFILE_LITE_CABINET_ROLES
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
  const currentCabinetLabel = PROFILE_LITE_CABINET_ROLES.find((role) => role.id === cabinetRole)?.label || "Кабинет Личный";

  const roleSwitcher = (
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
  );

  const shellChrome = (
    <div className="profileLiteShellChrome">
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

      <div className="profileLiteActionsRail" aria-label="Действия кабинета">
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
      {roleSwitcher}
      <header className="cabinetTopbar profileLiteTopbar">
        <button type="button" onClick={onNavigateHome}>На главную</button>
        <div>
          <p>Альтернативный кабинет</p>
          <h1>{currentCabinetLabel} Lite</h1>
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
