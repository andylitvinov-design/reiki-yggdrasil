import React from "react";

function text(value) {
  return String(value || "").trim();
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(text(value));
}

function isPrivateOrSignedUrl(value) {
  const normalized = text(value).toLowerCase();
  return (
    normalized.startsWith("storage://") ||
    normalized.includes("profile-cabinet-media") ||
    normalized.includes("/storage/v1/object/sign") ||
    normalized.includes("signedurl") ||
    normalized.includes("signed_url") ||
    normalized.includes("access_token") ||
    normalized.includes("bearer")
  );
}

function safeExternalUrl(value) {
  const url = text(value);
  if (!isHttpUrl(url) || isPrivateOrSignedUrl(url)) return "";
  return url;
}

function safeResolvedAudioUrl(value) {
  const url = text(value);
  return isHttpUrl(url) ? url : "";
}

function safeVideoEmbedUrl(value) {
  const source = safeExternalUrl(value);
  if (!source) return "";

  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return url.toString();
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
    }

    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).at(-1);
      return /^\d+$/.test(id || "") ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function LessonMedia({ lesson }) {
  const videoUrl = safeExternalUrl(lesson?.video_url);
  const embedUrl = safeVideoEmbedUrl(videoUrl);
  const audioUrl = safeResolvedAudioUrl(lesson?.audio_display_url) || safeExternalUrl(lesson?.audio_url);
  const hasPrivateAudio = Boolean(lesson?.audio_storage_path || text(lesson?.audio_url).startsWith("storage://"));

  return (
    <div className="courseLessonMedia">
      {embedUrl && (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          src={embedUrl}
          title={`Видео урока: ${lesson.title || "курс"}`}
        />
      )}
      {!embedUrl && videoUrl && (
        <a className="cabinetSecondary courseMediaLink" href={videoUrl} rel="noreferrer" target="_blank">
          Открыть видео
        </a>
      )}
      {audioUrl && (
        <audio controls preload="metadata" src={audioUrl}>
          Ваш браузер не поддерживает аудио.
        </audio>
      )}
      {!audioUrl && hasPrivateAudio && (
        <div className="cabinetNotice compactNotice">{lesson.audio_display_error || "Аудио пока недоступно. Проверьте доступ или Storage/RLS."}</div>
      )}
      {!audioUrl && !hasPrivateAudio && (
        <div className="cabinetNotice compactNotice">Аудио пока не добавлено.</div>
      )}
    </div>
  );
}

export default function ProfileLiteCoursesModule({
  courses = [],
  coursesStatus = "idle",
  coursesError = "",
  selectedCourseId = "",
  courseSteps = [],
  selectedStepId = "",
  courseLessons = [],
  courseLessonsStatus = "idle",
  courseLessonsError = "",
  onCourseSelect,
  onStepSelect,
  profile
}) {
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0] || null;
  const selectedStep = courseSteps.find((step) => step.id === selectedStepId) || courseSteps[0] || null;

  return (
    <section className="profileLiteModule profileLiteCoursesModule mandalaWorkspace" aria-label="Курсы Академии">
      <div className="mandalaHero">
        <p className="cabinetEyebrow">личный доступ</p>
        <h2>Курсы Академии</h2>
        <p>Список доступных вам обучающих программ, ступеней и уроков.</p>
      </div>

      {coursesError && <div className="cabinetError">{coursesError}</div>}
      {courseLessonsError && <div className="cabinetError">{courseLessonsError}</div>}

      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar courseListColumn" aria-label="Доступные курсы">
          <div className="cabinetCard">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">курсы</p>
                <h3>Доступно</h3>
              </div>
              <span className="cabinetStatus">{coursesStatus}</span>
            </div>
            {courses.length === 0 && (
              <div className="cabinetNotice">
                <b>Курсы пока не открыты.</b>
                <p>Откройте пригласительную ссылку или попросите администратора выдать доступ к нужному курсу или ступени.</p>
              </div>
            )}
            {courses.map((course) => (
              <button
                className={course.id === selectedCourse?.id ? "cabinetPrimary courseListButton active" : "cabinetSecondary courseListButton"}
                key={course.id}
                type="button"
                onClick={() => onCourseSelect?.(course.id)}
              >
                <span>{course.title || "Без названия"}</span>
                {course.description && <small>{course.description}</small>}
              </button>
            ))}
          </div>
        </aside>

        <section className="workspaceCenterColumn courseCenterColumn" aria-label="Уроки курса">
          {!selectedCourse && (
            <div className="cabinetCard">
              <h3>Курсы пока не открыты.</h3>
              <p>После выдачи доступа здесь появятся опубликованные ступени и уроки.</p>
            </div>
          )}

          {selectedCourse && (
            <>
              <article className="cabinetCard courseIntroCard">
                <p className="cabinetEyebrow">курс</p>
                <h3>{selectedCourse.title}</h3>
                <p>{selectedCourse.description || "Описание курса готовится."}</p>
              </article>

              <div className="cabinetCard">
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">ступени</p>
                    <h3>Доступные разделы</h3>
                  </div>
                  <span className="cabinetStatus">{courseSteps.length}</span>
                </div>
                {courseSteps.length === 0 && <div className="cabinetNotice">Для этого курса пока нет доступных ступеней.</div>}
                <div className="courseStepList">
                  {courseSteps.map((step) => (
                    <button
                      className={step.id === selectedStep?.id ? "cabinetPrimary active" : "cabinetSecondary"}
                      key={step.id}
                      type="button"
                      onClick={() => onStepSelect?.(step.id)}
                    >
                      <span>{step.title || "Ступень"}</span>
                      {step.description && <small>{step.description}</small>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cabinetCard courseLessonsCard">
                <div className="cabinetFormHeader">
                  <div>
                    <p className="cabinetEyebrow">уроки</p>
                    <h3>{selectedStep?.title || "Выберите ступень"}</h3>
                  </div>
                  <span className="cabinetStatus">{courseLessonsStatus}</span>
                </div>
                {courseLessons.length === 0 && <div className="cabinetNotice">Уроки для этой ступени готовятся.</div>}
                {courseLessons.map((lesson) => (
                  <article className="courseLessonCard" key={lesson.id}>
                    <div>
                      <p className="cabinetEyebrow">урок</p>
                      <h4>{lesson.title || "Без названия"}</h4>
                    </div>
                    {lesson.body && <p className="courseLessonBody">{lesson.body}</p>}
                    <LessonMedia lesson={lesson} />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="workspaceRightColumn courseHelpColumn" aria-label="Доступ к курсам">
          <div className="cabinetCard">
            <p className="cabinetEyebrow">доступ</p>
            <h3>Индивидуальный доступ</h3>
            <p>Курсы открываются персонально для вашего кабинета. Доступ может быть ко всему курсу или к отдельной ступени.</p>
            <div className="cabinetNotice">
              <b>{profile?.display_name || "Профиль мастера"}</b>
              <p>Если нужного урока нет, попросите администратора проверить доступ к курсу или ступени.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
