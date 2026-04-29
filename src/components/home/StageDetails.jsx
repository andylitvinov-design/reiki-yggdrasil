import React from "react";
import { Link } from "react-router-dom";

export function StageDetails({ currentModule, currentStage, isModuleOverview, mode = "overview", onSelectStage, onStartPractice }) {
  const infoTitle = isModuleOverview ? "Ступени уровня" : "Настройки";
  const infoList = isModuleOverview ? currentModule.stages.map((stage) => stage.navLabel) : currentStage.opens;
  const practiceTitle = isModuleOverview ? "Ключевые акценты уровня" : "Практики и акценты";
  const practiceList = isModuleOverview ? currentModule.overview.highlights : currentStage.skills;
  const resultText = isModuleOverview ? currentModule.overview.summary : currentStage.result;
  const crumb = isModuleOverview
    ? `Уровень ${currentModule.index} · ${currentModule.name} · Обзор`
    : `Уровень ${currentModule.index} · ${currentModule.name} · ${currentStage.label}`;
  const heading = isModuleOverview ? `Уровень ${currentModule.index}` : currentStage.label;
  const title = isModuleOverview ? currentModule.overview.title : currentStage.title;
  const intro = isModuleOverview ? currentModule.overview.summary : currentStage.intro;
  const practiceLeadText = isModuleOverview
    ? "Откроем правую панель в режиме обзора уровня, покажем перечень ступеней и общий вектор практики."
    : "Откроем правую панель в режиме практики, покажем ключевые настройки ступени и направим в кабинет для следующего шага.";
  const buttonText = isModuleOverview ? "Открыть обзор практики уровня" : "Начать практику выбранной ступени";
  const detailsText = isModuleOverview ? currentModule.overview.summary : currentStage.meaning;
  const materials = isModuleOverview
    ? currentModule.stages.map((stage) => `${stage.label}: ${stage.navLabel}`)
    : [...currentStage.opens, ...currentStage.skills];

  return (
    <section className={mode === "details" ? "stageCard stageCardDetails" : "stageCard"}>
      <div className="stageHero">
        <div className="stageCopy">
          <p className="crumb">{crumb}</p>
          <h2>{heading}</h2>
          <h3>{title}</h3>
          <p className="introText">{intro}</p>
          <div className="stageStepsList" aria-label={`Перечень ступеней уровня ${currentModule.index}`}>
            <b>Ступени уровня</b>
            <ol>
              {currentModule.stages.map((stage) => {
                const isActive = currentStage?.order === stage.order;

                return (
                  <li key={`${currentModule.id}-list-${stage.order}`}>
                    <a
                      className={isActive ? "active" : ""}
                      href={`#${currentModule.id}-${stage.order}`}
                      onClick={(event) => {
                        event.preventDefault();
                        onSelectStage(currentModule.id, stage.order);
                      }}
                    >
                      <span>{stage.label || `Ступень ${stage.order}`}</span>
                      {stage.navLabel || stage.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div className="treeMedallion">
          <span>♣</span>
        </div>
      </div>

      {mode === "details" ? (
        <div className="detailsLayout">
          <article className="detailsTextCard">
            <b>Подробное описание</b>
            <p>{detailsText}</p>
            {!isModuleOverview && <p>{currentStage.result}</p>}
          </article>

          <article className="detailsVideoCard">
            <div className="videoGlyph">▶</div>
            <div>
              <b>Видео и источник ступени</b>
              <p>
                Отдельные видео по ступеням пока не заведены в данных. Здесь закреплён источник модуля и переход в
                кабинет для доступа к материалам.
              </p>
              <div className="detailsActions">
                <a className="btnLike dark" href={currentModule.source} rel="noreferrer" target="_blank">
                  Открыть источник
                </a>
                <Link className="btnLike" to="/profile">
                  Открыть кабинет
                </Link>
              </div>
            </div>
          </article>

          <article className="detailsMaterialsCard">
            <b>Материалы ступени</b>
            <ul>
              {materials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      ) : (
        <>
          <div className="videoSettingsCard">
            <button type="button" onClick={onStartPractice}>
              {buttonText}
            </button>
          </div>

          <div className="practiceLead">
            <div className="practiceLeadCard">
              <b>Практический сценарий</b>
              <p>{practiceLeadText}</p>
            </div>
            <div className="practiceLeadCard accent">
              <b>Источник модуля</b>
              <a href={currentModule.source} rel="noreferrer" target="_blank">
                Открыть описание {currentModule.name}
              </a>
            </div>
          </div>

          <div className="infoGrid">
            <Info title="Смысл этапа" text={isModuleOverview ? currentModule.overview.summary : currentStage.meaning} />
            <Info title={infoTitle} list={infoList} />
          </div>

          <div className="infoGrid framed">
            <Info title={practiceTitle} list={practiceList} />
            <Info title="Результат" text={resultText} />
          </div>
        </>
      )}
    </section>
  );
}

function Info({ title, text, list }) {
  return (
    <div className="infoBox">
      <h4>✦ {title}</h4>
      {text && <p>{text}</p>}
      {list && (
        <ul>
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
