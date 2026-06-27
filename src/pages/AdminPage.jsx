import React, { useEffect, useState } from "react";
import {
  ACTIVITY_TYPES,
  activityTypeLabel,
  buildSafeActivityEventPayload,
  createOwnActivityEvent,
  listPendingActivityEvents,
  updateActivityEventStatus
} from "../lib/profileActivityFeedClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredSession,
  isAdminUser,
  isCurrentUserAdmin,
  listProfilesForAdmin,
  listPendingProfiles,
  sendMagicLink,
  storeSessionFromUrlHash,
  supabaseEnv,
  updateProfileAccountPlan,
  updateProfileStatus
} from "../lib/supabaseClient.js";
import AdminCoursesPanel from "./admin/AdminCoursesPanel.jsx";

const EMPTY_TEST_EVENT = {
  activity_type: "master_update",
  title: "",
  body: "",
  category: "",
  tags: "",
  image_url: ""
};

const PLAN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "practic", label: "Практик" },
  { value: "master", label: "Мастер" }
];

function preview(value, max = 160) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatAdminDate(value) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function shortAdminUserId(value) {
  const text = String(value || "").trim();
  if (!text) return "нет";
  if (text.length <= 12) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

export default function AdminPage({ onNavigateHome, onNavigateMasters }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [adminAccess, setAdminAccess] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantProfiles, setParticipantProfiles] = useState([]);
  const [participantPlans, setParticipantPlans] = useState({});
  const [savingPlanByProfileId, setSavingPlanByProfileId] = useState({});
  const [pendingEvents, setPendingEvents] = useState([]);
  const [testEventForm, setTestEventForm] = useState(EMPTY_TEST_EVENT);
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
        const hasAdminAccess = isAdminUser(currentUser) || await isCurrentUserAdmin(session);
        if (!hasAdminAccess) {
          if (!cancelled) {
            setUser(currentUser);
            setAdminAccess(false);
            setProfiles([]);
            setParticipantProfiles([]);
          }
          return;
        }

        const [profileRows, participantRows, eventRows] = await Promise.all([
          listPendingProfiles(session),
          listProfilesForAdmin(session, participantSearch),
          listPendingActivityEvents(session)
        ]);
        if (!cancelled) {
          setUser(currentUser);
          setAdminAccess(true);
          setProfiles(profileRows || []);
          setParticipantProfiles(participantRows || []);
          setParticipantPlans(Object.fromEntries((participantRows || []).map((profile) => [profile.id, profile.account_plan || "start"])));
          setPendingEvents(eventRows || []);
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
  }, [session, message, participantSearch]);

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await sendMagicLink(email.trim(), "/profile/admin");
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

  const moderateEvent = async (eventId, status) => {
    setError("");
    setMessage("");

    try {
      await updateActivityEventStatus(eventId, status, session);
      setPendingEvents((rows) => rows.filter((row) => row.id !== eventId));
      setMessage(status === "approved" ? "Событие опубликовано в ленте." : "Событие отклонено.");
    } catch (err) {
      setError(err.message || "Не удалось обновить событие ленты.");
    }
  };

  const changeParticipantPlan = (profileId, value) => {
    setParticipantPlans((current) => ({ ...current, [profileId]: value }));
  };

  const saveParticipantPlan = async (profileId) => {
    const nextPlan = participantPlans[profileId] || "start";
    setError("");
    setMessage("");
    setSavingPlanByProfileId((current) => ({ ...current, [profileId]: true }));

    try {
      const updated = await updateProfileAccountPlan(profileId, nextPlan, session);
      setParticipantProfiles((rows) => rows.map((row) => (row.id === profileId ? { ...row, ...(updated || {}), account_plan: updated?.account_plan || nextPlan } : row)));
      setParticipantPlans((current) => ({ ...current, [profileId]: updated?.account_plan || nextPlan }));
      setMessage("Уровень кабинета обновлён.");
    } catch (err) {
      setError(err.message || "Не удалось обновить уровень кабинета.");
    } finally {
      setSavingPlanByProfileId((current) => ({ ...current, [profileId]: false }));
    }
  };

  const updateTestEventField = (field, value) => {
    setTestEventForm((current) => ({ ...current, [field]: value }));
  };

  const createTestEvent = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = buildSafeActivityEventPayload({
        ...testEventForm,
        status: "pending",
        visibility: "public_feed"
      });
      const created = await createOwnActivityEvent(payload, session);
      if (created) setPendingEvents((rows) => [created, ...rows.filter((row) => row.id !== created.id)]);
      setTestEventForm(EMPTY_TEST_EVENT);
      setMessage("Тестовое событие создано и ждёт модерации.");
    } catch (err) {
      setError(err.message || "Не удалось создать тестовое событие.");
    }
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setAdminAccess(false);
    setProfiles([]);
    setParticipantProfiles([]);
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
            <p>Доступ к модерации проверяется по записи администратора или резервному VITE_ADMIN_EMAIL. Значение env не выводится в интерфейс.</p>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="admin@example.com" />
            </label>
            <button className="cabinetPrimary" type="submit">Отправить ссылку для входа</button>
          </form>
        )}

        {!loading && user && !adminAccess && (
          <div className="cabinetError">
            <b>Доступ закрыт.</b>
            <p>Этот раздел доступен только администратору проекта.</p>
            <button className="cabinetGhost" type="button" onClick={logout}>Выйти</button>
          </div>
        )}

        {!loading && user && adminAccess && profiles.length === 0 && (
          <div className="cabinetNotice">
            <b>Нет профилей на модерации.</b>
            <p>Новые заявки появятся здесь после отправки из кабинета мастера.</p>
          </div>
        )}

        {!loading && user && adminAccess && profiles.length > 0 && (
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

        {!loading && user && adminAccess && (
          <section className="cabinetCard adminParticipantPlans" aria-label="Уровни кабинетов участников">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">админ-доступ</p>
                <h2>Уровни кабинетов участников</h2>
              </div>
              <span className="cabinetStatus">{participantProfiles.length}</span>
            </div>
            <label className="adminParticipantSearch">
              Поиск участника
              <input
                value={participantSearch}
                onChange={(event) => setParticipantSearch(event.target.value)}
                placeholder="Email или имя участника"
              />
            </label>
            {participantProfiles.length === 0 && (
              <div className="cabinetNotice compactNotice">
                <b>Участники не найдены.</b>
              </div>
            )}
            {participantProfiles.length > 0 && (
              <div className="adminParticipantList">
                {participantProfiles.map((profile) => {
                  const currentPlan = profile.account_plan || "start";
                  const selectedPlan = participantPlans[profile.id] || currentPlan;
                  const options = currentPlan === "pro"
                    ? [{ value: "pro", label: "Pro legacy / Практик" }, ...PLAN_OPTIONS]
                    : PLAN_OPTIONS;
                  return (
                    <article className="adminParticipantRow" key={profile.id}>
                      <div>
                        <h3>{profile.display_name || "Без имени"}</h3>
                        {profile.email && <p>{profile.email}</p>}
                        <small>user_id: {shortAdminUserId(profile.user_id)}</small>
                      </div>
                      <span className="cabinetStatus">{currentPlan === "pro" ? "Pro legacy / Практик" : currentPlan}</span>
                      <label>
                        Уровень
                        <select value={selectedPlan} onChange={(event) => changeParticipantPlan(profile.id, event.target.value)}>
                          {options.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="cabinetPrimary"
                        type="button"
                        onClick={() => saveParticipantPlan(profile.id)}
                        disabled={Boolean(savingPlanByProfileId[profile.id])}
                      >
                        {savingPlanByProfileId[profile.id] ? "Сохраняю..." : "Сохранить"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!loading && user && adminAccess && (
          <AdminCoursesPanel session={session} />
        )}

        {!loading && user && adminAccess && (
          <section className="cabinetCard adminTestEventCard" aria-label="Тестовое событие ленты">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">только администратор</p>
                <h2>Тестовое событие ленты</h2>
              </div>
              <span className="cabinetStatus">pending</span>
            </div>
            <form onSubmit={createTestEvent}>
              <div className="cabinetTwoColumns">
                <label>
                  Тип события
                  <select value={testEventForm.activity_type} onChange={(event) => updateTestEventField("activity_type", event.target.value)}>
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type} value={type}>{activityTypeLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Категория
                  <input value={testEventForm.category} onChange={(event) => updateTestEventField("category", event.target.value)} placeholder="news / mandalas / services" />
                </label>
              </div>
              <label>
                Название
                <input value={testEventForm.title} onChange={(event) => updateTestEventField("title", event.target.value)} required placeholder="Публичное название" />
              </label>
              <label>
                Описание
                <textarea value={testEventForm.body} onChange={(event) => updateTestEventField("body", event.target.value)} rows={3} placeholder="Публичное описание без приватных данных" />
              </label>
              <div className="cabinetTwoColumns">
                <label>
                  Теги
                  <input value={testEventForm.tags} onChange={(event) => updateTestEventField("tags", event.target.value)} placeholder="рэйки, мандала" />
                </label>
                <label>
                  Public-safe image URL
                  <input value={testEventForm.image_url} onChange={(event) => updateTestEventField("image_url", event.target.value)} placeholder="https://..." />
                </label>
              </div>
              <button className="cabinetPrimary" type="submit">Создать pending событие</button>
            </form>
          </section>
        )}

        {!loading && user && adminAccess && (
          <section className="moderationList adminActivityModeration" aria-label="Публикации и события на модерации">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">лента сообщества</p>
                <h2>Публикации и события на модерации</h2>
              </div>
              <span className="cabinetStatus">{pendingEvents.length}</span>
            </div>
            {pendingEvents.length === 0 && (
              <div className="cabinetNotice">
                <b>Нет событий на модерации.</b>
                <p>Pending-события появятся после отправки из гримуара, услуг, места силы или тестовой формы.</p>
              </div>
            )}
            {pendingEvents.map((activityEvent) => (
              <article className="cabinetCard moderationCard adminActivityCard" key={activityEvent.id}>
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">{activityTypeLabel(activityEvent.activityType)}</p>
                    <h3>{activityEvent.title || activityTypeLabel(activityEvent.activityType)}</h3>
                  </div>
                  <span className="cabinetStatus status-pending">pending</span>
                </div>
                <p>{preview(activityEvent.body) || "Описание не заполнено."}</p>
                <div className="adminActivityMeta">
                  <span>{activityEvent.category || "без категории"}</span>
                  {activityEvent.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  <span>{activityEvent.targetTable || "без target_table"}</span>
                  <span>{activityEvent.targetId || "без target_id"}</span>
                  <span>{formatAdminDate(activityEvent.eventAt)}</span>
                </div>
                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="button" onClick={() => moderateEvent(activityEvent.id, "approved")}>Одобрить</button>
                  <button className="cabinetSecondary" type="button" onClick={() => moderateEvent(activityEvent.id, "rejected")}>Отклонить</button>
                </div>
              </article>
            ))}
            <button className="cabinetGhost" type="button" onClick={logout}>Выйти</button>
          </section>
        )}
      </main>
    </div>
  );
}
