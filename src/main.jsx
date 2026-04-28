import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const levels = [
  { id: 1, name: "Корни", count: 5, steps: ["Основа", "Поток", "Настройка", "Очищение", "Заземление"] },
  { id: 2, name: "Ствол", count: 6 },
  { id: 3, name: "Ветви", count: 6 },
  { id: 4, name: "Листья", count: 6 },
  { id: 5, name: "Цветы", count: 6 },
  { id: 6, name: "Плоды", count: 6 }
];

const stepContent = {
  1: {
    title: "Основа",
    intro: "Вы входите в систему, знакомитесь с картой пути и базовыми принципами Рейки Иггдрасиль.",
    meaning: "Здесь появляется первое ощущение опоры, безопасности и направления движения.",
    opens: ["Понимание структуры пути", "Первичное заземление", "Контакт с символом Древа"],
    skills: ["Внимание к телу", "Наблюдение за состоянием", "Настройка дыхания"],
    result: "Система начинает восприниматься как карта личного движения."
  },
  2: {
    title: "Поток",
    intro: "Вы учитесь чувствовать движение энергии и замечать, где поток свободен, а где сжимается.",
    meaning: "Ступень переводит идею энергии в живой телесный опыт.",
    opens: ["Чувствительность к движению энергии", "Мягкое снятие напряжения", "Понимание ритма"],
    skills: ["Дыхание потока", "Сканирование тела", "Мягкое внимание"],
    result: "Энергия воспринимается не как абстракция, а как опыт."
  },
  3: {
    title: "Настройка",
    intro: "Вы начинаете слышать тонкие вибрации потока. Настройка соединяет вас с энергией Рейки Иггдрасиль.",
    meaning: "На этой ступени происходит тонкая настройка каналов восприятия и принятие энергии системы.",
    opens: ["Чувствительность к потокам", "Усиление интуиции", "Соединение с Древом"],
    skills: ["Настройка дыхания и внимания", "Ощущение потока в теле", "Работа в тишине"],
    result: "Вы становитесь проводником. Энергия течёт мягко и осознанно."
  },
  4: {
    title: "Очищение",
    intro: "Ступень посвящена освобождению от лишнего шума, старых эмоциональных следов и внутреннего напряжения.",
    meaning: "Очищение возвращает ясность, лёгкость и пространство для нового опыта.",
    opens: ["Снятие внутреннего напряжения", "Ясность восприятия", "Обновление состояния"],
    skills: ["Очищающее дыхание", "Работа с символом света", "Наблюдение за эмоциями"],
    result: "Появляется больше тишины, пространства и внутренней прозрачности."
  },
  5: {
    title: "Заземление",
    intro: "Эта ступень помогает закрепить опыт в теле, действиях и повседневной жизни.",
    meaning: "Заземление превращает практику в устойчивый навык.",
    opens: ["Стабильность", "Телесную опору", "Спокойное присутствие"],
    skills: ["Контакт со стопами", "Медленное дыхание", "Закрепление результата"],
    result: "Вы чувствуете больше устойчивости и спокойной силы."
  }
};

const settingsSources = [
  "https://psimaster.net/service?shs_term_node_tid_depth=12346",
  "https://psimaster.net/service?shs_term_node_tid_depth=12210",
  "https://psimaster.net/service?shs_term_node_tid_depth=12180",
  "https://psimaster.net/service?shs_term_node_tid_depth=12200",
  "https://psimaster.net/service?shs_term_node_tid_depth=12192",
  "https://psimaster.net/service?shs_term_node_tid_depth=12202"
];

const exercises = [
  { title: "Дыхание потока", text: "Настройтесь на естественное движение энергии.", time: "10 мин" },
  { title: "Внутреннее слышание", text: "Практика развития тонкого восприятия.", time: "15 мин" },
  { title: "Соединение с Древом", text: "Визуализация канала связи с Иггдрасилем.", time: "20 мин" }
];

const collections = {
  mandalas: [
    { title: "Мандала настройки", author: "Мария", likes: 24 },
    { title: "Мандала исцеления", author: "Анна", likes: 19 },
    { title: "Мандала потока", author: "Ирина", likes: 31 }
  ],
  artifacts: [
    { title: "Кулон Потока", author: "Алексей", likes: 18 },
    { title: "Амулет Древа", author: "Мария", likes: 27 },
    { title: "Печать Настройки", author: "Ирина", likes: 22 }
  ]
};

const tabs = [
  ["exercises", "Упражнения"],
  ["mandalas", "Мандалы"],
  ["artifacts", "Артефакты"],
  ["masters", "Мастера"],
  ["settings", "Настройки"]
];

function App() {
  const [step, setStep] = useState(3);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("exercises");

  const current = stepContent[step];
  const cards = useMemo(() => {
    if (tab === "mandalas") return collections.mandalas;
    if (tab === "artifacts") return collections.artifacts;
    return collections.mandalas;
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

          <button className="rootLevel" onClick={() => setOpen(!open)}>
            <b>1</b>
            <span>
              <strong>Уровень · Корни</strong>
              <small>5 ступеней</small>
            </span>
            <em>{open ? "⌃" : "⌄"}</em>
          </button>

          {open && (
            <div className="keysList">
              {levels[0].steps.map((name, index) => {
                const number = index + 1;
                return (
                  <button
                    key={name}
                    className={step === number ? "pianoKey selected" : "pianoKey"}
                    onClick={() => setStep(number)}
                  >
                    <i />
                    <b>{number}</b>
                    <span>{name}</span>
                    {step === number && <strong className="glowRune">✧</strong>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="closedLevels">
            {levels.slice(1).map((level) => (
              <button className="closedLevel" key={level.id}>
                <b>{level.id}</b>
                <span>
                  Уровень · {level.name}
                  <small>{level.count} ступеней</small>
                </span>
                <em>⌄</em>
              </button>
            ))}
          </div>

          <div className="sideActions">
            <div className="promoRune">♧</div>
            <p>Пройти Практикум по РИ БЕСПЛАТНО</p>
          </div>
        </aside>

        <section className="stageCard">
          <div className="stageHero">
            <div className="stageCopy">
              <p className="crumb">1 уровень · Корни · Ступень {step}</p>
              <h2>{step} ступень</h2>
              <h3>{current.title}</h3>
              <p className="introText">{current.intro}</p>
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
        </section>

        <aside className="practicePanel">
          <div className="tabs">
            {tabs.map(([id, label]) => (
              <button key={id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {(tab === "exercises" || tab === "masters") && (
            <>
              <div className="exerciseList">
                {exercises.map((item) => (
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

              <CollectionBlock title="Мандалы студентов" cards={collections.mandalas} />
              <CollectionBlock title="Артефакты студентов" cards={collections.artifacts} />
            </>
          )}

          {(tab === "mandalas" || tab === "artifacts") && <CollectionBlock title={tab === "mandalas" ? "Мандалы студентов" : "Артефакты студентов"} cards={cards} />}

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
