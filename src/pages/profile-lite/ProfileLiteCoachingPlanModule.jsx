import React, { useEffect, useMemo, useState } from "react";
import { getOwnLifePlan, saveOwnLifePlan } from "../../lib/supabaseClient.js";
import {
  COACHING_PLAN_SECTIONS,
  getClientVisibleConsultationReports,
  hasCoachingPlanContent,
  normalizeCoachingPlanSections
} from "../../lib/coachingPlanClient.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function EmptyPlan({ onEdit }) {
  return (
    <section className="cabinetCard coachingPlanEmpty">
      <p className="cabinetEyebrow">Ваш следующий шаг</p>
      <h2>Создайте персональный план жизни</h2>
      <p>Начните с коучинговой или консультационной сессии. Вместе со специалистом вы сможете определить важные направления, цели и первые действия. После встречи результат можно будет перенести в соответствующие разделы плана.</p>
      <div className="cabinetActions">
        <a className="cabinetPrimary" href="/profile/services">Найти специалиста и начать сессию</a>
        <button className="cabinetSecondary" type="button" onClick={onEdit}>Заполнить план самостоятельно</button>
      </div>
    </section>
  );
}

function ReportsView({ reports }) {
  if (reports.length === 0) {
    return (
      <div className="cabinetCard">
        <h3>Пока нет завершённых консультаций</h3>
        <p>Здесь появятся результаты услуг и консультаций, которые специалист уже передал вам через кабинет.</p>
        <a className="cabinetSecondary" href="/profile/services">Найти консультацию</a>
      </div>
    );
  }

  return (
    <div className="coachingPlanReportsList">
      {reports.map((report) => (
        <article className="cabinetCard coachingPlanReportCard" key={report.id}>
          <div className="coachingPlanReportMeta">
            <span className="cabinetStatus status-approved">Результат передан</span>
            <time>{formatDate(report.created_at)}</time>
          </div>
          <h3>{report.service?.title || "Консультация специалиста"}</h3>
          {report.master_comment && <p>{report.master_comment}</p>}
          <a className="cabinetSecondary" href={`/profile/orders?order=${encodeURIComponent(report.id)}`}>Открыть результат консультации</a>
        </article>
      ))}
      <p className="coachingPlanPrivacyNote">В этом списке отображаются только результаты, которые уже доступны вам в личном кабинете. Отчёты AI-коучей будут добавляться после подключения их канонического источника.</p>
    </div>
  );
}

export default function ProfileLiteCoachingPlanModule({ clientOrders = [], session, shellChrome }) {
  const [sections, setSections] = useState(() => normalizeCoachingPlanSections());
  const [planExists, setPlanExists] = useState(false);
  const [view, setView] = useState("plan");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const reports = useMemo(() => getClientVisibleConsultationReports(clientOrders), [clientOrders]);
  const hasContent = hasCoachingPlanContent(sections);
  const hasWorkspace = planExists || hasContent || reports.length > 0 || editorOpen;

  useEffect(() => {
    let active = true;
    if (!session?.access_token) {
      setLoadStatus("idle");
      return () => { active = false; };
    }
    setLoadStatus("loading");
    getOwnLifePlan(session)
      .then((plan) => {
        if (!active) return;
        setPlanExists(Boolean(plan));
        setSections(normalizeCoachingPlanSections(plan?.sections));
        setLoadStatus("success");
      })
      .catch((error) => {
        if (!active) return;
        setLoadStatus("error");
        setMessage(error?.message || "Не удалось загрузить план. Попробуйте обновить страницу.");
      });
    return () => { active = false; };
  }, [session?.access_token]);

  const updateSection = (sectionId, field, value) => {
    setSections((current) => ({
      ...current,
      [sectionId]: { ...current[sectionId], [field]: value }
    }));
    setSaveStatus("idle");
    setMessage("");
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      setMessage("Войдите в личный кабинет, чтобы сохранить план.");
      return;
    }
    setSaveStatus("loading");
    setMessage("");
    try {
      const saved = await saveOwnLifePlan(sections, session);
      setSections(normalizeCoachingPlanSections(saved?.sections || sections));
      setPlanExists(true);
      setEditorOpen(true);
      setSaveStatus("success");
      setMessage("План сохранён. Вы можете обновлять его после новых встреч и личных изменений.");
    } catch (error) {
      setSaveStatus("error");
      setMessage(error?.message || "Не удалось сохранить план. Проверьте соединение и попробуйте ещё раз.");
    }
  };

  return (
    <section className="profileLiteModule coachingPlanModule mandalaWorkspace" aria-label="My Coaching Plan">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◎</div>
        <div>
          <p className="cabinetEyebrow">Личный кабинет</p>
          <h2>My Coaching Plan</h2>
          <p>Ваш персональный план жизни, целей и изменений. Он развивается вместе с вами и результатами встреч со специалистами.</p>
        </div>
      </div>
      {shellChrome}
      {loadStatus === "loading" && <div className="cabinetNotice compactNotice">Загружаем ваш план…</div>}
      {loadStatus === "error" && <div className="cabinetError">{message}</div>}

      {loadStatus !== "loading" && (
        <>
          {!hasWorkspace ? (
            <EmptyPlan onEdit={() => setEditorOpen(true)} />
          ) : (
            <>
              <div className="coachingPlanToolbar">
                <div className="coachingPlanTabs" aria-label="Разделы плана">
                  <button className={view === "plan" ? "tab active" : "tab"} onClick={() => setView("plan")} type="button">Life Plan</button>
                  <button className={view === "reports" ? "tab active" : "tab"} onClick={() => setView("reports")} type="button">Отчёты и консультации ({reports.length})</button>
                </div>
                {view === "plan" && <button className="cabinetSecondary" onClick={() => setEditorOpen((current) => !current)} type="button">{editorOpen ? "Свернуть редактор" : "Редактировать план"}</button>}
              </div>

              {view === "reports" ? (
                <ReportsView reports={reports} />
              ) : (
                <div className="coachingPlanSections">
                  {COACHING_PLAN_SECTIONS.map((section) => {
                    const value = sections[section.id];
                    return (
                      <details className="cabinetCard coachingPlanSection" key={section.id} open={section.id === "direction" || editorOpen}>
                        <summary>
                          <span>
                            <strong>{section.title}</strong>
                            <small>{section.description}</small>
                          </span>
                          <span className="coachingPlanSectionStatus">{[value.current_state, value.desired_state, value.next_steps, value.notes].some((item) => item.trim()) ? "Заполнено" : "Можно заполнить позже"}</span>
                        </summary>
                        {editorOpen ? (
                          <div className="coachingPlanSectionFields">
                            <label>Где я сейчас<textarea rows="3" value={value.current_state} onChange={(event) => updateSection(section.id, "current_state", event.target.value)} placeholder="Опишите текущую ситуацию своими словами…" /></label>
                            <label>К чему хочу прийти<textarea rows="3" value={value.desired_state} onChange={(event) => updateSection(section.id, "desired_state", event.target.value)} placeholder="Какого состояния или результата вы хотите?" /></label>
                            <label>Следующие шаги<textarea rows="3" value={value.next_steps} onChange={(event) => updateSection(section.id, "next_steps", event.target.value)} placeholder="Действия, сроки и небольшие этапы…" /></label>
                            <label>Мои заметки<textarea rows="2" value={value.notes} onChange={(event) => updateSection(section.id, "notes", event.target.value)} placeholder="Личные наблюдения и изменения…" /></label>
                            <small className="coachingPlanPrivacyNote">Личные заметки видны только вам. При добавлении рекомендаций из отчётов система предложит подтвердить каждое изменение отдельно.</small>
                            <a className="text-link" href="/profile/services">Подобрать специалиста для этого направления</a>
                          </div>
                        ) : (
                          <div className="coachingPlanSectionPreview">
                            {value.current_state && <p><strong>Сейчас:</strong> {value.current_state}</p>}
                            {value.desired_state && <p><strong>Желаемый результат:</strong> {value.desired_state}</p>}
                            {value.next_steps && <p><strong>Следующие шаги:</strong> {value.next_steps}</p>}
                            {value.notes && <p><strong>Заметки:</strong> {value.notes}</p>}
                            {!value.current_state && !value.desired_state && !value.next_steps && !value.notes && <p>Этот раздел пока не заполнен.</p>}
                          </div>
                        )}
                      </details>
                    );
                  })}
                  {editorOpen && (
                    <div className="coachingPlanSaveBar">
                      <button className="cabinetPrimary" disabled={saveStatus === "loading"} onClick={handleSave} type="button">{saveStatus === "loading" ? "Сохраняем…" : "Сохранить план"}</button>
                      {saveStatus === "success" && <span className="coachingPlanSaved">Сохранено</span>}
                    </div>
                  )}
                  {message && <div className={saveStatus === "error" || loadStatus === "error" ? "cabinetError" : "cabinetNotice"}>{message}</div>}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
