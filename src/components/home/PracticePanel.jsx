import React from "react";
import { Link } from "react-router-dom";

export function PracticePanel({
  audioMeditations,
  audioError,
  audioReady,
  practiceItems,
  isModuleOverview,
  variant = "compact"
}) {
  return (
    <aside className={variant === "full" ? "practicePanel practicePanelFull" : "practicePanel"} id="practice-panel">
      <div className="practicePanelTitle">
        <span>{variant === "full" ? "Практика" : "Правое поле"}</span>
        <b>{isModuleOverview ? "Уровень" : "Ступень"}</b>
      </div>

      <AudioMeditations audioError={audioError} audioMeditations={audioMeditations} audioReady={audioReady} />
      <div className="practiceFlowHeader">
        <b>{isModuleOverview ? "Обзор практики уровня" : "Практический поток ступени"}</b>
        <p>
          {isModuleOverview
            ? "Публичная схема показывает состав уровня, его ступени и общий вектор практики перед переходом к деталям."
            : "Публичная схема показывает логику шага, а приватные действия продолжаются через кабинет мастера."}
        </p>
      </div>
      <div className="exerciseList">
        {practiceItems.slice(0, 3).map((item, index) => (
          <PracticeItem item={item} index={index} key={item.id} variant={variant} />
        ))}
      </div>
      <div className="practiceActions">
        <Link className="btnLike" to="/profile">
          Войти в кабинет
        </Link>
        <Link className="btnLike dark" to="/profile">
          Бесплатная Google-авторизация
        </Link>
      </div>
    </aside>
  );
}

function AudioMeditations({ audioMeditations = [], audioError, audioReady }) {
  if (!audioReady && audioMeditations.length === 0) return null;

  return (
    <div className="audioMeditations">
      <div className="audioMeditationsHeader">
        <b>Аудио-медитации</b>
        <span>{audioMeditations.length}/3</span>
      </div>
      {audioError && <p className="errorText">{audioError}</p>}
      {audioMeditations.length > 0 ? (
        <div className="audioMeditationGrid">
          {audioMeditations.map((item) => (
            <article className="audioMeditationCard" key={item.id}>
              <div className="audioMeditationMeta">
                <span>{categoryLabel(item.category)}</span>
              </div>
              <b>{item.title}</b>
              {item.description ? <p>{item.description}</p> : null}
              <audio controls preload="none" src={item.playbackUrl}>
                Ваш браузер не поддерживает аудио.
              </audio>
            </article>
          ))}
        </div>
      ) : (
        <p className="inlineNote">Аудио-медитации появятся здесь после загрузки в админке.</p>
      )}
    </div>
  );
}

function categoryLabel(category) {
  const labels = {
    practice: "Практика",
    mandala: "Мандала",
    artifact: "Артефакт",
    other: "Другое"
  };
  return labels[category] || "Практика";
}

function PracticeItem({ item, index, variant }) {
  const action = item.actionType === "external"
    ? (
        <a className="btnLike" href={item.actionHref} rel="noreferrer" target="_blank">
          {item.actionLabel}
        </a>
      )
    : (
        <Link className="btnLike" to={item.actionHref}>
          {item.actionLabel}
        </Link>
  );

  return (
    <div className={`exerciseCard practiceItemCard practiceTile step${index + 1} ${variant === "full" ? "large" : ""}`}>
      <div className="exercisePreview">
        <span>{index + 1}</span>
      </div>
      <div className="exerciseText">
        <b>{item.title}</b>
        <p>{item.text}</p>
        <small>{item.meta}</small>
      </div>
      <div className="practiceItemAction">{action}</div>
    </div>
  );
}
