import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/config";

export function AppHeader() {
  const { locale, setLocale } = useI18n();
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="brandBlock">
        <div className="logoSeal">♣</div>
        <div>
          <h1>Рейки Иггдрасиль</h1>
          <p>Путь поиска · древние традиции · сокровища</p>
        </div>
      </div>

      <nav className="mainNav">
        <Link className={location.pathname === "/" ? "activeNav" : ""} to="/">
          Главная
        </Link>
        <Link className={location.pathname.startsWith("/masters") ? "activeNav" : ""} to="/masters">
          Мастера
        </Link>
        <Link className={location.pathname.startsWith("/profile") ? "activeNav" : ""} to="/profile">
          Кабинет
        </Link>
      </nav>

      <div className="userTools">
        <button className="langToggle" onClick={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale.toUpperCase()}</button>
      </div>
    </header>
  );
}
