import React from "react";

export default function ProfileLiteSettingsModule({ onReset, profile, shellChrome }) {
  return (
    <section className="profileLiteModule profileLiteSettings mandalaWorkspace" aria-label="Настройки">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">⚙</div>
        <div>
          <p className="cabinetEyebrow">Настройки</p>
          <h2>Параметры кабинета</h2>
          <p>План, reference routes и локальные действия кабинета остаются в безопасной публичной оболочке.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{profile?.account_plan || "start"}</b> План</span>
          <span><b>old</b> Reference</span>
          <span><b>Lite</b> Shell</span>
        </div>
      </div>
      {shellChrome}
      <div className="cabinetCard">
        <p className="cabinetEyebrow">Настройки</p>
        <h2>Параметры кабинета</h2>
        <dl className="profileLiteSettingsList">
          <div>
            <dt>План</dt>
            <dd>{profile?.account_plan || "start"}</dd>
          </div>
          <div>
            <dt>Старый кабинет</dt>
            <dd><a href="/profile-old">/profile-old</a> доступен как reference/diagnostic</dd>
          </div>
          <div>
            <dt>Services / orders / chats</dt>
            <dd>needs verification на live Supabase, если таблицы или RLS ещё не применены.</dd>
          </div>
        </dl>
        <div className="cabinetActions">
          <button className="cabinetSecondary" type="button" onClick={onReset}>Сбросить локальную сессию</button>
        </div>
      </div>
    </section>
  );
}
