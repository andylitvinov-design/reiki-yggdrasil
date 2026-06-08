import React, { useEffect, useMemo, useState } from "react";
import {
  COURSE_ACCESS_SCOPES,
  COURSE_STATUSES,
  courseAccessScopeText,
  courseAccessStatusText,
  courseStatusText,
  createCourse,
  createCourseLesson,
  createCourseStep,
  createEmptyCourseForm,
  createEmptyCourseLessonForm,
  createEmptyCourseStepForm,
  grantCourseAccess,
  listAdminCourseAccess,
  listAdminCourseLessons,
  listAdminCourses,
  listAdminCourseSteps,
  listCourseAccessProfiles,
  revokeCourseAccess,
  updateCourse,
  updateCourseLesson,
  updateCourseStep
} from "../../lib/profileCoursesClient.js";

const EMPTY_ACCESS_FORM = {
  profile_id: "",
  user_id: "",
  course_id: "",
  step_id: "",
  access_scope: "course"
};

function text(value) {
  return String(value || "").trim();
}

function shortId(value) {
  const id = text(value);
  if (!id) return "нет user_id";
  return id.length <= 12 ? id : `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function profileLabel(profile = {}) {
  return text(profile.display_name) || shortId(profile.user_id || profile.id);
}

function accessProfileLabel(access = {}) {
  return profileLabel(access.profile || { id: access.profile_id, user_id: access.user_id });
}

function Field({ children, label }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {COURSE_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>{status.label}</option>
      ))}
    </select>
  );
}

export default function AdminCoursesPanel({ session }) {
  const [courses, setCourses] = useState([]);
  const [steps, setSteps] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [accessRows, setAccessRows] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStepId, setSelectedStepId] = useState("");
  const [courseForm, setCourseForm] = useState(() => createEmptyCourseForm());
  const [stepForm, setStepForm] = useState(() => createEmptyCourseStepForm());
  const [lessonForm, setLessonForm] = useState(() => createEmptyCourseLessonForm());
  const [accessForm, setAccessForm] = useState(EMPTY_ACCESS_FORM);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );
  const selectedStep = useMemo(
    () => steps.find((step) => step.id === selectedStepId) || null,
    [steps, selectedStepId]
  );

  const refreshCourses = async () => {
    const rows = await listAdminCourses(session);
    setCourses(rows);
    setSelectedCourseId((current) => rows.some((course) => course.id === current) ? current : rows[0]?.id || "");
    if (rows[0] && !selectedCourseId) setCourseForm(createEmptyCourseForm(rows[0]));
    return rows;
  };

  const refreshSteps = async (courseId = selectedCourseId) => {
    if (!courseId) {
      setSteps([]);
      setSelectedStepId("");
      return [];
    }
    const rows = await listAdminCourseSteps(courseId, session);
    setSteps(rows);
    setSelectedStepId((current) => rows.some((step) => step.id === current) ? current : rows[0]?.id || "");
    return rows;
  };

  const refreshLessons = async (courseId = selectedCourseId, stepId = selectedStepId) => {
    if (!courseId || !stepId) {
      setLessons([]);
      return [];
    }
    const rows = await listAdminCourseLessons(courseId, stepId, session);
    setLessons(rows);
    return rows;
  };

  const refreshAccess = async () => {
    const rows = await listAdminCourseAccess(session);
    setAccessRows(rows);
    return rows;
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      if (!session?.access_token) return;
      setStatus("loading");
      setError("");
      try {
        const [courseRows, profileRows, accessList] = await Promise.all([
          listAdminCourses(session),
          listCourseAccessProfiles(session),
          listAdminCourseAccess(session)
        ]);
        if (cancelled) return;
        setCourses(courseRows);
        setProfiles(profileRows);
        setAccessRows(accessList);
        const course = courseRows[0] || null;
        setSelectedCourseId(course?.id || "");
        setCourseForm(createEmptyCourseForm(course || {}));
        setAccessForm((current) => ({
          ...current,
          profile_id: profileRows[0]?.id || "",
          user_id: profileRows[0]?.user_id || "",
          course_id: course?.id || ""
        }));
        setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setStatus("needs-verification");
          setError(err.message || "Не удалось загрузить курсы.");
        }
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    async function loadSteps() {
      if (!session?.access_token || !selectedCourseId) {
        setSteps([]);
        setSelectedStepId("");
        return;
      }
      try {
        const rows = await listAdminCourseSteps(selectedCourseId, session);
        if (cancelled) return;
        setSteps(rows);
        setSelectedStepId((current) => rows.some((step) => step.id === current) ? current : rows[0]?.id || "");
        setStepForm(createEmptyCourseStepForm(rows[0] || { course_id: selectedCourseId }));
        setLessonForm(createEmptyCourseLessonForm({ course_id: selectedCourseId, step_id: rows[0]?.id || "" }));
        setAccessForm((current) => ({ ...current, course_id: selectedCourseId, step_id: "" }));
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить ступени курса.");
      }
    }
    void loadSteps();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, session]);

  useEffect(() => {
    let cancelled = false;
    async function loadLessons() {
      if (!session?.access_token || !selectedCourseId || !selectedStepId) {
        setLessons([]);
        return;
      }
      try {
        const rows = await listAdminCourseLessons(selectedCourseId, selectedStepId, session);
        if (cancelled) return;
        setLessons(rows);
        setLessonForm(createEmptyCourseLessonForm(rows[0] || { course_id: selectedCourseId, step_id: selectedStepId }));
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить уроки ступени.");
      }
    }
    void loadLessons();
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, selectedStepId, session]);

  const setCourseField = (field, value) => setCourseForm((current) => ({ ...current, [field]: value }));
  const setStepField = (field, value) => setStepForm((current) => ({ ...current, [field]: value }));
  const setLessonField = (field, value) => setLessonForm((current) => ({ ...current, [field]: value }));
  const setAccessField = (field, value) => {
    if (field === "profile_id") {
      const profile = profiles.find((item) => item.id === value);
      setAccessForm((current) => ({ ...current, profile_id: value, user_id: profile?.user_id || "" }));
      return;
    }
    if (field === "access_scope") {
      setAccessForm((current) => ({ ...current, access_scope: value, step_id: value === "course" ? "" : current.step_id }));
      return;
    }
    setAccessForm((current) => ({ ...current, [field]: value }));
  };

  const handleCourseSelect = (courseId) => {
    const course = courses.find((item) => item.id === courseId);
    setSelectedCourseId(courseId);
    setCourseForm(createEmptyCourseForm(course || {}));
    setMessage("");
    setError("");
  };

  const handleStepSelect = (stepId) => {
    const step = steps.find((item) => item.id === stepId);
    setSelectedStepId(stepId);
    setStepForm(createEmptyCourseStepForm(step || { course_id: selectedCourseId }));
    setLessonForm(createEmptyCourseLessonForm({ course_id: selectedCourseId, step_id: stepId }));
    setMessage("");
    setError("");
  };

  const handleLessonSelect = (lesson) => {
    setLessonForm(createEmptyCourseLessonForm(lesson || { course_id: selectedCourseId, step_id: selectedStepId }));
    setMessage("Урок выбран для редактирования.");
  };

  const handleCourseSave = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      const saved = courseForm.id
        ? await updateCourse(courseForm.id, courseForm, session)
        : await createCourse(courseForm, session);
      await refreshCourses();
      setSelectedCourseId(saved?.id || "");
      setCourseForm(createEmptyCourseForm(saved || {}));
      setMessage(courseForm.id ? "Курс обновлён." : "Курс создан.");
      setStatus("success");
    } catch (err) {
      setStatus("needs-verification");
      setError(err.message || "Курс не сохранился.");
    }
  };

  const handleStepSave = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) {
      setError("Сначала выберите курс.");
      return;
    }
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      const payload = { ...stepForm, course_id: selectedCourseId };
      const saved = stepForm.id
        ? await updateCourseStep(stepForm.id, payload, session)
        : await createCourseStep(payload, session);
      await refreshSteps(selectedCourseId);
      setSelectedStepId(saved?.id || "");
      setStepForm(createEmptyCourseStepForm(saved || { course_id: selectedCourseId }));
      setMessage(stepForm.id ? "Ступень обновлена." : "Ступень создана.");
      setStatus("success");
    } catch (err) {
      setStatus("needs-verification");
      setError(err.message || "Ступень не сохранилась.");
    }
  };

  const handleLessonSave = async (event) => {
    event.preventDefault();
    if (!selectedCourseId || !selectedStepId) {
      setError("Сначала выберите курс и ступень.");
      return;
    }
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      const payload = { ...lessonForm, course_id: selectedCourseId, step_id: selectedStepId };
      const saved = lessonForm.id
        ? await updateCourseLesson(lessonForm.id, payload, session)
        : await createCourseLesson(payload, session);
      await refreshLessons(selectedCourseId, selectedStepId);
      setLessonForm(createEmptyCourseLessonForm(saved || { course_id: selectedCourseId, step_id: selectedStepId }));
      setMessage(lessonForm.id ? "Урок обновлён." : "Урок создан.");
      setStatus("success");
    } catch (err) {
      setStatus("needs-verification");
      setError(err.message || "Урок не сохранился.");
    }
  };

  const handleGrantAccess = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      await grantCourseAccess({
        ...accessForm,
        course_id: selectedCourseId || accessForm.course_id,
        step_id: accessForm.access_scope === "step" ? accessForm.step_id || selectedStepId : ""
      }, session);
      await refreshAccess();
      setMessage("Доступ выдан.");
      setStatus("success");
    } catch (err) {
      setStatus("needs-verification");
      setError(err.message || "Доступ не выдан.");
    }
  };

  const handleRevokeAccess = async (accessId) => {
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      await revokeCourseAccess(accessId, session);
      await refreshAccess();
      setMessage("Доступ закрыт.");
      setStatus("success");
    } catch (err) {
      setStatus("needs-verification");
      setError(err.message || "Доступ не закрыт.");
    }
  };

  return (
    <section className="cabinetCard adminCoursesPanel" aria-label="Курсы и доступы">
      <div className="cabinetFormHeader">
        <div>
          <p className="cabinetEyebrow">private courses MVP</p>
          <h2>Курсы и доступы</h2>
        </div>
        <span className="cabinetStatus">{status}</span>
      </div>

      {error && <div className="cabinetError">{error}</div>}
      {message && <div className="cabinetSuccess">{message}</div>}

      <div className="adminCoursesGrid">
        <form className="adminCoursesBlock" onSubmit={handleCourseSave}>
          <div className="cabinetFormHeader">
            <h3>Курс</h3>
            <button className="cabinetGhost" type="button" onClick={() => setCourseForm(createEmptyCourseForm())}>Новый</button>
          </div>
          <Field label="Выбрать курс">
            <select value={selectedCourseId} onChange={(event) => handleCourseSelect(event.target.value)}>
              <option value="">Нет курса</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title || "Без названия"} · {courseStatusText(course.status)}</option>
              ))}
            </select>
          </Field>
          <div className="cabinetTwoColumns">
            <Field label="Название">
              <input required value={courseForm.title} onChange={(event) => setCourseField("title", event.target.value)} />
            </Field>
            <Field label="Slug">
              <input value={courseForm.slug || ""} onChange={(event) => setCourseField("slug", event.target.value)} placeholder="reiki-yggdrasil" />
            </Field>
          </div>
          <Field label="Описание">
            <textarea rows={3} value={courseForm.description} onChange={(event) => setCourseField("description", event.target.value)} />
          </Field>
          <div className="cabinetTwoColumns">
            <Field label="Cover URL">
              <input value={courseForm.cover_url} onChange={(event) => setCourseField("cover_url", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Позиция">
              <input type="number" value={courseForm.position} onChange={(event) => setCourseField("position", event.target.value)} />
            </Field>
          </div>
          <Field label="Статус">
            <StatusSelect value={courseForm.status} onChange={(value) => setCourseField("status", value)} />
          </Field>
          <button className="cabinetPrimary" type="submit">{courseForm.id ? "Сохранить курс" : "Создать курс"}</button>
        </form>

        <form className="adminCoursesBlock" onSubmit={handleStepSave}>
          <div className="cabinetFormHeader">
            <h3>Ступень</h3>
            <button className="cabinetGhost" type="button" onClick={() => setStepForm(createEmptyCourseStepForm({ course_id: selectedCourseId }))}>Новая</button>
          </div>
          <Field label="Выбрать ступень">
            <select value={selectedStepId} onChange={(event) => handleStepSelect(event.target.value)} disabled={!selectedCourseId}>
              <option value="">Нет ступени</option>
              {steps.map((step) => (
                <option key={step.id} value={step.id}>{step.title || "Ступень"} · {courseStatusText(step.status)}</option>
              ))}
            </select>
          </Field>
          <Field label="Название">
            <input required value={stepForm.title} onChange={(event) => setStepField("title", event.target.value)} />
          </Field>
          <Field label="Описание">
            <textarea rows={3} value={stepForm.description} onChange={(event) => setStepField("description", event.target.value)} />
          </Field>
          <div className="cabinetTwoColumns">
            <Field label="Позиция">
              <input type="number" value={stepForm.position} onChange={(event) => setStepField("position", event.target.value)} />
            </Field>
            <Field label="Статус">
              <StatusSelect value={stepForm.status} onChange={(value) => setStepField("status", value)} />
            </Field>
          </div>
          <button className="cabinetPrimary" type="submit" disabled={!selectedCourseId}>{stepForm.id ? "Сохранить ступень" : "Создать ступень"}</button>
        </form>

        <form className="adminCoursesBlock adminLessonEditor" onSubmit={handleLessonSave}>
          <div className="cabinetFormHeader">
            <h3>Урок</h3>
            <button className="cabinetGhost" type="button" onClick={() => setLessonForm(createEmptyCourseLessonForm({ course_id: selectedCourseId, step_id: selectedStepId }))}>Новый</button>
          </div>
          <div className="adminCoursePillList">
            {lessons.map((lesson) => (
              <button className={lesson.id === lessonForm.id ? "cabinetPrimary" : "cabinetSecondary"} key={lesson.id} type="button" onClick={() => handleLessonSelect(lesson)}>
                {lesson.title || "Урок"} · {courseStatusText(lesson.status)}
              </button>
            ))}
            {lessons.length === 0 && <span className="cabinetStatus">уроков пока нет</span>}
          </div>
          <Field label="Название">
            <input required value={lessonForm.title} onChange={(event) => setLessonField("title", event.target.value)} />
          </Field>
          <Field label="Текст урока">
            <textarea rows={5} value={lessonForm.body} onChange={(event) => setLessonField("body", event.target.value)} />
          </Field>
          <div className="cabinetTwoColumns">
            <Field label="Video URL">
              <input value={lessonForm.video_url} onChange={(event) => setLessonField("video_url", event.target.value)} placeholder="YouTube / Vimeo / public URL" />
            </Field>
            <Field label="Audio URL">
              <input value={lessonForm.audio_url} onChange={(event) => setLessonField("audio_url", event.target.value)} placeholder="https://...mp3" />
            </Field>
          </div>
          <div className="cabinetTwoColumns">
            <Field label="Позиция">
              <input type="number" value={lessonForm.position} onChange={(event) => setLessonField("position", event.target.value)} />
            </Field>
            <Field label="Статус">
              <StatusSelect value={lessonForm.status} onChange={(value) => setLessonField("status", value)} />
            </Field>
          </div>
          <button className="cabinetPrimary" type="submit" disabled={!selectedCourseId || !selectedStepId}>{lessonForm.id ? "Сохранить урок" : "Создать урок"}</button>
        </form>

        <form className="adminCoursesBlock" onSubmit={handleGrantAccess}>
          <h3>Доступ мастера</h3>
          <Field label="Мастер">
            <select value={accessForm.profile_id} onChange={(event) => setAccessField("profile_id", event.target.value)}>
              <option value="">Выберите мастера</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profileLabel(profile)} · {shortId(profile.user_id)}</option>
              ))}
            </select>
          </Field>
          <Field label="Курс">
            <select value={selectedCourseId} onChange={(event) => handleCourseSelect(event.target.value)}>
              <option value="">Выберите курс</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title || "Без названия"}</option>
              ))}
            </select>
          </Field>
          <Field label="Тип доступа">
            <select value={accessForm.access_scope} onChange={(event) => setAccessField("access_scope", event.target.value)}>
              {COURSE_ACCESS_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </select>
          </Field>
          {accessForm.access_scope === "step" && (
            <Field label="Ступень">
              <select value={accessForm.step_id || selectedStepId} onChange={(event) => setAccessField("step_id", event.target.value)}>
                <option value="">Выберите ступень</option>
                {steps.map((step) => (
                  <option key={step.id} value={step.id}>{step.title || "Ступень"}</option>
                ))}
              </select>
            </Field>
          )}
          <button className="cabinetPrimary" type="submit">Выдать доступ</button>
          <div className="cabinetNotice compactNotice">
            <b>Модель доступа:</b>
            <p>Весь курс = `access_scope=course` и `step_id=null`. Ступень = `access_scope=step` и выбранная ступень. Уроки наследуют доступ от ступени.</p>
          </div>
        </form>
      </div>

      <div className="adminCoursesAccessList">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">текущие доступы</p>
            <h3>Список доступов</h3>
          </div>
          <span className="cabinetStatus">{accessRows.length}</span>
        </div>
        {accessRows.length === 0 && <div className="cabinetNotice">Доступы ещё не выдавались.</div>}
        {accessRows.map((access) => (
          <article className="cabinetCard adminCourseAccessRow" key={access.id}>
            <div>
              <h4>{accessProfileLabel(access)}</h4>
              <p>{access.course?.title || selectedCourse?.title || access.course_id}</p>
              <small>{access.access_scope === "course" ? "Весь курс" : access.step?.title || access.step_id}</small>
            </div>
            <div className="adminAccessMeta">
              <span className="cabinetStatus">{courseAccessScopeText(access.access_scope)}</span>
              <span className={`cabinetStatus status-${access.status}`}>{courseAccessStatusText(access.status)}</span>
            </div>
            {access.status === "active" && (
              <button className="cabinetSecondary" type="button" onClick={() => handleRevokeAccess(access.id)}>Закрыть доступ</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
