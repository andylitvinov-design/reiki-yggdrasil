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

const content = {
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
  ["Дыхание потока", "Настройтесь на естественное движение энергии.", "10 мин"],
  ["Внутреннее слышание", "Практика развития тонкого восприятия.", "15 мин"],
  ["Соединение с Древом", "Визуализация канала связи с Иггдрасилем.", "20 мин"]
];

const mandalas = [
  ["Мандала настройки", "Мария", "Мандала"],
  ["Мандала исцеления", "Анна", "Мандала"],
  ["Мандала потока", "Ирина", "Мандала"]
];

const artifacts = [
  ["Кулон Потока", "Алексей", "Артефакт"],
  ["Амулет Древа", "Мария", "Артефакт"],
  ["Печать Настройки", "Ирина", "Артефакт"]
];

const masters = [
  ["Профиль мастера", "Арвист", "Мастер"],
  ["Практика ученика", "Светлана", "Практика"],
  ["Обратная связь", "Андрей", "Разбор"]
];

function App() {
  const [step, setStep] = useState(3);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("exercises");
  const current = content[step];
  const cards = useMemo(() => tab === "mandalas" ? mandalas : tab === "artifacts" ? artifacts : tab === "masters" ? masters : mandalas.slice(0, 1).concat(artifacts.slice(0, 1), [["Практика заземления", "Ирина", "Практика"]]), [tab]);

  return <div className="app">
    <div className="strings" />
    <header className="topbar">
      <div className="brand">
        <div className="seal small">♣</div>
        <div>
          <h1>РЕЙКИ ИГГДРАСИЛЬ</h1>
          <p>Путь поиска · древние традиции · сокровища</p>
        </div>
      </div>
      <nav>
        <span>О системе</span><span className="activeNav">Уровни и ступени</span><span>Практика</span><span>Мастера</span><span>Сообщество</span>
      </nav>
    </header>

    <main className="layout">
      <aside className="piano">
        <div className="panelTitle">Уровни и ступени</div>
        <button className="levelHead" onClick={() => setOpen(!open)}>
          <b>1</b><span><strong>Уровень · Корни</strong><small>5 ступеней</small></span><em>{open ? "⌃" : "⌄"}</em>
        </button>
        {open && <div className="keys">
          {levels[0].steps.map((name, i) => {
            const n = i + 1;
            return <button key={name} onClick={() => setStep(n)} className={step === n ? "key active" : "key"}>
              <i/><b>{n}</b><span>{name}</span>
            </button>;
          })}
        </div>}
        <div className="collapsed">
          {levels.slice(1).map(l => <button key={l.id} className="closedLevel"><b>{l.id}</b><span>Уровень · {l.name}<small>{l.count} ступеней</small></span><em>⌄</em></button>)}
        </div>
        <button className="sideBtn">Карта пути</button>
        <button className="sideBtn">Тест: определи ступень</button>
      </aside>

      <section className="center">
        <div className="hero">
          <div>
            <p className="crumb">1 уровень · Корни · Ступень {step}</p>
            <h2>{step} СТУПЕНЬ</h2>
            <h3>{current.title}</h3>
            <p className="intro">{current.intro}</p>
          </div>
          <div className="seal big">♣</div>
        </div>
        <div className="progress"><span>✦ Ты сейчас здесь</span><span>Ступень {step} из 5</span><div>{[1,2,3,4,5].map(n => <button key={n} className={n === step ? "dot on" : "dot"} onClick={() => setStep(n)} />)}</div></div>
        <div className="infoGrid">
          <Info title="Смысл ступени" text={current.meaning}/>
          <Info title="Что открывает" list={current.opens}/>
        </div>
        <div className="infoGrid boxed">
          <Info title="Ключевые навыки" list={current.skills}/>
          <Info title="Результат" text={current.result}/>
        </div>
        <div className="actions"><button className="primary">Пройти практику ступени</button><button>Записаться</button><button>Telegram</button></div>
        <div className="comments"><div className="commentHead"><b>Опыт участников</b><a>Написать свой опыт ✎</a></div><p><strong>Светлана:</strong> После практики появилось ощущение тепла в руках и потока в позвоночнике. Благодарю!</p></div>
      </section>

      <aside className="practice">
        <h2>Практика</h2>
        <div className="tabs">
          {[ ["exercises","Упражнения"], ["mandalas","Мандалы"], ["artifacts","Артефакты"], ["masters","Мастера"] ].map(([id,label]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "tab on" : "tab"}>{label}</button>)}
        </div>
        <div className="exerciseList">{exercises.map(([t,s,time]) => <div className="exercise" key={t}><div className="orb">✦</div><div><b>{t}</b><p>{s}</p><small>◷ {time}</small></div><button>▶</button></div>)}</div>
        <div className="profile"><div className="avatar">◎</div><div><b>Создай свой профиль мастера</b><p>Размещай практики, мандалы и артефакты. Получай обратную связь и развивайся вместе с сообществом.</p><button>Создать профиль</button></div></div>
        <div className="pubHead"><b>Новые публикации</b><a>Смотреть все →</a></div>
        <div className="pubs">{cards.map(([t,a,l], i) => <div className="pub" key={t}><div className="thumb"><span>{l}</span></div><b>{t}</b><small>{a} · ♥ {18 + i * 7}</small></div>)}</div>
      </aside>
    </main>
  </div>;
}

function Info({title, text, list}) {
  return <div className="info"><h4>✦ {title}</h4>{text && <p>{text}</p>}{list && <ul>{list.map(x => <li key={x}>{x}</li>)}</ul>}</div>;
}

const css = `
*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;background:#f6efe3;color:#17120c}.app{min-height:100vh;position:relative;overflow-x:auto}.strings{position:absolute;right:0;top:0;width:470px;height:110px;opacity:.35;background:repeating-linear-gradient(165deg,transparent 0,transparent 8px,rgba(151,95,30,.5) 9px,transparent 10px);pointer-events:none}.topbar{height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid #e8c98e;background:rgba(255,255,255,.55);backdrop-filter:blur(8px);position:relative;z-index:2}.brand{display:flex;gap:16px;align-items:center}.brand h1{font-size:30px;margin:0;letter-spacing:1px}.brand p{margin:4px 0 0;color:#675b4c;text-transform:uppercase;font-size:12px;letter-spacing:1.5px}nav{display:flex;gap:30px;text-transform:uppercase;font-size:13px;letter-spacing:.8px}.activeNav{color:#9a6a16;border-bottom:1px solid #b98021;padding-bottom:8px}.seal{border-radius:50%;border:1px solid rgba(217,174,84,.75);background:#080705;color:#f3c86f;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(201,143,45,.35),inset 0 0 0 8px rgba(255,255,255,.04)}.small{width:64px;height:64px;font-size:38px;background:#fff;color:#9a6a16}.big{width:220px;height:220px;font-size:96px}.layout{display:grid;grid-template-columns:330px minmax(520px,1fr) 520px;gap:20px;max-width:1800px;margin:8px auto 32px;padding:0 16px}.piano{background:#11100e;color:#fff4d7;border:1px solid rgba(245,185,72,.35);border-radius:28px;min-height:calc(100vh - 128px);padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.28);position:relative;overflow:hidden}.piano:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 0 25%,rgba(245,158,11,.23),transparent 32%);pointer-events:none}.panelTitle{text-align:center;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(245,185,72,.25);padding:4px 0 18px;margin-bottom:14px;position:relative}.levelHead,.closedLevel{width:100%;border:1px solid rgba(245,185,72,.32);border-radius:18px;background:rgba(0,0,0,.35);color:#fff4d7;padding:14px;display:flex;align-items:center;gap:14px;text-align:left;margin-bottom:10px;position:relative}.levelHead b,.closedLevel b{font-size:30px;color:#f2bd55}.levelHead small,.closedLevel small{display:block;color:rgba(255,244,215,.65);margin-top:4px}.levelHead span,.closedLevel span{flex:1}.keys{display:grid;gap:8px;margin:14px 0}.key{height:72px;border:1px solid rgba(90,55,10,.22);border-radius:14px;background:#f8efe3;color:#18120b;display:flex;align-items:center;position:relative;overflow:hidden;transition:.22s;box-shadow:inset 0 -10px 25px rgba(0,0,0,.06)}.key i{position:absolute;left:-25px;width:110px;height:32px;border-radius:0 7px 7px 0;background:linear-gradient(90deg,#000,#1c1a18);border:1px solid #333}.key b{font-size:30px;color:#9a6a16;margin-left:110px;z-index:1}.key span{text-transform:uppercase;letter-spacing:1px;font-size:13px;margin-left:24px;z-index:1}.key.active{background:linear-gradient(90deg,#050505,#a26816,#d5952d);color:white;border-color:#f3cc76;box-shadow:0 0 25px rgba(245,158,11,.55)}.key.active b{color:white}.sideBtn{width:100%;margin-top:12px;border:1px solid rgba(245,185,72,.5);background:transparent;color:#f7d48b;border-radius:14px;padding:14px;text-transform:uppercase}.center,.practice{border:1px solid #e5c987;border-radius:28px;background:rgba(255,255,255,.45);padding:34px;box-shadow:0 8px 28px rgba(92,64,25,.08)}.hero{display:grid;grid-template-columns:1fr 245px;gap:24px}.crumb{color:#74695b;text-transform:uppercase;font-size:13px;letter-spacing:.9px}.hero h2{font-size:54px;margin:30px 0 0;letter-spacing:1px}.hero h3{font-size:50px;color:#9a6a16;margin:0 0 20px}.intro{font-size:18px;line-height:1.75;color:#3c3328}.progress{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:28px 0;border:1px solid #e5c987;border-radius:16px;background:rgba(255,255,255,.55);padding:15px;color:#9a6a16}.dot{width:12px;height:12px;border-radius:50%;border:0;background:#e7c574;margin-left:10px}.dot.on{background:#9a6a16;box-shadow:0 0 0 6px #f1dcaa}.infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px}.boxed{border:1px solid #e5c987;background:rgba(255,255,255,.5);border-radius:16px;padding:22px}.info h4{color:#9a6a16;text-transform:uppercase;letter-spacing:.8px}.info p,.info li{line-height:1.65;color:#3a3026}.actions{display:grid;grid-template-columns:1fr 150px 140px;gap:14px;margin:30px 0}.actions button,.profile button{border:1px solid #d7a84f;border-radius:14px;background:rgba(255,255,255,.55);padding:15px;text-transform:uppercase;color:#7f5510}.actions .primary{background:linear-gradient(90deg,#8a5a13,#d4952c);color:white;border:0;font-size:16px}.comments{border-top:1px solid #e5c987;padding-top:18px}.commentHead,.pubHead{display:flex;justify-content:space-between;align-items:center;color:#9a6a16;text-transform:uppercase}.commentHead a,.pubHead a{font-size:13px;text-transform:none;color:#9a6a16}.practice{background:rgba(245,236,222,.82)}.practice h2{text-align:center;text-transform:uppercase;letter-spacing:1px}.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;border-bottom:1px solid #e5c987;margin-bottom:18px}.tab{border:0;background:transparent;padding:12px 0;text-transform:uppercase;color:#392f25}.tab.on{color:#9a6a16;border-bottom:2px solid #9a6a16}.exerciseList{display:grid;gap:12px}.exercise{display:flex;align-items:center;gap:14px;background:#11100e;color:#fff4d7;border:1px solid rgba(245,185,72,.35);border-radius:16px;padding:14px}.exercise p{margin:4px 0;color:rgba(255,244,215,.75);font-size:14px}.orb{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#050505;color:#f2bd55;border:1px solid #d7a84f}.exercise div:nth-child(2){flex:1}.exercise button{width:44px;height:44px;border-radius:50%;border:1px solid #d7a84f;background:transparent;color:#f2bd55}.profile{display:flex;gap:18px;background:rgba(255,255,255,.45);border:1px solid #e5c987;border-radius:20px;padding:18px;margin:22px 0}.avatar{width:64px;height:64px;border-radius:50%;border:1px solid #d7a84f;color:#9a6a16;display:flex;align-items:center;justify-content:center;font-size:34px;flex:0 0 auto}.profile p{font-size:14px;line-height:1.6;color:#53483a}.pubs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.pub{background:rgba(255,255,255,.55);border:1px solid #e5c987;border-radius:14px;overflow:hidden;padding-bottom:10px}.thumb{height:96px;background:radial-gradient(circle at center,rgba(247,202,103,.8),transparent 35%),linear-gradient(135deg,#06111d,#0b0a08,#8a5a13);position:relative}.thumb span{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.7);color:#f7d48b;border-radius:6px;padding:4px 7px;font-size:10px;text-transform:uppercase}.pub b{display:block;padding:10px 10px 4px;font-size:14px}.pub small{display:block;padding:0 10px;color:#6c6053}@media(max-width:1200px){.layout{grid-template-columns:1fr}.topbar nav{display:none}.piano,.center,.practice{min-height:auto}.hero{grid-template-columns:1fr}.big{width:160px;height:160px}.pubs,.infoGrid{grid-template-columns:1fr}.actions{grid-template-columns:1fr}.layout{min-width:360px}}
`;
const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(<App />);
