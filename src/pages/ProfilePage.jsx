import React, { useEffect, useMemo, useState } from "react";
import { reikiSteps } from "../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import {
  clearStoredSession,
  createOwnerMaterial,
  getCurrentUser,
  getOwnProfile,
  getStoredSession,
  listOwnMaterials,
  sendMagicLink,
  signInWithGoogle,
  storeSessionFromUrlHash,
  submitOwnProfile,
  supabaseEnv,
  saveOwnProfile
} from "../lib/supabaseClient.js";
import {
  MATERIAL_TYPES,
  createEmptyMaterialForm,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel
} from "../lib/profileMaterials.js";

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

function getStepSettings(stepId) {
  const step = reikiSteps.find((item) => item.id === stepId);
  return sourcedStepSettings[stepId] || step?.settings || [];
}

function createInitialMaterialForm() {
  const base = createEmptyMaterialForm();
  const step = reikiSteps[0];
  const setting = getStepSettings(step?.id)?.[0];

  return {
    ...base,
    step_id: step?.id || "",
    step_title: step?.title || "",
    setting_title: setting?.title || "",
    setting_index: setting ? 0 : null
  };
}

function normalizeProfile(profile, user) {
  return {
    ...EMPTY_PROFILE,
    ...(profile || {}),
    user_id: profile?.user_id || user?.id || ""
  };
}

export default function ProfilePage({ onNavigateHome, onNavigateMasters }) {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [materials, setMaterials] = useState([]);
  const [materialForm, setMaterialForm] = useState(() => createInitialMaterialForm());
  const [loading, setLoading] = useState(Boolean(supabaseEnv.isConfigured));
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedMaterialStep = useMemo(
    () => reikiSteps.find((step) => step.id === materialForm.step_id) || reikiSteps[0],
    [materialForm.step_id]
  );

  const selectedMaterialSettings = useMemo(
    () => getStepSettings(selectedMaterialStep?.id),
    [selectedMaterialStep?.id]
  );

  const statusText = useMemo(() => {
    if (profile.status === "approved") return "опубликован";
    if (profile.status === "pending") return "на модерации";
    if (profile.status === "rejected") return "нужна правка";
    return "черновик";
  }, [profile.status]);

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
        const currentMaterials = currentProfile?.id
          ? await listOwnMaterials(currentProfile.id, session)
          : [];

        if (!cancelled) {
          setUser(currentUser);
          setProfile(normalizeProfile(currentProfile, currentUser));
          setMaterials(currentMaterials || []);
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

  const updateField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const updateMaterialField = (field, value) => {
    setMaterialForm((current) => ({ ...current, [field]: value }));
  };

  const handleMaterialStepChange = (stepId) => {
    const step = reikiSteps.find((item) => item.id === stepId) || reikiSteps[0];
    const settings = getStepSettings(step.id);
    const firstSetting = settings[0];

    setMaterialForm((current) => ({
      ...current,
      step_id: step.id,
      step_title: step.title,
      setting_title: firstSetting?.title || "",
      setting_index: firstSetting ? 0 : null
    }));
  };

  const handleMaterialSettingChange = (value) => {
    const index = value === "" ? null : Number(value);
    const setting = Number.isInteger(index) ? selectedMaterialSettings[index] : null;

    setMaterialForm((current) => ({
      ...current,
      setting_title: setting?.title || "",
      setting_index: setting ? index : null
    }));
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

  const handleGoogleLogin = () => {
    setMessage("");
    setError("");

    try {
      signInWithGoogle();
    } catch (err) {
      setError(err.message || "Не удалось начать вход через Google.");
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

  const ensureProfileForMaterials = async () => {
    if (profile.id) return profile;

    const saved = await saveOwnProfile({
      ...profile,
      user_id: user.id,
      status: profile.status || "draft",
      updated_at: new Date().toISOString()
    }, session);
    const normalized = normalizeProfile(saved, user);
    setProfile(normalized);
    return normalized;
  };

  const handleMaterialSave = async (requestedStatus) => {
    setMessage("");
    setError("");
    setMaterialsLoading(true);

    try {
      const ownerProfile = await ensureProfileForMaterials();
      const payload = normalizeMaterialForm(materialForm, requestedStatus);

      if (!payload.title) throw new Error("Укажите название материала.");
      if (!payload.step_id) throw new Error("Выберите ступень Рейки Иггдрасиль.");

      const saved = await createOwnerMaterial(ownerProfile.id, payload, session);

      setMaterials((current) => [saved, ...current]);
      setMaterialForm(createInitialMaterialForm());
      setMessage(payload.status === "pending" ? "Материал отправлен на модерацию." : "Черновик материала сохранён.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить материал.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setMaterials([]);
    setMaterialForm(createInitialMaterialForm());
    setMessage("Вы вышли из кабинета.");
  };

  if (!supabaseEnv.isConfigured) {
    return (
      <CabinetShell title="Кабинет мастера" onNavigateHome={onNavigateHome} onNavigateMasters={onNavigateMasters}>
        <div className="cabinetNotice">
          <b>Кабинет мастера подготовлен, но Supabase ещё не подключён.</b>
          <p>Нужно настроить env names в Vercel: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY. Значения не должны храниться в repo.</p>
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
          <p className="cabinetEyebrow">Вход мастера</p>
          <h2>Войдите, чтобы создать профиль мастера</h2>
          <p>Войдите через Google или используйте email-ссылку. После входа можно заполнить профиль и отправить его на модерацию.</p>
          <button className="cabinetGoogle" type="button" onClick={handleGoogleLogin}>Войти через Google</button>
          <div className="authDivider">или войдите по email</div>
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

          <section className="cabinetCard materialCabinet">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Мандалы и материалы по Рейки Иггдрасиль</p>
                <h2>Создать материал</h2>
              </div>
            </div>

            <form className="profileForm materialForm" onSubmit={(event) => { event.preventDefault(); handleMaterialSave("draft"); }}>
              <div className="cabinetThreeColumns">
                <label>
                  Тип
                  <select value={materialForm.type} onChange={(event) => updateMaterialField("type", event.target.value)}>
                    {MATERIAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Ступень
                  <select value={materialForm.step_id} onChange={(event) => handleMaterialStepChange(event.target.value)}>
                    {reikiSteps.map((step) => (
                      <option key={step.id} value={step.id}>{step.label} {step.number}. {step.title}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Настройка
                  <select value={materialForm.setting_index ?? ""} onChange={(event) => handleMaterialSettingChange(event.target.value)}>
                    <option value="">Без настройки</option>
                    {selectedMaterialSettings.map((setting, index) => (
                      <option key={`${setting.title}-${index}`} value={index}>{setting.title}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Название
                <input value={materialForm.title} onChange={(event) => updateMaterialField("title", event.target.value)} placeholder="Например: Мандала настройки «Лечение»" required />
              </label>

              <label>
                Описание
                <textarea value={materialForm.description} onChange={(event) => updateMaterialField("description", event.target.value)} placeholder="Опишите смысл, применение и связь с выбранной ступенью." rows={5} />
              </label>

              <label>
                Изображение URL
                <input value={materialForm.image_url} onChange={(event) => updateMaterialField("image_url", event.target.value)} placeholder="https://..." />
              </label>

              <div className="cabinetActions">
                <button className="cabinetPrimary" type="submit" disabled={materialsLoading}>Сохранить черновик</button>
                <button className="cabinetSecondary" type="button" disabled={materialsLoading} onClick={() => handleMaterialSave("pending")}>Отправить на модерацию</button>
              </div>
            </form>
          </section>

          <section className="materialList">
            <div className="cabinetFormHeader">
              <div>
                <p className="cabinetEyebrow">Сохранённые материалы</p>
                <h2>{materials.length ? `${materials.length} в кабинете` : "Пока нет материалов"}</h2>
              </div>
            </div>

            {materials.length === 0 ? (
              <div className="cabinetNotice">Создайте первый черновик мандалы, артефакта или практики.</div>
            ) : (
              <div className="materialCards">
                {materials.map((material) => (
                  <article className="cabinetCard materialCard" key={material.id}>
                    {material.image_url && <div className="materialImage" style={{ backgroundImage: `url(${material.image_url})` }} />}
                    <div>
                      <p className="cabinetEyebrow">{publicationTypeLabel(material.type)} · {materialStatusText(material.status)}</p>
                      <h3>{material.title || "Без названия"}</h3>
                      <p>{material.description || "Описание не заполнено."}</p>
                      <small>{[material.step_title, material.setting_title].filter(Boolean).join(" · ") || "Ступень не указана"}</small>
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
