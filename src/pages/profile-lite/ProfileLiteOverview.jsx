import React from "react";
import { formatCabinetId } from "../../lib/masterChatClient.js";

export default function ProfileLiteOverview({ moduleStates, profile, user }) {
  const cards = [
    ["Профиль", profile?.status || "needs verification"],
    ["Мои мандалы", `${moduleStates.mandalas.count} сохранено`],
    ["Фото / Медиа", `${moduleStates.media.count} объектов`],
    ["Материалы", `${moduleStates.materials.count} записей`],
    ["Услуги", moduleStates.services.status],
    ["Заказы", moduleStates.orders.status],
    ["Чаты", moduleStates.chats.status]
  ];

  return (
    <section className="profileLiteModule profileLiteOverview" aria-label="Обзор">
      <div className="cabinetCard profileLiteHeroCard">
        <p className="cabinetEyebrow">Обзор</p>
        <h2>{profile?.display_name || user?.email || "Кабинет мастера"}</h2>
        <p>{profile?.bio || "Профиль загружается отдельно от оболочки. Ошибка профиля не блокирует остальные вкладки."}</p>
        <small>ID: {formatCabinetId(profile?.id)}</small>
      </div>
      <div className="profileLiteMetricGrid">
        {cards.map(([label, value]) => (
          <article className="cabinetCard profileLiteMetric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
