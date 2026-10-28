import React, { useMemo } from "react";
import { BookOpenText, BriefcaseBusiness, FileText, LayoutGrid, NotebookText, Sparkles } from "lucide-react";
import { MASTER_PAGE_TABS } from "../../lib/profilePublicMasterClient.js";
import MasterPagePostCard from "./MasterPagePostCard.jsx";

const DEMO_ITEMS = [
  {
    id: "demo-note",
    kind: "note",
    title: "Короткая заметка мастера",
    description: "Пример публичной заметки: мягкое наблюдение, настройка недели или объявление для учеников.",
    category: "заметка",
    isFallback: true
  },
  {
    id: "demo-article",
    kind: "article",
    title: "Статья о практике и внимании",
    description: "Здесь появятся авторские статьи мастера после публикации и модерации.",
    category: "статья",
    isFallback: true
  },
  {
    id: "demo-mandala",
    kind: "mandala",
    title: "Мандала Места Силы",
    description: "Публичная карточка мандалы будет показывать только безопасную обложку и описание.",
    category: "мандала",
    isFallback: true
  },
  {
    id: "demo-service",
    kind: "service",
    title: "Индивидуальная настройка",
    description: "Пример услуги: консультация, мандала или публично описанный формат работы мастера.",
    priceAmount: null,
    priceCurrency: "EUR",
    category: "услуга",
    isFallback: true
  },
  {
    id: "demo-material",
    kind: "material",
    title: "Публичный материал мастерской",
    description: "Материалы из Гримуара появятся здесь только после явной публичной публикации.",
    category: "материал",
    isFallback: true
  }
];

const TAB_ICONS = {
  all: LayoutGrid,
  notes: NotebookText,
  articles: BookOpenText,
  mandalas: Sparkles,
  services: BriefcaseBusiness,
  materials: FileText
};

function tabMatches(tabId, item) {
  if (tabId === "all") return true;
  if (tabId === "notes") return item.kind === "note";
  if (tabId === "articles") return item.kind === "article";
  if (tabId === "mandalas") return item.kind === "mandala";
  if (tabId === "services") return item.kind === "service";
  if (tabId === "materials") return item.kind === "material";
  return true;
}

export default function MasterPageFeed({ activeTab, onTabChange, publications, services, fallbackMode }) {
  const realItems = useMemo(
    () => [...(publications || []), ...(services || [])].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    }),
    [publications, services]
  );
  const items = realItems.length > 0 ? realItems : DEMO_ITEMS;
  const visibleItems = items.filter((item) => tabMatches(activeTab, item));
  const activeLabel = MASTER_PAGE_TABS.find((tab) => tab.id === activeTab)?.label || "Все";

  return (
    <section className="masterPageFeed" aria-label="Публичная лента мастера">
      <div className="masterPageTabs" role="tablist" aria-label="Фильтр публикаций мастера">
        {MASTER_PAGE_TABS.map((tab) => (
          (() => {
            const Icon = TAB_ICONS[tab.id] || LayoutGrid;
            return (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`masterPageTab ${activeTab === tab.id ? "masterPageTab--active" : ""}`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={16} aria-hidden="true" />
            {tab.label}
          </button>
            );
          })()
        ))}
      </div>

      {fallbackMode && (
        <div className="masterPageNotice">
          <b>{fallbackMode === "demo" ? "Демо-вид страницы мастера." : "Публичные публикации пока не добавлены."}</b>
          <p>
            {fallbackMode === "demo"
              ? "Supabase не подключён в этом окружении, поэтому ниже показаны изолированные примеры карточек без сохранения в базу."
              : "После публикации заметок, статей, мандал, услуг и материалов они появятся в этой ленте."}
          </p>
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="masterPageNotice">
          <b>В разделе «{activeLabel}» пока нет публичных карточек.</b>
          <p>Переключите фильтр или вернитесь позже после публикации материалов мастера.</p>
        </div>
      ) : (
        <div className="masterPageFeedList">
          {visibleItems.map((item) => <MasterPagePostCard item={item} key={`${item.source || "fallback"}-${item.id}`} />)}
        </div>
      )}
    </section>
  );
}
