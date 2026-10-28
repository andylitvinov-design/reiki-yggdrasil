import React from "react";
import { ACCOUNT_PLANS } from "../../lib/powerPlaceClient.js";
import { formatCabinetId } from "../../lib/masterChatClient.js";
import {
  MASTER_PLAN_CONFIG,
  getMasterPlan,
  getMasterPlanPaymentLink,
  normalizeMasterPlan
} from "../../lib/masterPlans.js";

const MASTER_PROFILE_TITLE = "Профиль Мастера";

export default function ProfileLiteProfileModule({
  form,
  onFieldChange,
  onSave,
  profile,
  profileError,
  profileStatus,
  profileTitle,
  profileHelperText,
  saveMessage,
  saveStatus,
  shellChrome
}) {
  const activePlan = getMasterPlan(form.account_plan);
  const activePlanValue = activePlan.value;
  const title = profileTitle || profile?.display_name || "Новый профиль";
  const helperText = profileHelperText || "Редактируйте публичную карточку мастера, статус модерации и лимиты кабинета в той же светло-золотой рабочей оболочке.";
  const handlePaymentClick = (planValue) => {
    const link = getMasterPlanPaymentLink(planValue);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="profileLiteModule profileLiteProfileGrid profileTabContent mandalaWorkspace" aria-label="Профиль">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◉</div>
        <div>
          <p className="cabinetEyebrow">Профиль мастера</p>
          <h2>{title}</h2>
          <p>{helperText}</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{activePlan.label}</b> План</span>
          <span><b>{form.status || "draft"}</b> Статус</span>
          <span><b>{formatCabinetId(profile?.id)}</b> ID</span>
        </div>
      </div>
      {shellChrome}
      <form className="cabinetCard profileForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Профиль мастера</p>
            <h2>{title}</h2>
            {profile?.id && <small className="cabinetPublicId">ID: {formatCabinetId(profile.id)}</small>}
          </div>
          <span className={`cabinetStatus status-${form.status || "draft"}`}>{form.status || "draft"}</span>
        </div>

        {profileStatus === "loading" && <div className="cabinetNotice compactNotice">Профиль загружается...</div>}
        {profileError && <div className="cabinetError">{profileError}</div>}

        <label>
          Имя мастера
          <input value={form.display_name} onChange={(event) => onFieldChange("display_name", event.target.value)} placeholder="Имя для публикации" required />
        </label>
        <label>
          О себе
          <textarea value={form.bio} onChange={(event) => onFieldChange("bio", event.target.value)} placeholder="Практика, подход, чем вы помогаете ученикам" rows={5} />
        </label>
        <div className="cabinetTwoColumns">
          <label>
            Город
            <input value={form.city} onChange={(event) => onFieldChange("city", event.target.value)} placeholder="Город" />
          </label>
          <label>
            Страна
            <input value={form.country} onChange={(event) => onFieldChange("country", event.target.value)} placeholder="Страна" />
          </label>
        </div>
        <div className="cabinetTwoColumns">
          <label>
            Telegram
            <input value={form.telegram} onChange={(event) => onFieldChange("telegram", event.target.value)} placeholder="@username или ссылка" />
          </label>
          <label>
            Сайт
            <input value={form.website} onChange={(event) => onFieldChange("website", event.target.value)} placeholder="https://..." />
          </label>
        </div>
        <label>
          Аватар / фото URL
          <input value={form.avatar_url} onChange={(event) => onFieldChange("avatar_url", event.target.value)} placeholder="https://..." />
        </label>
        <section className="masterPlanSwitcher" aria-label="Тариф мастера">
          <div className="masterPlanSwitcherHeader">
            <div>
              <p className="cabinetEyebrow">Режим кабинета</p>
              <h3>Тариф мастера</h3>
            </div>
            <select value={activePlanValue} onChange={(event) => onFieldChange("account_plan", normalizeMasterPlan(event.target.value))} aria-label="Выбрать режим кабинета">
              {ACCOUNT_PLANS.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
            </select>
          </div>
          <div className="masterPlanCards">
            {MASTER_PLAN_CONFIG.map((plan) => {
              const isActive = activePlanValue === plan.value;
              const paymentLink = getMasterPlanPaymentLink(plan.value);
              return (
                <article className={`masterPlanCard${isActive ? " is-active" : ""}`} key={plan.value}>
                  <div className="masterPlanCardTop">
                    <div>
                      <h4>{plan.label}</h4>
                      <strong>{plan.priceLabel}</strong>
                    </div>
                    <input
                      aria-label={`Выбрать ${plan.label}`}
                      checked={isActive}
                      name="master-plan"
                      onChange={() => onFieldChange("account_plan", plan.value)}
                      type="radio"
                    />
                  </div>
                  <p>{plan.summary}</p>
                  <ul>
                    <li>{plan.limits.compositions} шаблонов / мест силы</li>
                    <li>{plan.limits.dailyPhotoUploads} фото в день</li>
                    <li>{plan.limits.clients} клиентов</li>
                    <li>{plan.limits.paidServices > 0 ? `${plan.limits.paidServices} платных услуг` : `${plan.limits.trialServices} пробных услуг`}</li>
                  </ul>
                  {plan.value !== "start" && (
                    <button className="cabinetSecondary" type="button" onClick={() => handlePaymentClick(plan.value)}>
                      {paymentLink ? plan.ctaLabel : "Оплата подключается"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <p className="powerPlanNote">План сохраняется в профиле. Для существующего legacy Pro кабинет показывает Practic; новые пользователи стартуют со Start.</p>
        {saveMessage && <div className="cabinetSuccess compactNotice">{saveMessage}</div>}
        <div className="cabinetActions">
          <button className="cabinetPrimary" type="submit" disabled={saveStatus === "loading"}>Сохранить черновик</button>
          <button className="cabinetSecondary" type="button" disabled={saveStatus === "loading"} onClick={() => onSave("pending")}>Отправить на модерацию</button>
        </div>
      </form>

      <aside className="cabinetCard cabinetPreview">
        <p className="cabinetEyebrow">Как это будет выглядеть</p>
        <div className="masterPreviewImage" style={form.avatar_url ? { backgroundImage: `url(${form.avatar_url})` } : undefined}>◎</div>
        <h3>{form.display_name || "Имя мастера"}</h3>
        <p>{form.bio || "Здесь появится описание мастера, практик, мандал и артефактов."}</p>
        <small>{[form.city, form.country].filter(Boolean).join(", ") || "Локация не указана"}</small>
      </aside>
    </section>
  );
}
