import React, { useEffect, useState } from "react";
import { listApprovedProfiles, supabaseEnv } from "../lib/supabaseClient.js";

const CATALOG_LOAD_ERROR = "Не удалось загрузить каталог мастеров. Проверьте соединение и попробуйте ещё раз.";

export default function MastersPage({ onNavigateHome, onNavigateProfile, onNavigateMaster }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const rows = await listApprovedProfiles();
        if (!cancelled) setProfiles(rows || []);
      } catch (_error) {
        if (!cancelled) setError(CATALOG_LOAD_ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="cabinetShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={onNavigateHome}>← На главную</button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>Каталог мастеров</h1>
        </div>
        <button type="button" onClick={onNavigateProfile}>Создать профиль →</button>
      </header>

      <main className="cabinetMain">
        {!supabaseEnv.isConfigured && (
          <div className="cabinetNotice">
            <b>Каталог мастеров подготовлен, но Supabase ещё не подключён.</b>
            <p>После настройки VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY здесь будут видны опубликованные профили мастеров.</p>
          </div>
        )}

        {loading && <div className="cabinetNotice">Загружаю мастеров...</div>}
        {error && (
          <div className="cabinetError" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Повторить
            </button>
          </div>
        )}

        {!loading && supabaseEnv.isConfigured && profiles.length === 0 && !error && (
          <div className="cabinetNotice">
            <b>Пока нет опубликованных мастеров.</b>
            <p>Профили появятся здесь после отправки и модерации.</p>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="mastersCatalogGrid">
            {profiles.map((profile) => (
              <article className="cabinetCard masterCatalogCard" key={profile.id}>
                <div className="masterPreviewImage" style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}>◎</div>
                <div>
                  <p className="cabinetEyebrow">мастер Рейки Иггдрасиль</p>
                  <h2>{profile.display_name}</h2>
                  <p>{profile.bio || "Описание мастера готовится."}</p>
                  <small>{[profile.city, profile.country].filter(Boolean).join(", ")}</small>
                  <div className="masterLinks">
                    <button type="button" onClick={() => onNavigateMaster?.(profile.id)}>Страница мастера</button>
                    {profile.telegram && <a href={profile.telegram.startsWith("http") ? profile.telegram : `https://t.me/${profile.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">Telegram</a>}
                    {profile.website && <a href={profile.website} target="_blank" rel="noreferrer">Сайт</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
