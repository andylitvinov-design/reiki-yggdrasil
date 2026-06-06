import React from "react";
import { ArrowLeft, BriefcaseBusiness, LayoutGrid, UserRound } from "lucide-react";

function locationText(profile) {
  return [profile?.city, profile?.country].filter(Boolean).join(", ");
}

export default function MasterPageHeader({
  profile,
  counts,
  onNavigateHome,
  onNavigateMasters,
  onNavigateProfile,
  onShowServices
}) {
  const place = locationText(profile);

  return (
    <header className="masterPageHeader">
      <nav className="masterPageTopbar" aria-label="Навигация страницы мастера">
        <button type="button" onClick={onNavigateHome}>
          <ArrowLeft size={16} aria-hidden="true" />
          На главную
        </button>
        <span>Reiki Yggdrasil / Mentalica</span>
        <button type="button" onClick={onNavigateMasters}>
          <LayoutGrid size={16} aria-hidden="true" />
          Каталог мастеров
        </button>
      </nav>

      <div className="masterPageCover" aria-label="Обложка мастера">
        <div className="masterPageCoverMark">Mentalica</div>
      </div>

      <section className="masterPageIdentity" aria-label="Профиль мастера">
        <div className="masterPageAvatar" style={profile?.avatarUrl ? { backgroundImage: `url("${profile.avatarUrl}")` } : undefined}>
          {!profile?.avatarUrl && <span>◎</span>}
        </div>

        <div className="masterPageIdentityText">
          <p className="cabinetEyebrow">{profile?.role || "Мастер Рейки Иггдрасиль"}</p>
          <h1>{profile?.displayName || "Публичная страница мастера"}</h1>
          <p>{profile?.bio || "Мастерская страница готовится: здесь будут публичные заметки, статьи, мандалы, услуги и материалы."}</p>
          {place && <small>{place}</small>}
          <dl className="masterPageCounters" aria-label="Публичная активность мастера">
            <div><dt>Публикации</dt><dd>{counts.publications}</dd></div>
            <div><dt>Услуги</dt><dd>{counts.services}</dd></div>
            <div><dt>Материалы</dt><dd>{counts.materials}</dd></div>
          </dl>
        </div>

        <div className="masterPageActions">
          <button className="cabinetSecondary" type="button" onClick={onNavigateProfile}>
            <UserRound size={16} aria-hidden="true" />
            Мой кабинет
          </button>
          <button className="cabinetGhost" type="button" onClick={onNavigateMasters}>
            <LayoutGrid size={16} aria-hidden="true" />
            Каталог мастеров
          </button>
          <button className="cabinetPrimary" type="button" onClick={onShowServices}>
            <BriefcaseBusiness size={16} aria-hidden="true" />
            Услуги / Записаться
          </button>
        </div>
      </section>
    </header>
  );
}
