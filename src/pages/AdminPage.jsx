import React, { useEffect, useState } from "react";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredSession,
  isAdminUser,
  listPendingProfiles,
  sendMagicLink,
  storeSessionFromUrlHash,
  supabaseEnv,
  updateProfileStatus
} from "../lib/supabaseClient.js";

export default function AdminPage({ onNavigateHome, onNavigateMasters }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const nextSession = storeSessionFromUrlHash();
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setLoading(false);
        return;
      }

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const currentUser = await getCurrentUser(session);
        if (!isAdminUser(currentUser)) {
          if (!cancelled) {
            setUser(currentUser);
            setProfiles([]);
          }
          return;
        }

        const rows = await listPendingProfiles(session);
        if (!cancelled) {
          setUser(currentUser);
          setProfiles(rows || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить модерацию.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [session, message]);

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await sendMagicLink(email.trim());
      setMessage("Письмо для входа отправлено. Откройте ссылку из письма на этом устройстве.");
    } catch (err) {
      setError(err.message || "Не удалось отправить ссылку для входа.");
    }
  };

  const moderate = async (profileId, status) => {
    setError("");
    setMessage("");

    try {
      await updateProfileStatus(profileId, status, session);
      setMessage(status === "approved" ? "Профиль опубликован." : "Профиль отклонён.");
      setProfiles((rows) => rows.filter((row) => row.id !== profileId));
    } catch (err) {
      setError(err.message || "Не удалось обновить статус.");
    }
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfiles([]);
    setMessage("Вы вышли из админ-раздела.");
  };

  return (
    <div className="cabinetShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={onNavigateHome}>← На главную</button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>Админ-модерация</h1>
        </div>
        <button type="button" onClick={onNavigateMasters}>Каталог мастеров →</button>
      </header>

      <main className="cabinetMain">
        {!supabaseEnv.isConfigured && (
          <div className="cabinetNotice">
            <b>Админ-раздел подготовлен, но Supabase ещё не подключён.</b>
            <p>Нужно настроить VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и VITE_ADMIN_EMAIL в Vercel.</p>
          </div>
        )}

        {loading && <div className="cabinetNotice">Загружаю модерацию...</div>}
        {error && <div className="cabinetError">{error}</div>}
        {message && <div className="cabinetSuccess">{message}</div>}

        {!loading && supabaseEnv.isConfigured && !user && (
          <form className="cabinetCard authCard" onSubmit={handleMagicLink}>
            <p className="cabinetEyebrow">Вход администратора</p>
            <h2>Войдите email администратора</h2>
            <p>Доступ к модерации проверяется по VITE_ADMIN_EMAIL. Значение env не выводится в интерфейс.</p>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="admin@example.com" />
            </label>
            <button className="cabinetPrimary" type="submit">Отправить ссылку для входа</button>
          </form>
        )}

        {!loading && user && !isAdminUser(user) && (
          <div className="cabinetError">
            <b>Доступ закрыт.</b>
            <p>Этот раздел доступен только администратору проекта.</p>
            <button className="cabinetGhost" type="button" onClick={logout}>Выйти</button>
          </div>
        )}

        {!loading && user && isAdminUser(user) && profiles.length === 0 && (
          <div className="cabinetNotice">
            <b>Нет профилей на модерации.</b>
            <p>Новые заявки появятся здесь после отправки из кабинета мастера.</p>
            <button className="cabinetGhost" type="button" onClick={logout}>Выйти</button>
          </div>
        )}

        {!loading && user && isAdminUser(user) && profiles.length > 0 && (
          <div className="moderationList">
            {profiles.map((profile) => (
              <article className="cabinetCard moderationCard" key={profile.id}>
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">заявка мастера</p>
                    <h2>{profile.display_name || "Без имени"}</h2>
                  </div>
                  <span className="cabinetStatus status-pending">на модерации</span>
                </div>
                <p>{profile.bio || "Описание не заполнено."}</p>
                <small>{[profile.city, profile.country].filter(Boolean).join(", ")}</small>
                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="button" onClick={() => moderate(profile.id, "approved")}>Опубликовать</button>
                  <button className="cabinetSecondary" type="button" onClick={() => moderate(profile.id, "rejected")}>Отклонить</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
