import React from "react";

export default function ProfileLiteSettingsModule({ onReset, profile }) {
  return (
    <section className="profileLiteModule profileLiteSettings" aria-label="Настройки">
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
