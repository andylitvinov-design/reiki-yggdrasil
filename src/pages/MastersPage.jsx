import React, { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { listPublicMasters } from "../lib/profileService";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useI18n } from "../i18n/config";
import { getFallbackMasterPreviews, sortMasterPreviews } from "../lib/masterPreview";

export function MastersPage() {
  const { t } = useI18n();
  const [masters, setMasters] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listPublicMasters().then(setMasters).catch((e) => setError(e.message));
  }, []);

  const sorted = useMemo(() => {
    if (!isSupabaseConfigured) return getFallbackMasterPreviews();
    return sortMasterPreviews(masters);
  }, [masters]);

  return (
    <div className="appShell">
      <AppHeader />
      <main className="profileLayout">
        <section className="profileCard">
          <h2>{t("masters")}</h2>
          {!isSupabaseConfigured && <p>Supabase env не задан. Добавьте env, чтобы включить реальные профили.</p>}
          {error && <p className="errorText">{error}</p>}
          <div className="mastersGrid">
            {sorted.map((master) => (
              <article className="masterCard" key={master.user_id}>
                <div className="masterAvatar">{master.avatarLabel}</div>
                <h3>{master.name}</h3>
                <p>{master.bio}</p>
                <p><b>Обучение:</b> {master.training_info}</p>
                <p><b>{t("level")}:</b> {master.master_level}</p>
                {master.show_contacts && master.contacts ? <p><b>Контакты:</b> {master.contacts}</p> : null}
              </article>
            ))}
            {sorted.length === 0 && <p>Публичных мастеров пока нет.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
