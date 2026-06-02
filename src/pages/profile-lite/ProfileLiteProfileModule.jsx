import React from "react";
import { ACCOUNT_PLANS } from "../../lib/powerPlaceClient.js";
import { formatCabinetId } from "../../lib/masterChatClient.js";

export default function ProfileLiteProfileModule({
  form,
  onFieldChange,
  onSave,
  profile,
  profileError,
  profileStatus,
  saveMessage,
  saveStatus
}) {
  return (
    <section className="profileLiteModule profileLiteProfileGrid profileTabContent" aria-label="Профиль">
      <form className="cabinetCard profileForm" onSubmit={(event) => { event.preventDefault(); onSave("draft"); }}>
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Профиль мастера</p>
            <h2>{profile?.display_name || "Новый профиль"}</h2>
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
          Описание
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
        <label>
          План кабинета
          <select value={form.account_plan} onChange={(event) => onFieldChange("account_plan", event.target.value)}>
            {ACCOUNT_PLANS.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}
          </select>
        </label>
        <p className="powerPlanNote">Start: 7 мест силы и 10 фото клиентов. Pro: 20 мест силы и 30 фото. Биллинг: needs verification.</p>
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
