import React, { useEffect, useMemo, useState } from "react";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import { createOwnMaterial, listOwnMaterials } from "../lib/profileMaterialsClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getOwnProfile,
  getStoredSession,
  sendMagicLink,
  storeSessionFromUrlHash,
  submitOwnProfile,
  supabaseEnv,
  saveOwnProfile
} from "../lib/supabaseClient.js";

const EMPTY_PROFILE = {
  display_name: "",
  bio: "",
  city: "",
  country: "",
  telegram: "",
  website: "",
  avatar_url: "",
  status: "draft"
};

const stepOptions = reikiLevels.flatMap((level) =>
  level.steps.map((step) => ({
    ...step,
    levelId: level.id,
    levelName: level.name,
    fullLabel: `Уровень ${level.id} · ${level.name} · ${step.label || level.stepLabel || "Ступень"} ${step.number}: ${step.title}`
  }))
);

const firstStep = stepOptions[0];
const firstSettings = sourcedStepSettings[firstStep?.id] || firstStep?.settings || [];

const EMPTY_MATERIAL = {
  type: "mandala",
  title: "",
  description: "",
  image_url: "",
  step_id: firstStep?.id || "",
  step_title: firstStep?.title || "",
  setting_title: firstSettings[0]?.title || "",
  setting_index: firstSettings.length > 0 ? 0 : null,
  status: "draft"
};

function normalizeProfile(profile, user) {
  return {
    ...EMPTY_PROFILE,
    ...(profile || {}),
    user_id: profile?.user_id || user?.id || ""
  };
}

function settingsForStep(stepId) {
  const step = stepOptions.find((item) => item.id === stepId);
  return sourcedStepSettings[stepId] || step?.settings || [];
}

function buildMaterialPayload(form, profileId, nextStatus) {
  const step = stepOptions.find((item) => item.id === form.step_id) || firstStep;
  const settings = settingsForStep(step?.id);
  const selectedSettingIndex = settings.findIndex((item) => item.title === form.setting_title);

  return {
    profile_id: profileId,
    type: form.type || "mandala",
    title: form.title.trim(),
    description: form.description.trim(),
    image_url: form.image_url.trim(),
    status: nextStatus,
    step_id: step?.id || "",
    step_title: step?.title || "",
    setting_title: form.setting_title || "",
    setting_index: selectedSettingIndex >= 0 ? selectedSettingIndex : null,
    updated_at: new Date().toISOString()
  };
}

export default function ProfilePage({ onNavigateHome, onNavigateMasters }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState(EMPTY_MATERIAL);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const statusText = useMemo(() => {
    if (profile.status === "approved") return "опубликован";
    if (profile.status === "pending") return "на модерации";
    if (profile.status === "rejected") return "нужна правка";
    return "черновик";
  }, [profile.status]);

  const activeSettings = useMemo(() => settingsForStep(materialForm.step_id), [materialForm.step_id]);

  useEffect(() => {
    const nextSession = storeSessionFromUrlHash();
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseEnv.isConfigured) {
        setLoading(false);
        return;
      }

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const currentUser = await getCurrentUser(session);
        const currentProfile = await getOwnProfile(currentUser.id, session);

        if (!cancelled) {
          setUser(currentUser);
          setProfile(normalizeProfile(currentProfile, currentUser));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить профиль.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    async function loadMaterials() {
      if (!profile?.id || !session?.access_token) {
        setMaterials([]);
        return;
      }

      setMaterialsLoading(true);

      try {
        const rows = await listOwnMaterials(profile.id, session);
        if (!cancelled) setMaterials(rows || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить мандалы и материалы.");
      } finally {
        if (!cancelled) setMaterialsLoading(false);
      }
    }

    loadMaterials();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, session]);

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const updateMaterialField = (field, value) => {
    setMaterialForm((current) => {
      if (field === "step_id") {
        const step = stepOptions.find((item) => item.id === value) || firstStep;
        const settings = settingsForStep(value);

        return {
          ...current,
          step_id: value,
          step_title: step?.title || "",
          setting_title: settings[0]?.title || "",
          setting_index: settings.length > 0 ? 0 : null
        };
      }

      if (field === "setting_title") {
        const index = activeSettings.findIndex((item) => item.title === value);
        return { ...current, setting_title: value, setting_index: index >= 0 ? index : null };
      }

      return { ...current, [field]: value };
    });
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendMagicLink(email.trim());
      setMessage("Письмо для входа отправлено. Откройте ссылку из письма на этом устройстве.");
    } catch (err) {
      setError(err.message || "Не удалось отправить ссылку для входа.");
    }
  };

  const handleSave = async (requestedStatus) => {
    setMessage("");
    setError("");

    try {
      const nextStatus = requestedStatus || (profile.status === "approved" ? "pending" : profile.status || "draft");
      const isApprovedResubmission = profile.status === "approved" && nextStatus === "pending";
      const payload = {
        ...profile,
        user_id: user.id,
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      const saved = nextStatus === "pending"
        ? await submitOwnProfile(payload, session)
        : await saveOwnProfile(payload, session);

      setProfile(normalizeProfile(saved, user));
      setMessage(isApprovedResubmission ? "Профиль обновлён и отправлен на повторную модерацию." : nextStatus === "pending" ? "Профиль отправлен на модерацию." : "Профиль сохранён.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить профиль.");
    }
  };

  const handleMaterialSave = async (nextStatus = "draft") => {
    setMessage("");
    setError("");

    if (!profile?.id) {
      setError("Сначала сохраните профиль мастера, затем добавляйте мандалы и материалы.");
      return;
    }

    if (!materialForm.title.trim()) {
      setError("Добавьте название мандалы или материала.");
      return;
    }

    try {
      const saved = await createOwnMaterial(buildMaterialPayload(materialForm, profile.id, nextStatus), session);
      setMaterials((current) => [saved, ...current]);
      setMaterialForm({ ...EMPTY_MATERIAL, step_id: materialForm.step_id, step_title: materialForm.step_title, setting_title: materialForm.setting_title, setting_index: materialForm.setting_index });
      setMessage(nextStatus === "pending" ? "Мандала отправлена на модерацию." : "Мандала сохранена как черновик.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить мандалу.");
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setMaterials([]);
    setMaterialForm(EMPTY_MATERIAL);
    setMessage("Вы вышли из кабинета.");
  };

  if (!supabaseEnv.isConfigured) {
    return (
      <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
        <div className="cabinetNotice">
          <b>Кабинет мастера подготовлен, но Supabase ещё не подключён.</b>
          <p>Нужно настроить env names в Vercel: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Значения не должны храниться в repo.</p>
        </div>
        <div className="cabinetNotice">
          <b>Мандалы по ступеням и настройкам тоже подготовлены как UI/MVP.</b>
          <p>После применения migration и настройки Supabase в кабинете появится форма выбора 37 ступеней и их настроек.</p>
        </div>
      </CabinetShell>
    );
  }

  return (
    <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
      {loading && <div className="cabinetNotice">Загружаю кабинет...</div>}
      {error && <div className="cabinetError">{error}</div>}
      {message && <div className="cabinetSuccess">{message}</div>}

      {!loading && !user && (
        <form className="cabinetCard authCard" onSubmit={handleMagicLink}>
          <p className="cabinetEyebrow">Вход по email</p>
          <h2>Войдите, чтобы создать профиль мастера</h2>
          <p>Мы отправим магическую ссылку для входа. После входа можно заполнить профиль и отправить его на модерацию.</p>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="you@example.com" />
          </label>
          <button className="cabinetPrimary" type="submit">Отправить ссылку для входа</button>
        </form>
      )}

      {!loading && user && (
        <>
          <div className="cabinetGrid">
            <form className="cabinetCard profileForm" onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Профиль мастера</p>
                  <h2>{profile.display_name || "Новый профиль"}</h2>
                </div>
                <span className={`cabinetStatus status-${profile.status || "draft"}`}>{statusText}</span>
              </div>

              <label>
                Имя мастера
                <input value={profile.display_name} onChange={(event) => updateField("display_name", event.target.value)} placeholder="Например: Андрей Ли" required />
              </label>

              <label>
                Описание
                <textarea value={profile.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Кратко опишите практики, подход и чем вы можете быть полезны ученикам." rows={6} />
              </label>

              <div className="cabinetTwoColumns">
                <label>
                  Город
                  <input value={profile.city || ""} onChange={(event) => updateField("city", event.target.value)} placeholder="Город" />
                </label>
                <label>
                  Страна
                  <input value={profile.country || ""} onChange={(event) => updateField("country", event.target.value)} placeholder="Страна" />
                </label>
              </div>

              <div className="cabinetTwoColumns">
                <label>
                  Telegram
                  <input value={profile.telegram || ""} onChange={(event) => updateField("telegram", event.target.value)} placeholder="@username или ссылка" />
                </label>
                <label>
                  Сайт
                  <input value={profile.website || ""} onChange={(event) => updateField("website", event.target.value)} placeholder="https://..." />
                </label>
              </div>

              <label>
                Аватар / фото URL
                <input value={profile.avatar_url || ""} onChange={(event) => updateField("avatar_url", event.target.value)} placeholder="https://..." />
              </label>

              <div className="cabinetActions">
                <button className="cabinetPrimary" type="submit">{profile.status === "approved" ? "Сохранить и отправить на модерацию" : "Сохранить черновик"}</button>
                <button className="cabinetSecondary" type="button" onClick={() => handleSave("pending")}>Отправить на модерацию</button>
                <button className="cabinetGhost" type="button" onClick={handleLogout}>Выйти</button>
              </div>
            </form>

            <aside className="cabinetCard cabinetPreview">
              <p className="cabinetEyebrow">Как это будет выглядеть</p>
              <div className="masterPreviewImage" style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}>◎</div>
              <h3>{profile.display_name || "Имя мастера"}</h3>
              <p>{profile.bio || "Здесь появится описание мастера, практик, мандал и артефактов."}</p>
              <small>{[profile.city, profile.country].filter(Boolean).join(", ") || "Локация не указана"}</small>
            </aside>
          </div>

          <section className="cabinetCard materialBuilder">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Мандалы и материалы по Рейки Иггдрасиль</p>
                <h2>Добавить мандалу по ступени и настройке</h2>
              </div>
              <span className="cabinetStatus">37 ступеней</span>
            </div>

            {!profile?.id && (
              <div className="cabinetNotice compactNotice">
                Сначала сохраните профиль мастера. После этого можно добавлять мандалы, артефакты и практики.
              </div>
            )}

            <div className="cabinetTwoColumns">
              <label>
                Тип материала
                <select value={materialForm.type} onChange={(event) => updateMaterialField("type", event.target.value)}>
                  <option value="mandala">Мандала</option>
                  <option value="artifact">Артефакт</option>
                  <option value="practice">Практика</option>
                </select>
              </label>

              <label>
                Ступень / уровень
                <select value={materialForm.step_id} onChange={(event) => updateMaterialField("step_id", event.target.value)}>
                  {stepOptions.map((step) => (
                    <option value={step.id} key={step.id}>{step.fullLabel}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Настройка этой ступени
              <select value={materialForm.setting_title} onChange={(event) => updateMaterialField("setting_title", event.target.value)}>
                {activeSettings.length === 0 && <option value="">Настройки уточняются</option>}
                {activeSettings.map((setting, index) => (
                  <option value={setting.title} key={`${setting.title}-${index}`}>{setting.title}</option>
                ))}
              </select>
            </label>

            <label>
              Название
              <input value={materialForm.title} onChange={(event) => updateMaterialField("title", event.target.value)} placeholder="Например: Мандала денежной активации" />
            </label>

            <label>
              Описание / инструкция
              <textarea value={materialForm.description} onChange={(event) => updateMaterialField("description", event.target.value)} rows={4} placeholder="Что делает мандала, как использовать, для какой задачи создана." />
            </label>

            <label>
              URL изображения / мандалы
              <input value={materialForm.image_url} onChange={(event) => updateMaterialField("image_url", event.target.value)} placeholder="https://..." />
            </label>

            <div className="cabinetActions">
              <button className="cabinetPrimary" type="button" disabled={!profile?.id} onClick={() => handleMaterialSave("draft")}>Сохранить мандалу</button>
              <button className="cabinetSecondary" type="button" disabled={!profile?.id} onClick={() => handleMaterialSave("pending")}>Отправить на модерацию</button>
            </div>

            <div className="materialHint">
              Выбранная связка: <b>{materialForm.step_id}</b> · {materialForm.step_title || "ступень"} · {materialForm.setting_title || "настройка уточняется"}
            </div>
          </section>

          <section className="cabinetCard materialsList">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Мои материалы</p>
                <h2>Черновики и заявки</h2>
              </div>
              <span className="cabinetStatus">{materials.length}</span>
            </div>

            {materialsLoading && <p>Загружаю материалы...</p>}
            {!materialsLoading && materials.length === 0 && <p>Пока нет мандал и материалов. Добавьте первый материал выше.</p>}

            {materials.length > 0 && (
              <div className="materialsGrid">
                {materials.map((item) => (
                  <article className="materialCard" key={item.id}>
                    {item.image_url ? <div className="materialThumb" style={{ backgroundImage: `url(${item.image_url})` }} /> : <div className="materialThumb">✦</div>}
                    <div>
                      <p className="cabinetEyebrow">{item.type} · {item.status}</p>
                      <h3>{item.title}</h3>
                      <p>{item.description || "Описание не заполнено."}</p>
                      <small>{item.step_id} · {item.step_title} · {item.setting_title}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </CabinetShell>
  );
}

function CabinetShell({ title, children, onNavigateHome, onNavigateMasters }) {
  return (
    <div className="cabinetShell">
      <header className="cabinetTopbar">
        <button type="button" onClick={onNavigateHome}>← На главную</button>
        <div>
          <p>Reiki Yggdrasil</p>
          <h1>{title}</h1>
        </div>
        <button type="button" onClick={onNavigateMasters}>Каталог мастеров →</button>
      </header>
      <main className="cabinetMain">{children}</main>
    </div>
  );
}
