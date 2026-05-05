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

const PLACEHOLDER_TEXT = "Материал готовится. Скоро здесь появится авторское описание ступени.";
const KNOWLEDGE_STATUS_TEXT = "структура курса подтверждена, материалы дополняются";

function countLabel(count, singular, few, many) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return singular;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function publicText(value) {
  if (!value || value === "needs_content" || value === "needs verification") return PLACEHOLDER_TEXT;
  return value;
}

function publicList(items) {
  if (!Array.isArray(items) || items.length === 0 || items.every((item) => item === "needs_content" || item === "needs verification")) {
    return ["Материал готовится", "Требуется авторское заполнение"];
  }

  return items.map(publicText);
}

function stepLabel(step) {
  return step.label || "Ступень";
}

function levelCountText(level) {
  const base = level.stepLabel === "Уровень"
    ? countLabel(level.steps.length, "уровень", "уровня", "уровней")
    : countLabel(level.steps.length, "ступень", "ступени", "ступеней");

  return `${level.steps.length} ${base}`;
}

function publicStatus(value) {
  if (value === "needs_content") return "материал готовится";
  if (value === "needs verification") return "требуется проверка";
  return value || "материал готовится";
}

function App() {
  const [selectedStepId, setSelectedStepId] = useState("RY-L01-S01");
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
                    <strong>Уровень {level.id}. {level.name}</strong>
                    <small>{levelCountText(level)}</small>
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
                        title={`${item.id} · ${publicStatus(item.contentStatus)}`}
                      >
                        <i />
                        <b>{item.number}</b>
                        <span>
                          <strong className="keyLabel">{stepLabel(item)} {item.number}</strong>
                          <em className="keyTitle">{item.title}</em>
                        </span>
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
                Уровень {selectedLevel.id} · {selectedLevel.name} · {stepLabel(current)} {current.number}
              </p>
              <h2>{stepLabel(current)} {current.number}</h2>
              <h3>{current.title}</h3>
              <p className="introText">{publicText(current.intro)}</p>
              {current.contentStatus === "needs_content" && (
                <p className="contentNotice">Материал этой ступени готовится и ждёт авторского заполнения.</p>
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
            <Info title="Смысл ступени" text={publicText(current.meaning)} />
            <Info title="Что открывает" list={publicList(current.opens)} />
          </div>

          <div className="infoGrid framed">
            <Info title="Ключевые навыки" list={publicList(current.skills)} />
            <Info title="Результат" text={publicText(current.result)} />
          </div>

          <div className="knowledgeMeta">
            <b>База знаний:</b> {reikiKnowledgeMeta.totalLevels} уровней · {reikiKnowledgeMeta.totalSteps} ступеней · {KNOWLEDGE_STATUS_TEXT}
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
