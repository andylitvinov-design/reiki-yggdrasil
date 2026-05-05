import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  practiceExercises,
  reikiLevels,
  reikiKnowledgeMeta,
  rightPanelTabs,
  settingsSources,
  studentCollections
} from "./data/reikiKnowledgeBase.js";
import "./index.css";

function App() {
  const [selectedStepId, setSelectedStepId] = useState("RY-L01-S03");
  const [openLevelId, setOpenLevelId] = useState(1);
  const [tab, setTab] = useState("exercises");

  const selectedLevel = reikiLevels.find((level) => level.steps.some((item) => item.id === selectedStepId)) ?? reikiLevels[0];
  const current = selectedLevel.steps.find((item) => item.id === selectedStepId) ?? reikiLevels[0].steps[0];

  const cards = useMemo(() => {
    if (tab === "mandalas") return studentCollections.mandalas;
    if (tab === "artifacts") return studentCollections.artifacts;
    return studentCollections.mandalas;
  }, [tab]);

  return (
    <div className="appShell">
      <div className="pianoStrings" />

      <header className="topbar">
        <div className="brandBlock">
          <div className="logoSeal">♣</div>
          <div>
            <h1>Рейки Иггдрасиль</h1>
            <p>Путь поиска · древние традиции · сокровища</p>
          </div>
        </div>

        <nav className="mainNav">
          <span>Главная</span>
          <span className="activeNav">О системе</span>
          <span>Уровни</span>
          <span>Настройки</span>
          <span>Практика</span>
          <span>Мастера</span>
        </nav>

        <div className="userTools">
          <span>⌕</span>
          <span>◦</span>
          <span>☰</span>
          <strong>Путник</strong>
        </div>
      </header>

      <main className="dashboard">
        <aside className="leftPiano">
          <div className="panelTitle">Уровни и ступени</div>

          {reikiLevels.map((level) => {
            const isOpen = openLevelId === level.id;
            return (
              <div className="levelGroup" key={level.id}>
                <button className={level.id === 1 ? "rootLevel" : "closedLevel"} onClick={() => setOpenLevelId(isOpen ? null : level.id)}>
                  <b>{level.id}</b>
                  <span>
                    <strong>Уровень · {level.name}</strong>
                    <small>{level.steps.length} ступеней</small>
                  </span>
                  <em>{isOpen ? "⌃" : "⌄"}</em>
                </button>

                {isOpen && (
                  <div className="keysList">
                    {level.steps.map((item) => (
                      <button
                        key={item.id}
                        className={selectedStepId === item.id ? "pianoKey selected" : "pianoKey"}
                        onClick={() => setSelectedStepId(item.id)}
                        title={`${item.id} · ${item.contentStatus}`}
                      >
                        <i />
                        <b>{item.number}</b>
                        <span>{item.title}</span>
                        {selectedStepId === item.id && <strong className="glowRune">✧</strong>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="sideActions">
            <div className="promoRune">♧</div>
            <p>Пройти Практикум по РИ БЕСПЛАТНО</p>
          </div>
        </aside>

        <section className="stageCard">
          <div className="stageHero">
            <div className="stageCopy">
              <p className="crumb">
                {selectedLevel.id} уровень · {selectedLevel.name} · Ступень {current.number}
              </p>
              <h2>{current.number} ступень</h2>
              <h3>{current.title}</h3>
              <p className="introText">{current.intro}</p>
              {current.contentStatus === "needs_content" && (
                <p className="contentNotice">Материал помечен как needs_content: требуется авторское заполнение.</p>
              )}
            </div>
            <div className="treeMedallion">
              <span>♣</span>
            </div>
          </div>

          <div className="videoSettingsCard">
            <button type="button">Смотреть видео и описание настроек ступени</button>
          </div>

          <div className="infoGrid">
            <Info title="Смысл ступени" text={current.meaning} />
            <Info title="Что открывает" list={current.opens} />
          </div>

          <div className="infoGrid framed">
            <Info title="Ключевые навыки" list={current.skills} />
            <Info title="Результат" text={current.result} />
          </div>

          <div className="knowledgeMeta">
            <b>База знаний:</b> {reikiKnowledgeMeta.totalLevels} уровней · {reikiKnowledgeMeta.totalSteps} ступеней · {reikiKnowledgeMeta.status}
          </div>
        </section>

        <aside className="practicePanel">
          <div className="tabs">
            {rightPanelTabs.map(([id, label]) => (
              <button key={id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {(tab === "exercises" || tab === "masters") && (
            <>
              <div className="exerciseList">
                {practiceExercises.map((item) => (
                  <Exercise item={item} key={item.title} />
                ))}
              </div>
              <button className="allExercises">Все упражнения →</button>

              <div className="masterInvite">
                <div className="profileIcon">◎</div>
                <div>
                  <b>Создай свой профиль мастера</b>
                  <p>
                    Размещай практики, мандалы и артефакты. Получай обратную связь и развивайся вместе с
                    сообществом.
                  </p>
                  <button>Создать профиль</button>
                </div>
              </div>

              <CollectionBlock title="Мандалы студентов" cards={studentCollections.mandalas} />
              <CollectionBlock title="Артефакты студентов" cards={studentCollections.artifacts} />
            </>
          )}

          {(tab === "mandalas" || tab === "artifacts") && (
            <CollectionBlock title={tab === "mandalas" ? "Мандалы студентов" : "Артефакты студентов"} cards={cards} />
          )}

          {tab === "settings" && (
            <div className="settingsPanel">
              <h3>Настройки: источники</h3>
              <ul>
                {settingsSources.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function CollectionBlock({ title, cards }) {
  return (
    <div className="collectionBlock">
      <div className="pubHeader">
        <b>{title}</b>
        <a>Смотреть все →</a>
      </div>
      <div className="publicationGrid">
        {cards.map((card, index) => (
          <Publication card={card} index={index} key={card.title} />
        ))}
      </div>
    </div>
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

function Exercise({ item }) {
  return (
    <div className="exerciseCard">
      <div className="exercisePreview" />
      <div className="exerciseText">
        <b>{item.title}</b>
        <p>{item.text}</p>
        <small>◷ {item.time}</small>
      </div>
      <button className="play">▶</button>
    </div>
  );
}

function Publication({ card, index }) {
  return (
    <div className="publicationCard">
      <div className={`publicationImage variant${index + 1}`} />
      <b>{card.title}</b>
      <small>
        {card.author} · ♥ {card.likes}
      </small>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
