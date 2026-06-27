import React, { useEffect, useState } from "react";
import {
  listProfilesForAdmin,
  updateProfileAdminFields
} from "../../lib/supabaseClient.js";

const PLAN_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "practic", label: "Практик" },
  { value: "master", label: "Мастер" }
];

const STATUS_OPTIONS = [
  { value: "draft", label: "draft" },
  { value: "pending", label: "pending" },
  { value: "approved", label: "approved" },
  { value: "rejected", label: "rejected" }
];

function shortAdminUserId(value) {
  const text = String(value || "").trim();
  if (!text) return "нет";
  if (text.length <= 12) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function initialPlan(profile) {
  return profile?.account_plan || "start";
}

function initialStatus(profile) {
  return profile?.status || "draft";
}

export default function ProfileAdminPanel({ session }) {
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantProfiles, setParticipantProfiles] = useState([]);
  const [participantPlans, setParticipantPlans] = useState({});
  const [participantStatuses, setParticipantStatuses] = useState({});
  const [savingByProfileId, setSavingByProfileId] = useState({});
  const [loading, setLoading] = useState(Boolean(session?.access_token));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session?.access_token) {
        setParticipantProfiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const rows = await listProfilesForAdmin(session, participantSearch);
        if (cancelled) return;
        setParticipantProfiles(rows || []);
        setParticipantPlans(Object.fromEntries((rows || []).map((profile) => [profile.id, initialPlan(profile)])));
        setParticipantStatuses(Object.fromEntries((rows || []).map((profile) => [profile.id, initialStatus(profile)])));
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить участников.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session, participantSearch]);

  const changeParticipantPlan = (profileId, value) => {
    setParticipantPlans((current) => ({ ...current, [profileId]: value }));
  };

  const changeParticipantStatus = (profileId, value) => {
    setParticipantStatuses((current) => ({ ...current, [profileId]: value }));
  };

  const saveParticipant = async (profileId) => {
    const nextPlan = participantPlans[profileId] || "start";
    const nextStatus = participantStatuses[profileId] || "draft";
    setError("");
    setMessage("");
    setSavingByProfileId((current) => ({ ...current, [profileId]: true }));

    try {
      const updated = await updateProfileAdminFields(profileId, {
        accountPlan: nextPlan,
        status: nextStatus
      }, session);
      setParticipantProfiles((rows) => rows.map((row) => (
        row.id === profileId
          ? { ...row, ...(updated || {}), account_plan: updated?.account_plan || nextPlan, status: updated?.status || nextStatus }
          : row
      )));
      setParticipantPlans((current) => ({ ...current, [profileId]: updated?.account_plan || nextPlan }));
      setParticipantStatuses((current) => ({ ...current, [profileId]: updated?.status || nextStatus }));
      setMessage("Уровень и статус участника обновлены.");
    } catch (err) {
      setError(err.message || "Не удалось обновить участника.");
    } finally {
      setSavingByProfileId((current) => ({ ...current, [profileId]: false }));
    }
  };

  return (
    <section className="cabinetCard adminParticipantPlans" aria-label="Уровни кабинетов участников">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">админ-доступ</p>
          <h2>Уровни кабинетов участников</h2>
        </div>
        <span className="cabinetStatus">{loading ? "..." : participantProfiles.length}</span>
      </div>

      {error && <div className="cabinetError compactNotice">{error}</div>}
      {message && <div className="cabinetSuccess compactNotice">{message}</div>}

      <label className="adminParticipantSearch">
        Поиск участника
        <input
          value={participantSearch}
          onChange={(event) => setParticipantSearch(event.target.value)}
          placeholder="Email или имя участника"
        />
      </label>

      {loading && <div className="cabinetNotice compactNotice">Загружаю участников...</div>}
      {!loading && participantProfiles.length === 0 && (
        <div className="cabinetNotice compactNotice">
          <b>Участники не найдены.</b>
        </div>
      )}

      {!loading && participantProfiles.length > 0 && (
        <div className="adminParticipantList">
          {participantProfiles.map((profile) => {
            const currentPlan = initialPlan(profile);
            const selectedPlan = participantPlans[profile.id] || currentPlan;
            const selectedStatus = participantStatuses[profile.id] || initialStatus(profile);
            const planOptions = currentPlan === "pro"
              ? [{ value: "pro", label: "Pro legacy / Практик" }, ...PLAN_OPTIONS]
              : PLAN_OPTIONS;
            return (
              <article className="adminParticipantRow" key={profile.id}>
                <div>
                  <h3>{profile.display_name || "Без имени"}</h3>
                  {profile.email && <p>{profile.email}</p>}
                  <small>user_id: {shortAdminUserId(profile.user_id)}</small>
                </div>
                <span className="cabinetStatus">{selectedStatus}</span>
                <label>
                  Уровень
                  <select value={selectedPlan} onChange={(event) => changeParticipantPlan(profile.id, event.target.value)}>
                    {planOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Статус
                  <select value={selectedStatus} onChange={(event) => changeParticipantStatus(profile.id, event.target.value)}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="cabinetPrimary"
                  type="button"
                  onClick={() => saveParticipant(profile.id)}
                  disabled={Boolean(savingByProfileId[profile.id])}
                >
                  {savingByProfileId[profile.id] ? "Сохраняю..." : "Сохранить"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
