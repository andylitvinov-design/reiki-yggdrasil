import React from "react";
import { BookOpenText, BriefcaseBusiness, FileText, Image, NotebookText, Sparkles } from "lucide-react";

const KIND_LABELS = {
  note: "Заметка",
  article: "Статья",
  mandala: "Мандала",
  service: "Услуга",
  material: "Материал"
};

const KIND_ICONS = {
  note: NotebookText,
  article: BookOpenText,
  mandala: Sparkles,
  service: BriefcaseBusiness,
  material: FileText
};

function formatDate(value) {
  if (!value) return "Дата готовится";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата готовится";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatPrice(item) {
  if (item.kind !== "service") return "";
  if (!item.priceAmount) return "Бесплатно";
  return `${item.priceAmount} ${item.priceCurrency || "EUR"}`;
}

export default function MasterPagePostCard({ item }) {
  const Icon = KIND_ICONS[item.kind] || Image;
  const price = formatPrice(item);
  const serviceHref = item.kind === "service" && item.id ? `/services/${encodeURIComponent(item.id)}` : "";

  return (
    <article className={`masterPagePost masterPagePost--${item.kind}`}>
      <div className="masterPagePostMeta">
        <span className="masterPagePostBadge"><Icon size={15} aria-hidden="true" /> {KIND_LABELS[item.kind] || "Публикация"}</span>
        {item.isFallback && <span className="masterPagePostBadge masterPagePostBadge--demo">пример раздела</span>}
        {price && <span className="masterPagePostBadge masterPagePostBadge--price">{price}</span>}
      </div>

      {item.imageUrl ? (
        <div className="masterPagePostImage" style={{ backgroundImage: `url("${item.imageUrl}")` }} aria-label={item.title} />
      ) : (
        <div className="masterPagePostImage masterPagePostImage--fallback" aria-label="Публичная обложка не добавлена">
          <Icon size={44} aria-hidden="true" />
        </div>
      )}

      <div className="masterPagePostBody">
        <h2>{item.title}</h2>
        <p>{item.description || "Описание готовится для публичной страницы мастера."}</p>
        <div className="masterPagePostFooter">
          <span>{formatDate(item.createdAt || item.updatedAt)}</span>
          {item.category && <span>{item.category}</span>}
        </div>
        {serviceHref && (
          <a className="masterPagePostLink" href={serviceHref}>
            Открыть услугу
          </a>
        )}
      </div>
    </article>
  );
}
