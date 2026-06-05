import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, User, Users } from "lucide-react";
import {
  ACTIVITY_FEED_TABS,
  activityTypeLabel,
  listPublicActivityEvents
} from "../lib/profileActivityFeedClient.js";
import { supabaseEnv } from "../lib/supabaseClient.js";

const FALLBACK_SYMBOLS = {
  master_update: "✦",
  mandala_published: "◎",
  power_place_published: "◉",
  photo_album_published: "◧",
  service_created: "◇",
  service_updated: "◇",
  practice_published: "☉",
  artifact_published: "✧",
  admin_announcement: "!",
  featured_item: "★"
};

function formatFeedDate(value) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function eventPreview(event) {
  return event.body || "Описание появится после авторского заполнения.";
}

function targetLabel(event) {
  if (event.targetTable === "profile_cabinet_services") return "Услуга";
  if (event.targetTable === "profile_cabinet_publications") return "Материал";
  if (event.targetTable === "profile_cabinet_photo_albums") return "Фотоальбом";
  return "Подробности";
}

function FeedCard({ event, onNavigateMasters }) {
  const symbol = FALLBACK_SYMBOLS[event.activityType] || "✦";
  const hasImage = Boolean(event.imageUrl);

  return (
    <article className="feedCard">
      <div
        className={`feedCardMedia ${hasImage ? "feedCardMedia--image" : "feedFallback"}`}
        style={hasImage ? { backgroundImage: `url("${event.imageUrl}")` } : undefined}
        aria-label={hasImage ? event.title : "Публичная обложка не добавлена"}
      >
        {!hasImage && <span>{symbol}</span>}
      </div>
      <div className="feedCardBody">
        <div className="feedMeta">
          <span className="feedBadge">{activityTypeLabel(event.activityType)}</span>
          {event.isFeatured && <span className="feedBadge feedBadgeFeatured">Избранное</span>}
        </div>
        <h2>{event.title || activityTypeLabel(event.activityType)}</h2>
        <p>{eventPreview(event)}</p>
        <div className="feedCardFooter">
          <span>{formatFeedDate(event.eventAt)}</span>
          {event.category && <span>{event.category}</span>}
          {event.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
        <div className="feedCardActions">
          <button className="cabinetSecondary" type="button" onClick={onNavigateMasters}>
            <Users size={16} aria-hidden="true" />
            К мастерам
          </button>
          <button className="cabinetGhost" type="button" disabled title="Публичный маршрут объекта будет подключён отдельно">
            <ExternalLink size={16} aria-hidden="true" />
            {targetLabel(event)}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FeedPage({ onNavigateHome, onNavigateMasters, onNavigateProfile }) {
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [error, setError] = useState("");

  const activeTabLabel = useMemo(
    () => ACTIVITY_FEED_TABS.find((tab) => tab.id === activeTab)?.label || "Все",
    [activeTab]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const rows = await listPublicActivityEvents({ tab: activeTab, limit: 30 });
        if (!cancelled) setEvents(rows);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить ленту сообщества.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <div className="cabinetShell feedShell">
      <header className="feedTopbar">
        <button type="button" onClick={onNavigateHome}>
          <ArrowLeft size={16} aria-hidden="true" />
          На главную
        </button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>Лента сообщества</h1>
        </div>
        <nav className="feedTopActions" aria-label="Навигация ленты">
          <button type="button" onClick={onNavigateMasters}>
            <Users size={16} aria-hidden="true" />
            Каталог мастеров
          </button>
          <button type="button" onClick={onNavigateProfile}>
            <User size={16} aria-hidden="true" />
            Мой кабинет
          </button>
        </nav>
      </header>

      <main className="feedMain">
        <section className="feedHero">
          <p className="cabinetEyebrow">новости, мандалы, практики и услуги</p>
          <h2>Публичные события школы и мастеров</h2>
          <p>Здесь показываются только одобренные события с видимостью public_feed. Приватные композиции, медиа и подписанные ссылки не используются как источник публичной ленты.</p>
        </section>

        <div className="feedTabs" role="tablist" aria-label="Фильтр ленты">
          {ACTIVITY_FEED_TABS.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`feedTab ${activeTab === tab.id ? "feedTab--active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!supabaseEnv.isConfigured && (
          <div className="cabinetNotice feedState">
            <b>Лента подготовлена, но Supabase ещё не подключён.</b>
            <p>После настройки VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY здесь появятся одобренные публичные события.</p>
          </div>
        )}

        {loading && <div className="cabinetNotice feedState">Загружаю ленту сообщества...</div>}
        {error && <div className="cabinetError feedState">{error}</div>}

        {!loading && supabaseEnv.isConfigured && events.length === 0 && !error && (
          <div className="cabinetNotice feedState">
            <b>В разделе «{activeTabLabel}» пока нет публичных событий.</b>
            <p>События появятся после создания, модерации и публикации в public_feed.</p>
          </div>
        )}

        {events.length > 0 && (
          <section className="feedGrid" aria-label={`Лента: ${activeTabLabel}`}>
            {events.map((event) => (
              <FeedCard event={event} key={event.id} onNavigateMasters={onNavigateMasters} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
