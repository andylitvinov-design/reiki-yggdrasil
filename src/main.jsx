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

const exercises = [
  { title: "Дыхание потока", text: "Настройтесь на естественное движение энергии.", time: "10 мин", icon: "✦" },
  { title: "Внутреннее слышание", text: "Практика развития тонкого восприятия.", time: "15 мин", icon: "◈" },
  { title: "Соединение с Древом", text: "Визуализация канала связи с Иггдрасилем.", time: "20 мин", icon: "♧" }
];

const libraries = {
  exercises: [
    { title: "Мандала настройки", author: "Мария", label: "Мандала", likes: 24 },
    { title: "Кулон Потока", author: "Алексей", label: "Артефакт", likes: 18 },
    { title: "Практика заземления", author: "Ирина", label: "Практика", likes: 31 }
  ],
  mandalas: [
    { title: "Мандала настройки", author: "Мария", label: "Мандала", likes: 24 },
    { title: "Мандала исцеления", author: "Анна", label: "Мандала", likes: 19 },
    { title: "Мандала потока", author: "Ирина", label: "Мандала", likes: 31 }
  ],
  artifacts: [
    { title: "Кулон Потока", author: "Алексей", label: "Артефакт", likes: 18 },
    { title: "Амулет Древа", author: "Мария", label: "Артефакт", likes: 27 },
    { title: "Печать Настройки", author: "Ирина", label: "Артефакт", likes: 22 }
  ],
  masters: [
    { title: "Профиль мастера", author: "Арвист", label: "Мастер", likes: 45 },
    { title: "Практика ученика", author: "Светлана", label: "Практика", likes: 12 },
    { title: "Обратная связь", author: "Андрей", label: "Разбор", likes: 33 }
  ]
};

function App() {
  const [step, setStep] = useState(3);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("exercises");
  const current = stepContent[step];
  const cards = useMemo(() => libraries[tab] || libraries.exercises, [tab]);

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
          <span>О системе</span>
          <span className="activeNav">Уровни и ступени</span>
          <span>Практика</span>
          <span>Мастера</span>
          <span>Сообщество</span>
          <span>Библиотека</span>
        </nav>
        <div className="userTools">
          <span>⌕</span><span>◦</span><span>☰</span><strong>Путник</strong>
        </div>
      </header>

      <main className="dashboard">
        <aside className="leftPiano">
          <div className="panelTitle">Уровни и ступени</div>
          <button className="rootLevel" onClick={() => setOpen(!open)}>
            <b>1</b>
            <span><strong>Уровень · Корни</strong><small>5 ступеней</small></span>
            <em>{open ? "⌃" : "⌄"}</em>
          </button>

          {open && (
            <div className="keysList">
              {levels[0].steps.map((name, i) => {
                const number = i + 1;
                return (
                  <button key={name} className={step === number ? "pianoKey selected" : "pianoKey"} onClick={() => setStep(number)}>
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
            {levels.slice(1).map(level => (
              <button className="closedLevel" key={level.id}>
                <b>{level.id}</b>
                <span>Уровень · {level.name}<small>{level.count} ступеней</small></span>
                <em>⌄</em>
              </button>
            ))}
          </div>

          <div className="sideActions">
            <button>Карта пути</button>
            <button>Тест: определи ступень</button>
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
            <div className="treeMedallion"><span>♣</span></div>
          </div>

          <div className="pathProgress">
            <span>✦ Ты сейчас здесь</span>
            <span>Ступень {step} из 5</span>
            <div className="dots">{[1, 2, 3, 4, 5].map(n => <button key={n} className={n === step ? "dot active" : "dot"} onClick={() => setStep(n)} />)}</div>
          </div>

          <div className="infoGrid">
            <Info title="Смысл ступени" text={current.meaning} />
            <Info title="Что открывает" list={current.opens} />
          </div>

          <div className="infoGrid framed">
            <Info title="Ключевые навыки" list={current.skills} />
            <Info title="Результат" text={current.result} />
          </div>

          <div className="ctaRow">
            <button className="primaryCta">Пройти практику ступени <small>рекомендуется ежедневно</small></button>
            <button>Записаться на обучение</button>
            <button>Связаться в Telegram</button>
          </div>

          <div className="studentNote">
            <div><b>Опыт участников</b><span>23 комментария</span></div>
            <a>Написать свой опыт ✎</a>
            <p><strong>Светлана:</strong> После практики появилось ощущение тепла в руках и потока в позвоночнике. Благодарю!</p>
          </div>
        </section>

        <aside className="practicePanel">
          <h2>Практика</h2>
          <div className="tabs">
            {[ ["exercises", "Упражнения"], ["mandalas", "Мандалы"], ["artifacts", "Артефакты"], ["masters", "Мастера"] ].map(([id, label]) => (
              <button key={id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          <div className="exerciseList">
            {exercises.map(item => <Exercise item={item} key={item.title} />)}
          </div>
          <button className="allExercises">Все упражнения →</button>

          <div className="masterInvite">
            <div className="profileIcon">◎</div>
            <div>
              <b>Создай свой профиль мастера</b>
              <p>Размещай практики, мандалы и артефакты. Получай обратную связь и развивайся вместе с сообществом.</p>
              <button>Создать профиль</button>
            </div>
          </div>

          <div className="pubHeader"><b>Новые публикации</b><a>Смотреть все →</a></div>
          <div className="publicationGrid">
            {cards.map((card, index) => <Publication card={card} index={index} key={card.title} />)}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Info({ title, text, list }) {
  return (
    <div className="infoBox">
      <h4>✦ {title}</h4>
      {text && <p>{text}</p>}
      {list && <ul>{list.map(item => <li key={item}>{item}</li>)}</ul>}
    </div>
  );
}

function Exercise({ item }) {
  return (
    <div className="exerciseCard">
      <div className="exerciseIcon">{item.icon}</div>
      <div className="exerciseText"><b>{item.title}</b><p>{item.text}</p><small>◷ {item.time}</small></div>
      <button className="bookmark">⌑</button>
      <button className="play">▶</button>
    </div>
  );
}

function Publication({ card, index }) {
  return (
    <div className="publicationCard">
      <div className={`publicationImage variant${index + 1}`}><span>{card.label}</span></div>
      <b>{card.title}</b>
      <small>{card.author} · ♥ {card.likes}</small>
    </div>
  );
}

const css = `
:root{--ink:#17120c;--muted:#6f6254;--paper:#fbf5ea;--paper2:#f4eadb;--line:#e3c588;--gold:#b8791d;--gold2:#dda345;--dark:#11100e;--dark2:#050504}*{box-sizing:border-box}html,body,#root{min-height:100%;margin:0}body{font-family:Georgia,'Times New Roman',serif;background:radial-gradient(circle at 46% 12%,rgba(255,255,255,.92),transparent 36%),linear-gradient(180deg,#fbf6ee,#f2e7d6 70%,#ead9bf);color:var(--ink)}button{font-family:inherit;cursor:pointer}.appShell{min-height:100vh;position:relative;overflow-x:hidden}.appShell:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.04),transparent 20%,transparent 78%,rgba(92,64,25,.04));pointer-events:none}.pianoStrings{position:absolute;right:-20px;top:0;width:455px;height:100px;opacity:.32;background:repeating-linear-gradient(164deg,transparent 0,transparent 8px,rgba(135,86,24,.58) 9px,transparent 10px);filter:blur(.15px);pointer-events:none}.topbar{height:88px;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:0 clamp(18px,2vw,34px);border-bottom:1px solid rgba(203,152,64,.34);background:rgba(255,255,255,.68);backdrop-filter:blur(10px);position:relative;z-index:2}.brandBlock{display:flex;align-items:center;gap:14px;min-width:310px}.logoSeal{width:58px;height:58px;border-radius:50%;border:1px solid rgba(184,121,29,.55);display:flex;align-items:center;justify-content:center;color:#9a6517;background:rgba(255,255,255,.7);font-size:36px;box-shadow:0 7px 22px rgba(83,55,16,.1)}.brandBlock h1{margin:0;font-size:clamp(24px,2vw,31px);font-weight:500;letter-spacing:.6px;text-transform:uppercase}.brandBlock p{margin:3px 0 0;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:1.25px}.mainNav{display:flex;align-items:center;justify-content:center;gap:clamp(18px,2.1vw,38px);font-size:12px;text-transform:uppercase;letter-spacing:.9px;white-space:nowrap}.activeNav{color:var(--gold);border-bottom:1px solid var(--gold2);padding-bottom:8px}.userTools{display:flex;align-items:center;gap:14px;color:#251c13;min-width:150px;justify-content:flex-end}.userTools strong{font-size:12px;text-transform:uppercase;letter-spacing:.8px}.dashboard{position:relative;z-index:1;display:grid;grid-template-columns:minmax(280px,320px) minmax(470px,1fr) minmax(360px,480px);gap:16px;max-width:1680px;margin:10px auto 26px;padding:0 clamp(10px,1vw,18px)}.leftPiano,.stageCard,.practicePanel{border-radius:26px;border:1px solid rgba(203,152,64,.42);box-shadow:0 14px 42px rgba(79,54,18,.12);position:relative}.leftPiano{background:linear-gradient(180deg,#171716,#0d0d0c);color:#fff4d7;padding:14px;min-height:calc(100vh - 112px);overflow:hidden}.leftPiano:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 0 28%,rgba(245,158,11,.26),transparent 29%),linear-gradient(90deg,rgba(255,255,255,.06),transparent 34%);pointer-events:none}.leftPiano:after{content:"";position:absolute;inset:6px;border:1px solid rgba(214,157,58,.22);border-radius:22px;pointer-events:none}.panelTitle{position:relative;text-align:center;text-transform:uppercase;letter-spacing:1px;font-size:13px;padding:8px 0 16px;border-bottom:1px solid rgba(226,178,86,.25);margin-bottom:12px}.rootLevel,.closedLevel{position:relative;width:100%;display:flex;align-items:center;gap:12px;text-align:left;border:1px solid rgba(226,178,86,.32);background:rgba(0,0,0,.38);color:#fff4d7;border-radius:17px;padding:12px 14px;margin-bottom:9px;box-shadow:inset 0 0 20px rgba(255,255,255,.025)}.rootLevel b,.closedLevel b{font-size:28px;color:#f4be5d;font-weight:400;min-width:28px}.rootLevel span,.closedLevel span{flex:1;text-transform:uppercase;letter-spacing:.55px}.rootLevel small,.closedLevel small{display:block;margin-top:3px;color:rgba(255,244,215,.68);text-transform:none;letter-spacing:.2px}.keysList{display:grid;gap:7px;margin:12px 0}.pianoKey{height:65px;border:1px solid rgba(96,61,15,.2);border-radius:13px;background:linear-gradient(180deg,#fff8ec,#efe4d3);color:#1e160d;display:flex;align-items:center;position:relative;overflow:hidden;transition:transform .2s,border .2s,box-shadow .2s}.pianoKey:hover{transform:translateX(2px)}.pianoKey i{position:absolute;left:-22px;top:50%;transform:translateY(-50%);width:104px;height:30px;border-radius:0 7px 7px 0;background:linear-gradient(90deg,#000,#1a1917);border:1px solid #3b3328;box-shadow:8px 4px 12px rgba(0,0,0,.22)}.pianoKey b{font-size:29px;font-weight:400;color:#98661b;margin-left:104px;z-index:1;min-width:28px}.pianoKey span{z-index:1;margin-left:22px;font-size:12px;letter-spacing:.9px;text-transform:uppercase}.pianoKey.selected{background:linear-gradient(90deg,#070706,#a46d1b,#dfa345);color:#fff;border-color:#ffd27c;box-shadow:0 0 26px rgba(245,158,11,.58)}.pianoKey.selected b{color:#fff}.glowRune{position:absolute;right:12px;color:#ffe8a8;text-shadow:0 0 15px #ffd35d}.closedLevels{margin-top:12px}.sideActions{position:relative;margin-top:16px;display:grid;gap:10px}.sideActions button{border:1px solid rgba(226,178,86,.54);background:rgba(0,0,0,.2);color:#f6cf78;border-radius:13px;padding:12px;text-transform:uppercase;font-size:12px;letter-spacing:.8px}.stageCard{background:rgba(255,255,255,.48);padding:clamp(24px,2.2vw,38px);overflow:hidden}.stageCard:before{content:"";position:absolute;inset:10px;border:1px solid rgba(203,152,64,.17);border-radius:20px;pointer-events:none}.stageHero{position:relative;display:grid;grid-template-columns:1fr clamp(150px,14vw,230px);gap:24px;align-items:start}.crumb{margin:0;color:#6c6156;text-transform:uppercase;font-size:12px;letter-spacing:.9px}.stageCopy h2{font-size:clamp(42px,4vw,58px);font-weight:400;text-transform:uppercase;margin:26px 0 0;letter-spacing:.8px;line-height:.95}.stageCopy h3{font-size:clamp(38px,4vw,56px);font-weight:400;color:#9c6819;text-transform:uppercase;margin:8px 0 20px;line-height:1}.introText{font-size:clamp(16px,1.1vw,18px);line-height:1.78;color:#3c342b;max-width:620px;margin:0}.treeMedallion{width:clamp(150px,14vw,220px);height:clamp(150px,14vw,220px);border-radius:50%;border:1px solid rgba(221,163,69,.7);background:#080705;display:flex;align-items:center;justify-content:center;color:#f2c364;font-size:clamp(78px,8vw,110px);box-shadow:0 0 35px rgba(184,121,29,.25),inset 0 0 0 10px rgba(255,255,255,.035);position:relative}.treeMedallion:after{content:"";position:absolute;inset:-14px;border:1px solid rgba(184,121,29,.24);border-radius:50%}.pathProgress{display:grid;grid-template-columns:1.1fr .8fr 1fr;align-items:center;gap:14px;margin:28px 0 24px;border:1px solid rgba(203,152,64,.36);border-radius:15px;background:rgba(255,255,255,.48);padding:14px 16px;color:#9a6618}.dots{text-align:right}.dot{width:10px;height:10px;border-radius:50%;border:0;background:#dfbd78;margin-left:11px;vertical-align:middle}.dot.active{background:#9a6618;box-shadow:0 0 0 6px #efd8a7}.infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(18px,2vw,30px);margin-top:22px}.framed{border:1px solid rgba(203,152,64,.31);background:rgba(255,255,255,.43);border-radius:16px;padding:22px}.infoBox h4{margin:0 0 12px;color:#9a6618;text-transform:uppercase;font-size:16px;letter-spacing:.8px}.infoBox p,.infoBox li{line-height:1.68;color:#40352b}.infoBox ul{padding-left:20px;margin:0}.ctaRow{display:grid;grid-template-columns:minmax(230px,1fr) minmax(140px,190px) minmax(140px,190px);gap:12px;margin:28px 0}.ctaRow button,.masterInvite button{border:1px solid rgba(184,121,29,.48);border-radius:13px;background:rgba(255,255,255,.48);padding:13px 15px;color:#7d520f;text-transform:uppercase;letter-spacing:.45px}.primaryCta{background:linear-gradient(90deg,#845711,#dda345)!important;color:white!important;border:0!important;box-shadow:0 10px 23px rgba(132,87,17,.22)}.primaryCta small{display:block;margin-top:4px;text-transform:none;opacity:.8;font-size:11px}.studentNote{border-top:1px solid rgba(203,152,64,.32);padding-top:16px;color:#4b3f33}.studentNote div{display:flex;gap:16px;align-items:center;color:#9a6618;text-transform:uppercase}.studentNote span{font-size:12px;color:#756a5e;text-transform:none}.studentNote a{float:right;margin-top:-20px;color:#9a6618;font-size:13px}.studentNote p{clear:both;line-height:1.62}.practicePanel{background:rgba(244,235,221,.86);padding:clamp(18px,1.8vw,28px);overflow:hidden}.practicePanel h2{text-align:center;text-transform:uppercase;font-weight:400;letter-spacing:1px;margin:2px 0 20px}.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;border-bottom:1px solid rgba(203,152,64,.36);margin-bottom:16px}.tab{border:0;background:transparent;color:#3e3228;text-transform:uppercase;padding:10px 2px;font-size:12px}.tab.active{color:#9a6618;border-bottom:2px solid #9a6618}.exerciseList{display:grid;gap:11px}.exerciseCard{display:grid;grid-template-columns:54px 1fr 28px 42px;align-items:center;gap:12px;background:linear-gradient(180deg,#151412,#080807);border:1px solid rgba(226,178,86,.34);border-radius:15px;padding:12px;color:#fff4d7;box-shadow:0 12px 24px rgba(16,13,9,.18)}.exerciseIcon{width:54px;height:54px;border-radius:50%;border:1px solid rgba(226,178,86,.6);display:flex;align-items:center;justify-content:center;color:#f3c464;background:#050504;font-size:25px}.exerciseText b{text-transform:uppercase;font-size:14px;letter-spacing:.4px}.exerciseText p{margin:5px 0;color:rgba(255,244,215,.78);font-size:13px;line-height:1.35}.exerciseText small{color:rgba(255,244,215,.7)}.bookmark,.play{border:1px solid rgba(226,178,86,.5);background:transparent;color:#f3c464;border-radius:50%;height:34px}.play{height:42px;width:42px}.allExercises{width:100%;border:0;background:transparent;color:#9a6618;text-transform:uppercase;padding:13px}.masterInvite{display:grid;grid-template-columns:60px 1fr;gap:16px;border:1px solid rgba(203,152,64,.32);border-radius:18px;background:rgba(255,255,255,.38);padding:16px;margin:18px 0}.profileIcon{width:58px;height:58px;border-radius:50%;border:1px solid rgba(184,121,29,.5);display:flex;align-items:center;justify-content:center;color:#9a6618;font-size:30px}.masterInvite b{text-transform:uppercase;color:#9a6618}.masterInvite p{font-size:13px;line-height:1.55;color:#574b3e}.masterInvite button{padding:10px 16px;background:rgba(255,255,255,.45)}.pubHeader{display:flex;justify-content:space-between;align-items:center;text-transform:uppercase;color:#9a6618;margin:18px 0 12px}.pubHeader a{font-size:12px;text-transform:none;color:#9a6618}.publicationGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.publicationCard{background:rgba(255,255,255,.55);border:1px solid rgba(203,152,64,.34);border-radius:13px;overflow:hidden;padding-bottom:10px}.publicationImage{height:92px;position:relative;background:radial-gradient(circle at center,rgba(247,202,103,.82),transparent 32%),linear-gradient(135deg,#06111d,#0b0a08,#8a5a13)}.publicationImage.variant2{background:radial-gradient(circle at center,rgba(247,202,103,.78),transparent 30%),linear-gradient(135deg,#111,#2d1a0b,#a36b16)}.publicationImage.variant3{background:radial-gradient(circle at center,rgba(247,202,103,.72),transparent 34%),linear-gradient(135deg,#062018,#0b0a08,#986a1c)}.publicationImage span{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.74);color:#f7d48b;border-radius:6px;padding:4px 7px;font-size:10px;text-transform:uppercase}.publicationCard b{display:block;padding:9px 9px 3px;font-size:13px}.publicationCard small{display:block;padding:0 9px;color:#6d6256;font-size:12px}@media(max-width:1500px){.dashboard{grid-template-columns:300px minmax(440px,1fr) 410px;gap:12px}.leftPiano{padding:12px}.stageCard{padding:28px}.practicePanel{padding:22px}.pianoKey{height:61px}.pianoKey b{margin-left:96px}.pianoKey i{width:96px}.publicationGrid{gap:8px}.mainNav{gap:18px}.brandBlock{min-width:285px}.brandBlock h1{font-size:25px}}@media(max-width:1280px){.dashboard{grid-template-columns:280px minmax(440px,1fr);grid-template-areas:'left center' 'practice practice'}.leftPiano{grid-area:left}.stageCard{grid-area:center}.practicePanel{grid-area:practice}.practicePanel{min-height:auto}.publicationGrid{grid-template-columns:repeat(3,1fr)}.mainNav{display:none}.userTools{min-width:auto}.topbar{height:82px}.brandBlock h1{font-size:24px}}@media(max-width:920px){.dashboard{grid-template-columns:1fr;grid-template-areas:'left' 'center' 'practice'}.leftPiano{min-height:auto}.stageHero{grid-template-columns:1fr}.treeMedallion{width:150px;height:150px;font-size:74px}.pathProgress{grid-template-columns:1fr}.dots{text-align:left}.infoGrid,.framed{grid-template-columns:1fr}.ctaRow{grid-template-columns:1fr}.publicationGrid{grid-template-columns:1fr}.topbar{align-items:flex-start;height:auto;padding:16px;flex-direction:column}.userTools{display:none}.studentNote a{float:none;display:block;margin:8px 0}.appShell{overflow-x:hidden}}
`;

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(<App />);
