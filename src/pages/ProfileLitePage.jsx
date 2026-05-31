import React, { useEffect, useMemo, useState } from "react";
import { listOwnMaterials, materialStatusText, publicationTypeLabel } from "../lib/profileMaterialsClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getOwnProfile,
  getStoredSession,
  isStoredSessionExpired,
  saveOwnProfile,
  signInWithGoogle,
  storeSessionFromUrlHash,
  supabaseEnv
} from "../lib/supabaseClient.js";
import {
  createProfileLiteDiagnostics,
  createProfileLiteForm,
  createProfileLiteSavePayload,
  loadProfileLiteViewModel,
  safeProfileLiteError,
  shortUserId
} from "../lib/profileLiteClient.js";

function resetWindowUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

export default function ProfileLitePage({ onNavigateHome, onNavigateMasters }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authStatus, setAuthStatus] = useState("idle");
  const [profileStatus, setProfileStatus] = useState("idle");
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [form, setForm] = useState(() => createProfileLiteForm());
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [materialsStatus, setMaterialsStatus] = useState("idle");
  const [materials, setMaterials] = useState([]);

  const sessionExpired = useMemo(() => isStoredSessionExpired(session), [session]);
  const diagnostics = useMemo(() => createProfileLiteDiagnostics({
    supabaseConfigured: supabaseEnv.isConfigured,
    session,
    sessionExpired,
    user,
    profile,
    authStatus,
    profileStatus
  }), [authStatus, profile, profileStatus, session, sessionExpired, user]);

  const resetLocalState = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthStatus("idle");
    setProfileStatus("idle");
    setAuthError("");
    setProfileError("");
    setForm(createProfileLiteForm());
    setSaveStatus("idle");
    setSaveMessage("");
    setMaterialsStatus("idle");
    setMaterials([]);
    resetWindowUrl();
  };

  const refreshData = async () => {
    const nextSession = storeSessionFromUrlHash() || getStoredSession();
    setSession(nextSession);
    setUser(null);
    setProfile(null);
    setAuthError("");
    setProfileError("");
    setSaveMessage("");
    setMaterials([]);
    setMaterialsStatus("idle");

    if (!supabaseEnv.isConfigured || !nextSession) {
      const viewModel = await loadProfileLiteViewModel({
        supabaseConfigured: supabaseEnv.isConfigured,
        session: nextSession
      });
      setAuthStatus(viewModel.authStatus);
      setProfileStatus(viewModel.profileStatus);
      setAuthError(viewModel.error);
      return;
    }

    if (isStoredSessionExpired(nextSession)) {
      const viewModel = await loadProfileLiteViewModel({
        supabaseConfigured: true,
        session: nextSession,
        sessionExpired: true
      });
      setAuthStatus(viewModel.authStatus);
      setProfileStatus(viewModel.profileStatus);
      setAuthError(viewModel.error);
      return;
    }

    setAuthStatus("loading");
    setProfileStatus("idle");
    const viewModel = await loadProfileLiteViewModel({
      supabaseConfigured: true,
      session: nextSession,
      getCurrentUser,
      getOwnProfile
    });
    setAuthStatus(viewModel.authStatus);
    setProfileStatus(viewModel.profileStatus);
    setUser(viewModel.user);
    setProfile(viewModel.profile);
    setAuthError(viewModel.error);
    setProfileError(viewModel.profileError);
    setForm(createProfileLiteForm(viewModel.profile, viewModel.user));
  };

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      if (!profile?.id || !session || authStatus !== "success") {
        setMaterialsStatus("idle");
        setMaterials([]);
        return;
      }

      setMaterialsStatus("loading");
      try {
        const rows = await listOwnMaterials(profile.id, session);
        if (cancelled) return;
        setMaterials(Array.isArray(rows) ? rows : []);
        setMaterialsStatus("success");
      } catch (_error) {
        if (cancelled) return;
        setMaterials([]);
        setMaterialsStatus("needs-verification");
      }
    }

    void loadMaterials();
    return () => {
      cancelled = true;
    };
  }, [authStatus, profile?.id, session]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    try {
      await signInWithGoogle("/profile-lite");
    } catch (error) {
      setAuthStatus("error");
      setAuthError(safeProfileLiteError(error, "Не удалось начать вход через Google."));
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!user?.id || !session) return;

    setSaveStatus("loading");
    setSaveMessage("");
    setProfileError("");

    try {
      const savedProfile = await saveOwnProfile(createProfileLiteSavePayload(form, user), session);
      setProfile(savedProfile);
      setForm(createProfileLiteForm(savedProfile, user));
      setProfileStatus("success");
      setSaveStatus("success");
      setSaveMessage("Профиль сохранён.");
    } catch (error) {
      setSaveStatus("error");
      setProfileStatus("error");
      setProfileError(safeProfileLiteError(error, "Профиль не сохранился."));
    }
  };

  return (
    <div className="cabinetShell profileLiteShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={onNavigateHome}>На главную</button>
        <div>
          <p>Диагностический кабинет</p>
          <h1>Простой кабинет мастера</h1>
        </div>
        <button type="button" onClick={onNavigateMasters}>Мастера</button>
      </header>

      <main className="cabinetMain profileLiteMain">
        <section className="cabinetCard profileLitePanel">
          <p className="cabinetEyebrow">Auth flow</p>
          <h2>Проверка входа без старого кабинета</h2>
          <p>Эта страница проверяет сессию, пользователя и профиль отдельным лёгким маршрутом.</p>

          {!supabaseEnv.isConfigured && (
            <div className="cabinetNotice compactNotice">
              Supabase не настроен. Кабинет не зависает и ждёт настройки окружения.
            </div>
          )}

          {authStatus === "loading" && (
            <div className="cabinetNotice compactNotice">Сессия найдена, загружаю пользователя...</div>
          )}

          {authError && <div className="cabinetError">{authError}</div>}
          {profileError && <div className="cabinetError">{profileError}</div>}

          {(!user || authStatus !== "success") && (
            <div className="cabinetActions">
              <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin} disabled={!supabaseEnv.isConfigured}>
                Войти через Google
              </button>
              <button className="cabinetSecondary" type="button" onClick={resetLocalState}>
                Сбросить сессию
              </button>
            </div>
          )}

          {user && authStatus === "success" && (
            <div className="profileLiteSummary">
              <div>
                <span>Email</span>
                <strong>{user.email || "нет"}</strong>
              </div>
              <div>
                <span>User ID</span>
                <strong>{shortUserId(user.id)}</strong>
              </div>
              <div>
                <span>Профиль</span>
                <strong>{profile?.status || "не найден"}</strong>
              </div>
              <div className="cabinetActions">
                <button className="cabinetPrimary" type="button" onClick={refreshData}>Обновить данные</button>
                <button className="cabinetSecondary" type="button" onClick={resetLocalState}>Выйти / сбросить сессию</button>
              </div>
            </div>
          )}
        </section>

        <section className="cabinetCard profileLiteDebug" aria-label="Безопасная диагностика">
          <p className="cabinetEyebrow">Safe debug</p>
          <h2>Диагностика</h2>
          <dl>
            {diagnostics.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {user && authStatus === "success" && (
          <section className="cabinetCard profileLitePanel">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Профиль мастера</p>
                <h2>{profile ? "Минимальные данные" : "Создать профиль"}</h2>
              </div>
              <span className={`cabinetStatus status-${profile?.status || form.status}`}>{profile?.status || form.status}</span>
            </div>

            <form className="profileForm" onSubmit={handleSaveProfile}>
              <label>
                Имя мастера
                <input
                  value={form.display_name}
                  onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                  placeholder="Имя для кабинета"
                />
              </label>
              <label>
                Описание
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Короткое описание практики"
                  rows={4}
                />
              </label>
              <label>
                Статус
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="draft">draft</option>
                  <option value="pending">pending</option>
                </select>
              </label>
              {saveMessage && <div className="cabinetSuccess compactNotice">{saveMessage}</div>}
              <div className="cabinetActions">
                <button className="cabinetPrimary" type="submit" disabled={saveStatus === "loading"}>
                  {saveStatus === "loading" ? "Сохраняю..." : "Сохранить профиль"}
                </button>
              </div>
            </form>
          </section>
        )}

        {user && authStatus === "success" && (
          <section className="cabinetCard profileLitePanel">
            <p className="cabinetEyebrow">Материалы</p>
            <h2>Материалы мастера</h2>
            {materialsStatus === "idle" && <p>Материалы: needs verification.</p>}
            {materialsStatus === "loading" && <p>Загружаю материалы...</p>}
            {materialsStatus === "needs-verification" && <p>Материалы: needs verification.</p>}
            {materialsStatus === "success" && materials.length === 0 && <p>Материалы пока не найдены.</p>}
            {materialsStatus === "success" && materials.length > 0 && (
              <div className="materialsGrid profileLiteMaterials">
                {materials.slice(0, 6).map((material) => (
                  <article className="materialCard" key={material.id}>
                    <div className="materialThumb">{publicationTypeLabel(material.type).slice(0, 1)}</div>
                    <div>
                      <h3>{material.title || "Без названия"}</h3>
                      <p>{material.description || "Описание не заполнено."}</p>
                      <small>{publicationTypeLabel(material.type)} · {materialStatusText(material.status)}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
