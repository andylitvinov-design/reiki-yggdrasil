import React from "react";
import { ArrowRight, BookOpenText, BriefcaseBusiness, CalendarDays, Download, FileText, Image, NotebookText, Sparkles } from "lucide-react";

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

function actionLabel(item) {
  if (item.kind === "service") return "Записаться";
  if (item.kind === "material") return "Скачать";
  return "Читать далее";
}

export default function MasterPagePostCard({ item }) {
  const Icon = KIND_ICONS[item.kind] || Image;
  const price = formatPrice(item);
  const serviceHref = item.kind === "service" && item.id ? `/services/${encodeURIComponent(item.id)}` : "";
  const ActionIcon = item.kind === "material" ? Download : ArrowRight;

  return (
    <article className={`masterPagePost masterPagePost--${item.kind}`}>
      {item.imageUrl ? (
        <div className="masterPagePostImage" style={{ backgroundImage: `url("${item.imageUrl}")` }} aria-label={item.title} />
      ) : (
        <div className="masterPagePostImage masterPagePostImage--fallback" aria-label="Публичная обложка не добавлена">
          <Icon size={44} aria-hidden="true" />
        </div>
      )}

      <div className="masterPagePostBody">
        <div className="masterPagePostMeta">
          <span className="masterPagePostBadge"><Icon size={15} aria-hidden="true" /> {KIND_LABELS[item.kind] || "Публикация"}</span>
          {item.isFallback && <span className="masterPagePostBadge masterPagePostBadge--demo">пример</span>}
          {price && <span className="masterPagePostBadge masterPagePostBadge--price">{price}</span>}
        </div>
        <div className="masterPagePostTitleRow">
          <h2>{item.title}</h2>
          <span className="masterPagePostDate">
            <CalendarDays size={15} aria-hidden="true" />
            {formatDate(item.createdAt || item.updatedAt)}
          </span>
        </div>
        <p>{item.description || "Описание готовится для публичной страницы мастера."}</p>
        <div className="masterPagePostFooter">
          {item.category && <span>{item.category}</span>}
          {serviceHref ? (
            <a className="masterPagePostLink" href={serviceHref}>
              {actionLabel(item)}
              <ActionIcon size={15} aria-hidden="true" />
            </a>
          ) : (
            <span className="masterPagePostLink">
              {actionLabel(item)}
              <ActionIcon size={15} aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
