import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  practiceExercises,
  reikiLevels,
  reikiKnowledgeMeta,
  studentCollections
} from "./data/reikiKnowledgeBase.js";
import { getDegreeSettingByTabId, getDegreeTabsForStep } from "./data/degreeSettings.js";
import { getMysteryEntity, getMysteryTraditionByMenuItemId } from "./data/mysteryTraditions.js";
import { sourcedStepSettings } from "./data/reikiStepSettings.js";
import { getStepVideo } from "./data/reikiStepVideos.js";
import { leftMenuSections, topSections } from "./data/topSectionMenus.js";
import { getProfileLiteInitialTabFromLocation } from "./lib/profileLiteClient.js";
import { youtubeEmbedUrl as buildYoutubeEmbedUrl, youtubeWatchUrl } from "./lib/youtube.js";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProfileLitePage from "./pages/ProfileLitePage.jsx";
import MastersPage from "./pages/MastersPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import PublicServicesPage from "./pages/PublicServicesPage.jsx";
import "./index.css";
import "./degreeSettings.css";
import "./stepSettings.css";
import "./stepVideos.css";
import "./profileCabinet.css";

const PLACEHOLDER_TEXT = "Материал готовится. Скоро здесь появится авторское описание ступени.";
const SETTINGS_PLACEHOLDER_TEXT = "Список настроек этой ступени уточняется.";
const KNOWLEDGE_STATUS_TEXT = "структура курса подтверждена, материалы дополняются";
const ROUTE_CHANGE_EVENT = "reiki-route-change";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

function publicMysteryList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ["Данные будут добавлены после сверки"];
  }

  return items.map(publicText);
}

function publicSettings(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [
      {
        id: "settings-placeholder",
        title: "Настройки уточняются",
        description: SETTINGS_PLACEHOLDER_TEXT,
        effect: "После сверки с методичкой здесь появится точный список настроек."
      }
    ];
  }

  return items.map((item, index) => ({
    id: item.id || `setting-${index + 1}`,
    title: publicText(item.title),
    description: publicText(item.description),
    effect: publicText(item.effect)
  }));
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
  if (value === "needs_review") return "требует авторской проверки";
  if (value === "needs verification") return "требуется проверка";
  if (value === "source_reviewed") return "структура настроек подтверждена";
  return value || "материал готовится";
}

function isPublicUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function youtubeEmbedUrl(value) {
  if (!isPublicUrl(value)) return null;

  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return value;
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function cleanSettingTitle(value) {
  return publicText(value)
    .replace(/^Настройка\s+[«"]/, "")
    .replace(/[»"]$/, "")
    .replace(/^Блок\s+[«"]/, "")
    .replace(/[»"]$/, "")
    .trim();
}

function buildStepMeaning(step, settings) {
  const normalizedSettings = publicSettings(settings).filter((item) => item.id !== "settings-placeholder");
  const titles = normalizedSettings.map((item) => cleanSettingTitle(item.title)).filter(Boolean).slice(0, 5);

  if (titles.length === 0) return publicText(step.meaning);

  const focus = titles.length === 1
    ? titles[0]
    : `${titles.slice(0, -1).join(", ")} и ${titles.at(-1)}`;

  return `Смысл этой ступени — освоить блок «${step.title}» через конкретные настройки: ${focus}. Здесь ученик не просто читает описание, а учится входить в нужное качество потока, наблюдать изменения в теле и состоянии, связывать практику с жизненными задачами и закреплять опыт через повторение. Материал собран по структуре блока и списку настроек этой ступени; точные формулировки остаются открытыми для дальнейшей сверки с методичкой.`;
}

function RootRouter() {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }));
  const path = location.pathname;
  const search = location.search;

  useEffect(() => {
    const updatePath = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.addEventListener("popstate", updatePath);
    window.addEventListener(ROUTE_CHANGE_EVENT, updatePath);

    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener(ROUTE_CHANGE_EVENT, updatePath);
    };
  }, []);

  const profileQueryTab = getProfileLiteInitialTabFromLocation(path, search);

  if (path === "/profile/admin") {
    return <AdminPage onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/shop") {
    return <PublicServicesPage onNavigateHome={() => navigateTo("/")} onNavigateProfile={() => navigateTo("/profile")} />;
  }

  if (path.startsWith("/services/")) {
    const serviceId = decodeURIComponent(path.replace(/^\/services\//, "").split("/")[0] || "");
    return <PublicServicesPage serviceId={serviceId} onNavigateHome={() => navigateTo("/")} onNavigateProfile={() => navigateTo("/profile")} />;
  }

  if (path === "/profile-lite") {
    return <ProfileLitePage initialTab={profileQueryTab} onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile-old") {
    return <ProfilePage key="profile-old" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile/mandalas") {
    return <ProfileLitePage initialTab="mandalas" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile/services") {
    return <ProfileLitePage initialTab="services" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile/orders") {
    return <ProfileLitePage initialTab="orders" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile/chats") {
    return <ProfileLitePage initialTab="chats" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile/settings") {
    return <ProfileLitePage initialTab="settings" onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/profile") {
    return <ProfileLitePage initialTab={profileQueryTab} onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} />;
  }

  if (path === "/masters") {
    return <MastersPage onNavigateHome={() => navigateTo("/")} onNavigateProfile={() => navigateTo("/profile")} />;
  }

  if (path === "/feed") {
    return <FeedPage onNavigateHome={() => navigateTo("/")} onNavigateMasters={() => navigateTo("/masters")} onNavigateProfile={() => navigateTo("/profile")} />;
  }

  return <App />;
}

function App() {
  const [selectedStepId, setSelectedStepId] = useState("RY-L01-S01");
  const [openLevelId, setOpenLevelId] = useState(1);
  const [rightPanelTab, setRightPanelTab] = useState("overview");
  const [activeTopSection, setActiveTopSection] = useState("all-categories");
  const [selectedLeftItemId, setSelectedLeftItemId] = useState(null);
  const [selectedMysteryEntityId, setSelectedMysteryEntityId] = useState(null);
  const [seniorLevelsOpen, setSeniorLevelsOpen] = useState(false);
  const [openLeftGroups, setOpenLeftGroups] = useState({});

  useEffect(() => {
    setSelectedLeftItemId(null);
    setOpenLeftGroups({});
  }, [activeTopSection]);

  useEffect(() => {
    setRightPanelTab("overview");
  }, [selectedStepId]);

  const selectedLevel = reikiLevels.find((level) => level.steps.some((item) => item.id === selectedStepId)) ?? reikiLevels[0];
  const current = selectedLevel.steps.find((item) => item.id === selectedStepId) ?? reikiLevels[0].steps[0];
  const currentSettings = sourcedStepSettings[current.id] || current.settings;
  const currentVideo = getStepVideo(current.id);
  const mysteryTradition = activeTopSection === "mysteries-school"
    ? getMysteryTraditionByMenuItemId(selectedLeftItemId)
    : null;
  const selectedMysteryEntity = getMysteryEntity(mysteryTradition, selectedMysteryEntityId);
  const isMysteryMode = activeTopSection === "mysteries-school" && selectedLeftItemId === "mysteries-greek" && mysteryTradition && selectedMysteryEntity;
  const currentMeaning = buildStepMeaning(current, currentSettings);
  const rightTabs = getDegreeTabsForStep(current.id);
  const activeRightSetting = rightPanelTab === "overview" || rightPanelTab === "practice"
    ? null
    : getDegreeSettingByTabId(current.id, rightPanelTab);
  const activeLeftSection = leftMenuSections[activeTopSection];
  const flatLeftItems = [
    ...(activeLeftSection?.items || []),
    ...((activeLeftSection?.groups || []).flatMap((group) => group.items || []))
  ];
  const activeLeftItem = flatLeftItems.find((item) => item.id === selectedLeftItemId)
    || (activeTopSection === "mysteries-school" ? null : activeLeftSection?.items?.[0])
    || null;

  const selectStep = (stepId) => {
    setSelectedStepId(stepId);
  };

  const selectLeftItem = (itemId) => {
    setSelectedLeftItemId(itemId);
    const tradition = activeTopSection === "mysteries-school" ? getMysteryTraditionByMenuItemId(itemId) : null;
    setSelectedMysteryEntityId(tradition?.entities?.[0]?.id || null);
  };

  const renderLevelGroup = (level) => {
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
                onClick={() => selectStep(item.id)}
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
  };

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
          {topSections.map((section) => (
            <button
              key={section.id}
              className={activeTopSection === section.id ? "activeNav" : ""}
              onClick={() => section.path ? navigateTo(section.path) : setActiveTopSection(section.id)}
              type="button"
            >
              {section.label}
            </button>
          ))}
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
          {isMysteryMode ? (
            <MysteryLeftTabs
              tradition={mysteryTradition}
              selectedEntityId={selectedMysteryEntity.id}
              onSelect={setSelectedMysteryEntityId}
              onBack={() => {
                setSelectedLeftItemId(null);
                setSelectedMysteryEntityId(null);
              }}
            />
          ) : activeTopSection === "dao-ri" ? (
            <>
              <div className="panelTitle">Уровни и ступени</div>

              {reikiLevels.slice(0, 2).map(renderLevelGroup)}

              <div className="levelGroup seniorLevelGroup">
                <button className="closedLevel seniorLevelsToggle" onClick={() => setSeniorLevelsOpen((value) => !value)}>
                  <b>3–7</b>
                  <span>
                    <strong>Старшие уровни</strong>
                    <small>уровни 3–7</small>
                  </span>
                  <em>{seniorLevelsOpen ? "⌃" : "⌄"}</em>
                </button>

                {seniorLevelsOpen && reikiLevels.slice(2).map(renderLevelGroup)}
              </div>

              <div className="sideActions">
                <div className="promoRune">♧</div>
                <p>Пройти Практикум по РИ БЕСПЛАТНО</p>
              </div>
            </>
          ) : (
            <LeftMenuSection
              section={activeLeftSection}
              selectedItemId={activeLeftItem?.id}
              onSelect={selectLeftItem}
              onOpenSection={setActiveTopSection}
              openGroups={openLeftGroups}
              onToggleGroup={(groupId) => setOpenLeftGroups((value) => ({ ...value, [groupId]: !value[groupId] }))}
            />
          )}
        </aside>

        {isMysteryMode ? (
          <section className="stageCard">
            <MysteryStage
              tradition={mysteryTradition}
              entity={selectedMysteryEntity}
            />
          </section>
        ) : activeTopSection === "dao-ri" ? (
          <section className="stageCard">
            <>
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

            <StepVideo video={currentVideo} />

            <SettingsList settings={currentSettings} />

            <div className="infoGrid">
              <Info title="Смысл ступени" text={currentMeaning} />
              <Info title="Что открывает" list={publicList(current.opens)} />
            </div>

            <div className="knowledgeMeta">
              <b>База знаний:</b> {reikiKnowledgeMeta.totalLevels} уровней · {reikiKnowledgeMeta.totalSteps} ступеней · {KNOWLEDGE_STATUS_TEXT}
            </div>
            </>
          </section>
        ) : activeTopSection === "all-categories" ? (
          <HomeStage />
        ) : (
          <SectionStage section={activeLeftSection} item={activeLeftItem} />
        )}

        {isMysteryMode ? (
          <MysteryRightPanel entity={selectedMysteryEntity} />
        ) : activeTopSection === "dao-ri" ? (
          <aside className="practicePanel">
            <div className="tabs degreeTabs">
              {rightTabs.map((item) => (
                <button
                  key={item.id}
                  className={rightPanelTab === item.id ? "tab active" : "tab"}
                  onClick={() => setRightPanelTab(item.id)}
                  type="button"
                >
                  {item.label || item.title}
                </button>
              ))}
            </div>

            <RightPanelContext
              current={current}
              selectedLevel={selectedLevel}
              activeSetting={activeRightSetting}
              rightPanelTab={rightPanelTab}
            />

            {rightPanelTab === "practice" && (
              <>
                <div className="exerciseList">
                  {practiceExercises.map((item) => (
                    <Exercise item={item} key={item.title} />
                  ))}
                </div>
                <button className="allExercises">Все упражнения →</button>
              </>
            )}

            <div className="masterInvite">
              <div className="profileIcon">◎</div>
              <div>
                <b>Создай свой профиль мастера</b>
                <p>
                  Размещай практики, мандалы и артефакты. Получай обратную связь и развивайся вместе с
                  сообществом.
                </p>
                <button type="button" onClick={() => navigateTo("/profile")}>Создать профиль</button>
              </div>
            </div>

            <CollectionBlock title="Мандалы студентов" cards={studentCollections.mandalas} />
            <CollectionBlock title="Артефакты студентов" cards={studentCollections.artifacts} />
          </aside>
        ) : null}
      </main>
    </div>
  );
}

function MysteryLeftTabs({ tradition, selectedEntityId, onSelect, onBack }) {
  return (
    <>
      <button className="backToLevels" onClick={onBack} type="button">← Все мистерии</button>
      <div className="panelTitle">{tradition.title}</div>
      <div className="mysteryTabs">
        {tradition.entities.map((entity, index) => (
          <button
            className={selectedEntityId === entity.id ? "mysteryTab active" : "mysteryTab"}
            key={entity.id}
            onClick={() => onSelect(entity.id)}
            type="button"
          >
            <b>{index + 1}</b>
            <span>{entity.title}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MysteryStage({ tradition, entity }) {
  return (
    <div className="mysteryStage">
      <div className="stageHero mysteryHero">
        <div className="stageCopy">
          <p className="crumb">Школа Мистерий · {tradition.title}</p>
          <h2>{entity.title}</h2>
          <h3>{publicText(entity.archetype)}</h3>
          <p className="introText">{publicText(entity.description)}</p>
        </div>
        <div className="treeMedallion mysteryMedallion">
          <span>{entity.title.slice(0, 1)}</span>
        </div>
      </div>

      <div className="infoGrid mysteryInfoGrid">
        <Info title="Статьи" list={publicMysteryList(entity.articles)} />
        <Info title="Заметки" list={publicMysteryList(entity.notes)} />
      </div>

      <MysteryVideos videos={entity.videos} />

      <div className="knowledgeMeta">
        <b>Раздел мистерий:</b> материалы по архетипам добавлены как структура и ждут авторской сверки.
      </div>
    </div>
  );
}

function MysteryVideos({ videos }) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return (
      <div className="mysteryVideoPlaceholder">
        <b>Видео</b>
        <p>Видео будут добавлены после сверки.</p>
      </div>
    );
  }

  return (
    <div className="mysteryVideoPlaceholder">
      <b>Видео</b>
      <div className="mysteryLinks">
        {videos.map((video) => (
          <a href={video.url} key={video.url} target="_blank" rel="noreferrer">{video.title || "Открыть видео"}</a>
        ))}
      </div>
    </div>
  );
}

function MysteryRightPanel({ entity }) {
  return (
    <aside className="practicePanel mysteryPanel">
      <section className="mysteryPanelBlock initiationBlock">
        <p className="degreePanelEyebrow">{entity.title}</p>
        <h3>Инициация</h3>
        <p>{publicText(entity.initiation?.description)}</p>
        <button type="button">{entity.initiation?.cta || "Запросить инициацию"}</button>
      </section>

      <MysteryPanelList title="Мандалы" items={entity.mandalas} />
      <MysteryPanelList title="Артефакты / магазин" items={entity.shopItems} />
    </aside>
  );
}

function MysteryPanelList({ title, items }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <section className="mysteryPanelBlock">
      <h3>{title}</h3>
      {hasItems ? (
        <div className="mysteryLinks">
          {items.map((item) => (
            <a href={item.url} key={item.title || item.url} target="_blank" rel="noreferrer">{item.title || item.url}</a>
          ))}
        </div>
      ) : (
        <p className="mysteryEmpty">Данные будут добавлены после сверки.</p>
      )}
    </section>
  );
}

function LeftMenuSection({ section, selectedItemId, onSelect, onOpenSection, openGroups = {}, onToggleGroup }) {
  if (!section) return null;

  return (
    <>
      <div className="panelTitle">{section.title}</div>
      <div className="leftMenuCards">
        {section.items.map((item) => (
          <button
            className={selectedItemId === item.id ? "leftMenuCard active" : "leftMenuCard"}
            key={item.id}
            onClick={() => item.targetSection ? onOpenSection(item.targetSection) : onSelect(item.id)}
            type="button"
          >
            <b>{item.label}</b>
            <p>{item.description}</p>
            {item.status && <small className="leftMenuStatus">{item.status}</small>}
            {item.cta && <span className="leftMenuCta">{item.cta}</span>}
          </button>
        ))}

        {Array.isArray(section.groups) && section.groups.map((group) => {
          const isOpen = !!openGroups[group.id];

          return (
            <div className="leftMenuGroup" key={group.id}>
              <button className="closedLevel seniorLevelsToggle" onClick={() => onToggleGroup(group.id)} type="button">
                <b>{group.range}</b>
                <span>
                  <strong>{group.label}</strong>
                  <small>{group.summary}</small>
                </span>
                <em>{isOpen ? "⌃" : "⌄"}</em>
              </button>

              {isOpen && group.items.map((item) => (
                <button
                  className={selectedItemId === item.id ? "leftMenuCard active" : "leftMenuCard"}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  type="button"
                >
                  <b>{item.label}</b>
                  <p>{item.description}</p>
                  {item.status && <small className="leftMenuStatus">{item.status}</small>}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

function HomeStage() {
  return (
    <section className="stageCard sectionStage">
      <div className="sectionStageHero">
        <p className="crumb">Главная страница</p>
        <h2>Карта разделов сайта</h2>
        <h3>Выберите направление слева</h3>
        <p className="introText">
          Слева открыта общая карта сайта. Нажмите на нужный раздел, чтобы увидеть его собственное левое меню и центральную страницу.
        </p>
      </div>
      <div className="sectionStageGrid">
        <div className="sectionStagePoint"><span>✦</span><p>Сначала выберите большой раздел сайта.</p></div>
        <div className="sectionStagePoint"><span>✦</span><p>После выбора слева откроются категории этого направления.</p></div>
        <div className="sectionStagePoint"><span>✦</span><p>Каждой категории соответствует своя центральная страница.</p></div>
      </div>
    </section>
  );
}

function SectionStage({ section, item }) {
  if (!section) {
    return (
      <section className="stageCard sectionStage">
        <p className="crumb">Раздел готовится</p>
        <h2>Материалы скоро появятся</h2>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="stageCard sectionStage">
        <div className="sectionStageHero">
          <p className="crumb">{section.title}</p>
          <h2>{section.title}</h2>
          <h3>Выберите направление слева</h3>
          <p className="introText">Откройте один из разделов, чтобы увидеть материалы, практики и связанные карточки.</p>
        </div>

        {Array.isArray(section.items) && section.items.length > 0 && (
          <div className="sectionStageGrid">
            {section.items.map((sectionItem) => (
              <div className="sectionStagePoint" key={sectionItem.id}>
                <span>✦</span>
                <p>{sectionItem.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  const page = item.page || {
    eyebrow: section.title,
    title: item.label,
    subtitle: item.status || "материалы готовятся",
    intro: item.description,
    points: [item.status || "Материалы готовятся"],
    cta: item.cta || "Подробнее"
  };

  return (
    <section className="stageCard sectionStage">
      <div className="sectionStageHero">
        <p className="crumb">{page.eyebrow}</p>
        <h2>{page.title}</h2>
        <h3>{page.subtitle}</h3>
        <p className="introText">{page.intro}</p>
      </div>

      {Array.isArray(page.points) && page.points.length > 0 && (
        <div className="sectionStageGrid">
          {page.points.map((point) => (
            <div className="sectionStagePoint" key={point}>
              <span>✦</span>
              <p>{point}</p>
            </div>
          ))}
        </div>
      )}

      {page.cta && <div className="knowledgeMeta"><b>Статус:</b> {page.cta}</div>}
    </section>
  );
}

function RightPanelContext({ current, selectedLevel, activeSetting, rightPanelTab }) {
  if (rightPanelTab === "practice") {
    return (
      <div className="rightPanelContext">
        <p className="degreePanelEyebrow">{selectedLevel.name} · {stepLabel(current)} {current.number}</p>
        <h3>Практика</h3>
        <p>
          Выберите упражнение для мягкого закрепления выбранной ступени. Карточки ниже помогают перейти от
          описания к личной практике.
        </p>
      </div>
    );
  }

  return (
    <div className="rightPanelContext">
      <p className="degreePanelEyebrow">{selectedLevel.name} · {stepLabel(current)} {current.number}</p>
      <h3>{activeSetting ? activeSetting.title : "Обзор"}</h3>
      <p>{activeSetting ? publicText(activeSetting.description) : publicText(current.intro)}</p>
      {!activeSetting && <PracticePreparationGuide />}
    </div>
  );
}

function PracticePreparationGuide() {
  const items = [
    {
      title: "Намерение",
      text: "Перед практикой мягко сформулировать цель — восстановление, настройка канала, защита, интуиция или работа с ситуацией."
    },
    {
      title: "Положение тела",
      text: "Сесть удобно, выпрямить спину без напряжения, расслабить плечи, руки и лицо."
    },
    {
      title: "Дыхание",
      text: "Несколько минут спокойного дыхания, внимание на естественном движении энергии."
    },
    {
      title: "Связь с Иггдрасилем",
      text: "Представить Древо как живую вертикаль силы — корни, ствол, крону, поток сверху и снизу."
    },
    {
      title: "Безопасность",
      text: "Не форсировать ощущения, работать мягко, возвращаться к дыханию при перегрузе."
    },
    {
      title: "Завершение",
      text: "Поблагодарить поток, закрыть практику, почувствовать тело, сделать несколько обычных движений."
    }
  ];

  return (
    <section className="practiceGuide" aria-labelledby="practice-guide-title">
      <h4 id="practice-guide-title">Настройки перед практикой</h4>
      <div className="practiceGuideGrid">
        {items.map((item) => (
          <article className="practiceGuideItem" key={item.title}>
            <b>{item.title}</b>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StepVideo({ video }) {
  const links = Array.isArray(video?.videos) && video.videos.length > 0
    ? video.videos
    : video?.primaryUrl
      ? [{ title: video?.title || "Видео ступени", label: "Основное видео", url: video.primaryUrl }]
      : [];
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    setSelectedVideoIndex(0);
  }, [video?.primaryUrl]);

  if (!video || links.length === 0) return null;

  const selectedVideo = links[selectedVideoIndex] || links[0];
  const embedUrl = buildYoutubeEmbedUrl(selectedVideo.url) || youtubeEmbedUrl(selectedVideo.url);
  const watchUrl = youtubeWatchUrl(selectedVideo.url);

  return (
    <div className="videoSettingsCard">
      <div className="stepVideoHeader">
        <b>Видео ступени</b>
        {video?.sourceStatus === "source_verified" && <span>проверено по источнику</span>}
      </div>

      {embedUrl ? (
        <div className="stepVideoFrame">
          <iframe
            key={selectedVideo.url}
            src={embedUrl}
            title={selectedVideo.title || video?.title || "Видео ступени Рейки Иггдрасиль"}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      {video && <small>{video.title} · сейчас: {selectedVideo.label} · источник: {video.sourcePage ? "reiki-yggdrasil.com" : "needs verification"}</small>}
      {watchUrl && (
        <a className="stepVideoFallback" href={watchUrl} target="_blank" rel="noreferrer">
          Открыть видео на YouTube →
        </a>
      )}
      {watchUrl && <small>Если видео не загрузилось на телефоне, откройте его напрямую на YouTube.</small>}

      {links.length > 0 && (
        <div className="stepVideoLinks" role="group" aria-label="Выбор записи видео">
          {links.map((item, index) => (
            <button
              type="button"
              className={index === selectedVideoIndex ? "stepVideoChoice active" : "stepVideoChoice"}
              onClick={() => setSelectedVideoIndex(index)}
              key={`${item.label}-${item.url}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
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

function SettingsList({ settings }) {
  const items = publicSettings(settings);

  return (
    <div className="stepSettingsSection">
      <div className="stepSettingsHeader">
        <span>✦</span>
        <div>
          <h4>Настройки ступени</h4>
          <p>Список настроек для прохождения и закрепления темы.</p>
        </div>
      </div>

      <div className="stepSettingsGrid">
        {items.map((item) => (
          <article className="stepSettingCard" key={item.id}>
            <b>{item.title}</b>
            <p>{item.description}</p>
            <small>{item.effect}</small>
          </article>
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

createRoot(document.getElementById("root")).render(<RootRouter />);
