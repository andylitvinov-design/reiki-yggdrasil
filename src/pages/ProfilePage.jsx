import React, { useEffect, useMemo, useState } from "react";
import { reikiLevels } from "../data/reikiKnowledgeBase.js";
import { sourcedStepSettings } from "../data/reikiStepSettings.js";
import {
  MATERIAL_TYPES,
  createEmptyMaterialForm,
  createOwnMaterial,
  listOwnMaterials,
  materialStatusText,
  normalizeMaterialForm,
  publicationTypeLabel
} from "../lib/profileMaterialsClient.js";
import {
  clearStoredSession,
  getCurrentUser,
  getOwnProfile,
  getStoredSession,
  sendMagicLink,
  signInWithGoogle,
  storeSessionFromUrlHash,
  submitOwnProfile,
  supabaseEnv,
  saveOwnProfile
} from "../lib/supabaseClient.js";
import "../profileMandalaWorkspace.css";

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
    stepLabel: level.stepLabel,
    fullLabel: `${level.id}. ${level.name} · ${level.stepLabel} ${step.number}: ${step.title}`
  }))
);

const firstStep = stepOptions[0];
const firstSettings = sourcedStepSettings[firstStep?.id] || firstStep?.settings || [];

const EMPTY_MATERIAL = createEmptyMaterialForm({
  step_id: firstStep?.id || "",
  step_title: firstStep?.title || "",
  setting_title: firstSettings[0]?.title || "",
  setting_index: firstSettings.length > 0 ? 1 : null
});

const POWER_SOURCE_COUNTS = [2, 4, 5, 6, 8];

const FALLBACK_COVER_VARIANTS = [
  { id: "cover-gold", label: "Золотой поток", tone: "gold" },
  { id: "cover-forest", label: "Древо силы", tone: "forest" },
  { id: "cover-night", label: "Ночная мандала", tone: "night" }
];

const COMMAND_SLOT_LABELS = [
  "Команда 1",
  "Команда 2",
  "Команда 3",
  "Команда 4",
  "Команда 5"
];

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
  const settingIndex = settings.findIndex((item) => item.title === form.setting_title);

  return {
    profile_id: profileId,
    ...normalizeMaterialForm(
      {
        ...form,
        step_id: step?.id || "",
        step_title: step?.title || "",
        setting_title: form.setting_title || "",
        setting_index: settingIndex >= 0 ? settingIndex + 1 : null
      },
      nextStatus
    ),
    updated_at: new Date().toISOString()
  };
}

function statusCount(materials, status) {
  return materials.filter((item) => item.status === status).length;
}

function isImagePreview(value) {
  return Boolean(value && (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/")));
}

function uniqueImageSources(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!isImagePreview(item?.src) || seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
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
  const [fileNotice, setFileNotice] = useState("");
  const [powerSourceCount, setPowerSourceCount] = useState(4);
  const [selectedCoverId, setSelectedCoverId] = useState(FALLBACK_COVER_VARIANTS[0].id);
  const [customCoverImage, setCustomCoverImage] = useState("");
  const [coverNotice, setCoverNotice] = useState("");

  const statusText = useMemo(() => {
    if (profile.status === "approved") return "опубликован";
    if (profile.status === "pending") return "на модерации";
    if (profile.status === "rejected") return "нужна правка";
    return "черновик";
  }, [profile.status]);

  const activeStep = useMemo(
    () => stepOptions.find((item) => item.id === materialForm.step_id) || firstStep,
    [materialForm.step_id]
  );

  const activeSettings = useMemo(() => settingsForStep(materialForm.step_id), [materialForm.step_id]);

  const materialCounts = useMemo(() => ({
    draft: statusCount(materials, "draft"),
    pending: statusCount(materials, "pending"),
    approved: statusCount(materials, "approved")
  }), [materials]);

  const reusableImages = useMemo(() => uniqueImageSources([
    { id: "goal", label: "Фото цели", src: materialForm.image_url },
    { id: "profile", label: "Фото мастера", src: profile.avatar_url },
    ...materials.map((item, index) => ({
      id: `material-${item.id || index}`,
      label: item.title || `Материал ${index + 1}`,
      src: item.image_url
    }))
  ]), [materialForm.image_url, materials, profile.avatar_url]);

  const coverVariants = useMemo(() => [
    ...reusableImages.map((item) => ({ ...item, type: "image" })),
    ...(customCoverImage ? [{ id: "custom-cover", label: "Своё изображение", src: customCoverImage, type: "image" }] : []),
    ...FALLBACK_COVER_VARIANTS.map((item) => ({ ...item, type: "placeholder" }))
  ], [customCoverImage, reusableImages]);

  const selectedCover = useMemo(
    () => coverVariants.find((item) => item.id === selectedCoverId) || coverVariants[0],
    [coverVariants, selectedCoverId]
  );

  const centerImage = isImagePreview(materialForm.image_url)
    ? materialForm.image_url
    : isImagePreview(profile.avatar_url)
      ? profile.avatar_url
      : "";

  const commandSlots = Array.from({ length: 5 }, (_, index) => reusableImages[index] || null);

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
          setting_index: settings.length > 0 ? 1 : null
        };
      }

      if (field === "setting_title") {
        const settingIndex = activeSettings.findIndex((item) => item.title === value);
        return { ...current, setting_title: value, setting_index: settingIndex >= 0 ? settingIndex + 1 : null };
      }

      return { ...current, [field]: value };
    });
  };

  const handleMandalaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileNotice("Выберите файл изображения: JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileNotice("Для первого релиза загрузите изображение до 2 MB или вставьте внешнюю ссылку.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateMaterialField("image_url", String(reader.result || ""));
      setFileNotice(`Фото «${file.name}» добавлено в алтарь мандалы.`);
    };
    reader.onerror = () => setFileNotice("Не удалось прочитать изображение. Попробуйте другой файл.");
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverNotice("Выберите изображение для заставки: JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCoverNotice("Для локального MVP выберите изображение до 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomCoverImage(String(reader.result || ""));
      setSelectedCoverId("custom-cover");
      setCoverNotice(`Заставка «${file.name}» выбрана локально. Постоянное хранение требует отдельной проверки.`);
    };
    reader.onerror = () => setCoverNotice("Не удалось прочитать заставку. Попробуйте другой файл.");
    reader.readAsDataURL(file);
  };

  const handlePrintMandala = () => {
    const cleanup = () => document.body.classList.remove("printMandalaOnly");

    document.body.classList.add("printMandalaOnly");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
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
      setMaterials((current) => [saved, ...current].filter(Boolean));
      setMaterialForm((current) => ({
        ...EMPTY_MATERIAL,
        type: current.type,
        step_id: current.step_id,
        step_title: current.step_title,
        setting_title: current.setting_title,
        setting_index: current.setting_index
      }));
      setFileNotice("");
      setMessage(nextStatus === "pending" ? "Материал отправлен на модерацию." : "Материал сохранён как черновик.");
    } catch (err) {
      setError(err.message || "Не удалось сохранить материал.");
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setUser(null);
    setProfile(EMPTY_PROFILE);
    setMaterials([]);
    setMaterialForm(EMPTY_MATERIAL);
    setFileNotice("");
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

          <section className="mandalaWorkspace">
            <div className="mandalaHero">
              <div className="mandalaHeroSeal">♣</div>
              <div>
                <p className="cabinetEyebrow">Рабочее место мастера</p>
                <h2>Мастерская мандал</h2>
                <p>Создавайте мандалы, артефакты и практики по ступеням Рейки Иггдрасиль. Выберите поток, поместите мандалу на алтарь и сохраните материал.</p>
              </div>
              <div className="mandalaHeroStats" aria-label="Статусы материалов">
                <span><b>{materialCounts.draft}</b> Черновики</span>
                <span><b>{materialCounts.pending}</b> На модерации</span>
                <span><b>{materialCounts.approved}</b> Опубликовано</span>
              </div>
            </div>

            {!profile?.id && (
              <div className="mandalaGuide">
                Сначала сохраните профиль мастера. После этого можно добавлять мандалы, артефакты и практики к ступеням и настройкам.
              </div>
            )}

            <div className="flowTuningPanel">
              <div>
                <p className="cabinetEyebrow">Настройка потока</p>
                <h3>{activeStep?.id} · {activeStep?.title}</h3>
                <p>{materialForm.setting_title || "Выберите настройку этой ступени"}</p>
              </div>
              <div className="flowTuningGlow">
                <span>✦</span>
                <b>{activeStep?.stepLabel} {activeStep?.number}</b>
                <small>{activeStep?.levelName}</small>
              </div>
            </div>

            <div className="mandalaAtelierGrid">
              <div className="mandalaAltarCard">
                <p className="cabinetEyebrow">Алтарь мандалы</p>
                <div className={isImagePreview(materialForm.image_url) ? "mandalaPreview hasImage" : "mandalaPreview"} style={isImagePreview(materialForm.image_url) ? { backgroundImage: `url(${materialForm.image_url})` } : undefined}>
                  {!isImagePreview(materialForm.image_url) && <span>⇧</span>}
                </div>
                <label className="mandalaUploadButton">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleMandalaFile} />
                  Загрузить фото мандалы
                </label>
                <div className="mandalaDropHint">
                  JPG, PNG, WEBP до 2 MB. Файл будет сохранён как изображение в материале; также можно вставить внешний URL.
                </div>
                {fileNotice && <div className="mandalaFileNotice">{fileNotice}</div>}
                <div className="mandalaFlowLink">
                  <b>{materialForm.step_id}</b> · {materialForm.step_title || "ступень"} · {materialForm.setting_title || "настройка уточняется"}
                </div>
              </div>

              <form className="mandalaCreationCard" onSubmit={(event) => { event.preventDefault(); handleMaterialSave("draft"); }}>
                <p className="cabinetEyebrow">Создание материала</p>
                <div className="materialTypeChips" role="group" aria-label="Тип материала">
                  {MATERIAL_TYPES.map((type) => (
                    <button key={type.value} type="button" className={materialForm.type === type.value ? "active" : ""} onClick={() => updateMaterialField("type", type.value)}>
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="cabinetTwoColumns">
                  <label>
                    Ступень Reiki Yggdrasil
                    <select value={materialForm.step_id} onChange={(event) => updateMaterialField("step_id", event.target.value)}>
                      {stepOptions.map((step) => (
                        <option value={step.id} key={step.id}>{step.fullLabel}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Настройка ступени
                    <select value={materialForm.setting_title} onChange={(event) => updateMaterialField("setting_title", event.target.value)}>
                      {activeSettings.length === 0 && <option value="">Настройки уточняются</option>}
                      {activeSettings.map((setting, index) => (
                        <option value={setting.title} key={`${setting.title}-${index}`}>{setting.title}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Название
                  <input value={materialForm.title} onChange={(event) => updateMaterialField("title", event.target.value)} placeholder="Например: Мандала денежной активации" />
                </label>

                <label>
                  Описание / инструкция
                  <textarea value={materialForm.description} onChange={(event) => updateMaterialField("description", event.target.value)} rows={4} placeholder="Что делает материал, как использовать, для какой задачи создан." />
                </label>

                <label>
                  URL изображения / мандалы
                  <input value={materialForm.image_url} onChange={(event) => updateMaterialField("image_url", event.target.value)} placeholder="https://... или загрузите фото слева" />
                </label>

                <div className="cabinetActions">
                  <button className="cabinetPrimary" type="submit" disabled={!profile?.id}>Сохранить черновик</button>
                  <button className="cabinetSecondary" type="button" disabled={!profile?.id} onClick={() => handleMaterialSave("pending")}>Отправить на модерацию</button>
                </div>
              </form>
            </div>

            <section className="powerPlaceConstructor" aria-label="Конструктор магической мандалы места силы">
              <div className="powerPlaceHeader">
                <div>
                  <p className="cabinetEyebrow">Места силы</p>
                  <h2>Магическая мандала</h2>
                </div>
                <div className="geometrySelector" aria-label="Геометрия источников силы">
                  {POWER_SOURCE_COUNTS.map((count) => (
                    <button
                      className={powerSourceCount === count ? "active" : ""}
                      key={count}
                      onClick={() => setPowerSourceCount(count)}
                      type="button"
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="powerPlacePrintArea">
                <div className="powerMandalaPanel">
                  <div className={`powerMandala geometry-${powerSourceCount}`}>
                    <div className={centerImage ? "powerCenterPhoto hasImage" : "powerCenterPhoto"} style={centerImage ? { backgroundImage: `url(${centerImage})` } : undefined}>
                      {!centerImage && <span>◎</span>}
                    </div>
                    <div className="powerMandalaBase">
                      <span>мандала места силы</span>
                    </div>
                    {Array.from({ length: powerSourceCount }, (_, index) => (
                      <div
                        className={`powerSource source-${index + 1}${powerSourceCount === 8 && index % 2 === 1 ? " small" : ""}`}
                        key={`source-${powerSourceCount}-${index}`}
                      >
                        <span>{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="powerPlaceHint">Центр использует фото мандалы или фото мастера, если оно доступно.</p>
                </div>

                <aside className="powerCommandRail">
                  <div className="commandSlots" aria-label="Командные изображения">
                    {COMMAND_SLOT_LABELS.map((label, index) => {
                      const commandImage = commandSlots[index];

                      return (
                        <div className={commandImage ? "commandSlot hasImage" : "commandSlot"} key={label} style={commandImage ? { backgroundImage: `url(${commandImage.src})` } : undefined}>
                          {!commandImage && <span>{index + 1}</span>}
                          <small>{label}</small>
                        </div>
                      );
                    })}
                  </div>

                  <div className="coverSelector">
                    <p className="cabinetEyebrow">Заставка места силы</p>
                    <div className="coverPreviewWrap">
                      <div
                        className={`coverPreview ${selectedCover?.type === "image" ? "hasImage" : `tone-${selectedCover?.tone || "gold"}`}`}
                        style={selectedCover?.type === "image" ? { backgroundImage: `url(${selectedCover.src})` } : undefined}
                      >
                        <span>{selectedCover?.label || "Заставка"}</span>
                      </div>
                    </div>
                    <div className="coverVariantList" aria-label="Варианты заставки">
                      {coverVariants.map((cover) => (
                        <button
                          className={selectedCover?.id === cover.id ? "active" : ""}
                          key={cover.id}
                          onClick={() => setSelectedCoverId(cover.id)}
                          type="button"
                        >
                          {cover.label}
                        </button>
                      ))}
                    </div>
                    <label className="coverUploadButton">
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleCoverFile} />
                      Своё изображение
                    </label>
                    {coverNotice && <p className="coverNotice">{coverNotice}</p>}
                  </div>
                </aside>
              </div>

              <div className="powerPlaceActions">
                <button className="cabinetPrimary" type="button" onClick={handlePrintMandala}>Распечатать</button>
                <span>Сохранение геометрии и заставки: needs verification.</span>
              </div>
            </section>

            <div className="mandalaGallery">
              <div className="cabinetFormHeader">
                <div>
                  <p className="cabinetEyebrow">Мои мандалы и материалы</p>
                  <h2>Галерея мастера</h2>
                </div>
                <span className="cabinetStatus">{materialsLoading ? "..." : materials.length}</span>
              </div>

              {materialsLoading && <p>Загружаю материалы...</p>}
              {!materialsLoading && profile?.id && materials.length === 0 && (
                <div className="mandalaEmptyState">
                  <div className="mandalaEmptySeal">✦</div>
                  <b>Добавьте первую мандалу к выбранной настройке</b>
                  <p>Она появится здесь как карточка вашей мастерской.</p>
                </div>
              )}
              {!profile?.id && <p>Список появится после первого сохранения профиля.</p>}

              {materials.length > 0 && (
                <div className="mandalaCardsGrid">
                  {materials.map((item) => (
                    <article className="mandalaMaterialCard" key={item.id}>
                      {item.image_url ? <div className="mandalaCardImage" style={{ backgroundImage: `url(${item.image_url})` }} /> : <div className="mandalaCardImage placeholder">◎</div>}
                      <div className="mandalaCardBody">
                        <div className="mandalaCardChips">
                          <span>{publicationTypeLabel(item.type)}</span>
                          <span className={`statusChip status-${item.status || "draft"}`}>{materialStatusText(item.status)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description || "Описание не заполнено."}</p>
                        <small>{[item.step_id, item.step_title, item.setting_title].filter(Boolean).join(" · ")}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
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
