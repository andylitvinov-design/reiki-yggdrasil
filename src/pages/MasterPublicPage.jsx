import React, { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Globe2, MapPin, MessageCircle, Quote, ShieldCheck, Sprout } from "lucide-react";
import {
  fetchPublicMasterPage,
  normalizePublicMasterProfile
} from "../lib/profilePublicMasterClient.js";
import { supabaseEnv } from "../lib/supabaseClient.js";
import MasterPageFeed from "./masters/MasterPageFeed.jsx";
import MasterPageHeader from "./masters/MasterPageHeader.jsx";

const DEMO_PROFILE = normalizePublicMasterProfile({
  id: "demo-master",
  display_name: "Елена Северная",
  bio: "Проводит мягкие настройки, практики внимания и авторские мандалы в спокойном академическом ритме.",
  city: "Барселона",
  country: "Испания",
  telegram: "@mentalica_master",
  website: "https://mentalica.vercel.app",
  status: "approved"
});

function countByKind(items, kind) {
  return items.filter((item) => item.kind === kind).length;
}

function buildCounts(publications, services) {
  const items = [...(publications || []), ...(services || [])];
  return {
    publications: items.length,
    services: services?.length || countByKind(items, "service"),
    materials: countByKind(items, "material") + countByKind(items, "article") + countByKind(items, "mandala")
  };
}

function profileLocation(profile) {
  return [profile?.city, profile?.country].filter(Boolean).join(", ");
}

export default function MasterPublicPage({ masterId, onNavigateHome, onNavigateMasters, onNavigateProfile }) {
  const [profile, setProfile] = useState(null);
  const [publications, setPublications] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [error, setError] = useState("");
  const feedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setProfile(DEMO_PROFILE);
        setPublications([]);
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await fetchPublicMasterPage(masterId);
        if (cancelled) return;
        setProfile(result.profile);
        setPublications(result.publications || []);
        setServices(result.services || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить публичную страницу мастера.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [masterId]);

  const counts = useMemo(() => buildCounts(publications, services), [publications, services]);
  const hasRealFeed = publications.length > 0 || services.length > 0;
  const fallbackMode = !supabaseEnv.isConfigured ? "demo" : profile && !hasRealFeed ? "empty" : "";

  function showServices() {
    setActiveTab("services");
    window.setTimeout(() => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <div className="cabinetShell masterPageShell">
      <MasterPageHeader
        profile={profile || DEMO_PROFILE}
        counts={counts}
        onNavigateHome={onNavigateHome}
        onNavigateMasters={onNavigateMasters}
        onNavigateProfile={onNavigateProfile}
        onShowServices={showServices}
      />

      <main className="masterPageMain">
        {loading && <div className="cabinetNotice masterPageState">Загружаю страницу мастера...</div>}
        {error && <div className="cabinetError masterPageState">{error}</div>}
        {!loading && supabaseEnv.isConfigured && !profile && !error && (
          <div className="cabinetNotice masterPageState">
            <b>Публичная страница мастера не найдена.</b>
            <p>Профиль должен быть опубликован и одобрен, чтобы открываться в каталоге.</p>
          </div>
        )}

        {(profile || !supabaseEnv.isConfigured) && (
          <div className="masterPageLayout">
            <div ref={feedRef}>
              <MasterPageFeed
                activeTab={activeTab}
                onTabChange={setActiveTab}
                publications={publications}
                services={services}
                fallbackMode={fallbackMode}
              />
            </div>

            <aside className="masterPageAside" aria-label="Публичная информация мастера">
              <section className="masterPageAsideCard">
                <h2>О мастере</h2>
                <p>{profile?.bio || DEMO_PROFILE.bio}</p>
                {profileLocation(profile || DEMO_PROFILE) && (
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {profileLocation(profile || DEMO_PROFILE)}
                  </span>
                )}
              </section>

              <section className="masterPageAsideCard">
                <h2>Контакты</h2>
                <div className="masterPageContactList">
                  {(profile || DEMO_PROFILE).telegramUrl && (
                    <a href={(profile || DEMO_PROFILE).telegramUrl} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} aria-hidden="true" />
                      Telegram
                    </a>
                  )}
                  {(profile || DEMO_PROFILE).websiteUrl && (
                    <a href={(profile || DEMO_PROFILE).websiteUrl} target="_blank" rel="noreferrer">
                      <Globe2 size={16} aria-hidden="true" />
                      Сайт мастера
                    </a>
                  )}
                </div>
              </section>

              <section className="masterPageAsideCard masterPageQuoteCard">
                <Quote size={21} aria-hidden="true" />
                <p>Корни дают силу, ветви — мудрость, а свет внутри — путь.</p>
              </section>

              <section className="masterPageAsideCard masterPageStatusCard">
                <h2><Sprout size={17} aria-hidden="true" /> Статус практики</h2>
                <p>Работаю онлайн и очно. Запись открывается через услуги мастера.</p>
              </section>

              <section className="masterPageAsideCard masterPageSafetyCard">
                <h2><ShieldCheck size={17} aria-hidden="true" /> Публичная зона</h2>
                <p>Здесь видны только одобренные профильные материалы, открытые публикации и размещённые услуги мастера.</p>
              </section>

              <section className="masterPageAsideCard">
                <h2>Навигация</h2>
                <a href="/feed">
                  <ExternalLink size={16} aria-hidden="true" />
                  Лента сообщества
                </a>
                <button type="button" onClick={onNavigateMasters}>Каталог мастеров</button>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
