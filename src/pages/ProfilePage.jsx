import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useI18n } from "../i18n/config";
import { signInWithEmail, signInWithGoogle, signOut, signUpWithEmail } from "../lib/authService";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { getProfile, upsertProfile } from "../lib/profileService";
import { attunementCatalog, levelCatalog } from "../data/reikiTaxonomy";
import { createMediaItem, listVisibleMedia, uploadStorageFile } from "../lib/mediaService";
import { createService, listServices } from "../lib/servicesService";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "andy.litvinov@gmail.com";

export function ProfilePage() {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [services, setServices] = useState([]);

  const [profileForm, setProfileForm] = useState({ name: "", bio: "", training_info: "", contacts: "", show_contacts: false, public_visible: true });

  const [mediaForm, setMediaForm] = useState({
    title: "",
    description: "",
    type: "photo",
    category: "mandala",
    level_id: 1,
    attunement_id: "",
    external_url: "",
    comments_enabled: true,
    visibility: "public"
  });
  const [mediaFile, setMediaFile] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    kind: "bonus",
    title: "",
    description: "",
    price: "",
    format: "online",
    contact_url: ""
  });

  const levelAttunements = useMemo(
    () => attunementCatalog.filter((x) => x.levelId === Number(mediaForm.level_id)),
    [mediaForm.level_id]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user || !isSupabaseConfigured) return;
    loadUser(session.user.id).catch((e) => setError(e.message));
  }, [session?.user?.id]);

  async function loadUser(userId) {
    const p = await getProfile(userId);
    setProfile(p);
    if (p) {
      setProfileForm({
        name: p.name || "",
        bio: p.bio || "",
        training_info: p.training_info || "",
        contacts: p.contacts || "",
        show_contacts: Boolean(p.show_contacts),
        public_visible: Boolean(p.public_visible)
      });
    }
    const userLevel = p?.master_level || 1;
    const [mediaData, servicesData] = await Promise.all([listVisibleMedia(userLevel), listServices(userId)]);
    setFeed(mediaData);
    setServices(servicesData);
  }

  async function handleAuth(type) {
    setError("");
    try {
      if (type === "google") await signInWithGoogle();
      if (type === "signin") await signInWithEmail(email, password);
      if (type === "signup") await signUpWithEmail(email, password);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveProfile() {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        user_id: session.user.id,
        name: profileForm.name,
        bio: profileForm.bio,
        training_info: profileForm.training_info,
        contacts: profileForm.contacts,
        show_contacts: profileForm.show_contacts,
        public_visible: profileForm.public_visible,
        is_profile_complete: Boolean(profileForm.name && profileForm.bio && profileForm.training_info)
      };
      const saved = await upsertProfile(payload);
      setProfile(saved);
      await loadUser(session.user.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitMedia() {
    if (!session?.user || !profile?.is_profile_complete) return;
    if (!mediaForm.level_id || !mediaForm.attunement_id) {
      setError("Выберите уровень и настройку.");
      return;
    }
    try {
      let storage_path = null;
      let external_url = mediaForm.external_url || null;
      if (mediaFile) {
        const bucket = mediaForm.type === "photo" ? "works" : mediaForm.type === "audio" ? "audio" : "videos";
        storage_path = await uploadStorageFile(bucket, mediaFile, session.user.id);
      }
      await createMediaItem({
        owner_user_id: session.user.id,
        title: mediaForm.title,
        description: mediaForm.description,
        type: mediaForm.type,
        category: mediaForm.category,
        level_id: Number(mediaForm.level_id),
        attunement_id: Number(mediaForm.attunement_id),
        storage_path,
        external_url,
        comments_enabled: mediaForm.comments_enabled,
        visibility: mediaForm.visibility,
        status: "pending"
      });
      await loadUser(session.user.id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitService() {
    if (!session?.user) return;
    try {
      await createService({
        owner_user_id: session.user.id,
        kind: serviceForm.kind,
        title: serviceForm.title,
        description: serviceForm.description,
        price: serviceForm.kind === "paid" ? Number(serviceForm.price || 0) : null,
        format: serviceForm.format,
        contact_url: serviceForm.contact_url,
        is_active: true
      });
      await loadUser(session.user.id);
    } catch (e) {
      setError(e.message);
    }
  }

  const userLevel = profile?.master_level || 1;
  const canUploadPhoto = userLevel >= 2;
  const canManageServices = userLevel >= 3;
  const canCreateMedia = userLevel >= 4;
  const canFullProfile = userLevel >= 5;
  const isAdmin = session?.user?.email === adminEmail;

  return (
    <div className="appShell">
      <AppHeader />
      <main className="profileLayout">
        <section className="profileCard">
          <h2>{t("profile")}</h2>
          {!isSupabaseConfigured && <p>Настройте Supabase env-переменные, чтобы включить кабинет.</p>}
          {error && <p className="errorText">{error}</p>}

          {!session && isSupabaseConfigured && (
            <div className="stackCol">
              <div className="rowActions">
                <button onClick={() => handleAuth("google")}>Google</button>
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")} type="password" />
              <div className="rowActions">
                <button onClick={() => handleAuth("signin")}>{t("signIn")}</button>
                <button onClick={() => handleAuth("signup")}>Sign up</button>
              </div>
            </div>
          )}

          {session && (
            <>
              <div className="rowActions">
                <p>{session.user.email}</p>
                <button onClick={() => signOut()}>{t("signOut")}</button>
                {isAdmin && <Link to="/profile/admin">{t("admin")}</Link>}
              </div>

              <div className="panelSection">
                <h3>Профиль</h3>
                <div className="gridForm">
                  <input placeholder="Имя" value={profileForm.name} onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))} />
                  <input
                    placeholder="Где и у кого учился"
                    value={profileForm.training_info}
                    onChange={(e) => setProfileForm((s) => ({ ...s, training_info: e.target.value }))}
                  />
                  <textarea placeholder="Описание" value={profileForm.bio} onChange={(e) => setProfileForm((s) => ({ ...s, bio: e.target.value }))} />
                  <input placeholder="Контакты" value={profileForm.contacts} onChange={(e) => setProfileForm((s) => ({ ...s, contacts: e.target.value }))} />
                </div>
                <label><input type="checkbox" checked={profileForm.show_contacts} onChange={(e) => setProfileForm((s) => ({ ...s, show_contacts: e.target.checked }))} /> Показывать контакты</label>
                <label><input type="checkbox" checked={profileForm.public_visible} onChange={(e) => setProfileForm((s) => ({ ...s, public_visible: e.target.checked }))} /> Публичный профиль в разделе мастеров</label>
                <button disabled={loading} onClick={saveProfile}>{t("save")}</button>
              </div>

              {!profile?.is_profile_complete && <p>Заполните профиль, чтобы открыть материалы.</p>}

              {profile?.is_profile_complete && (
                <>
                  <div className="panelSection">
                    <h3>Ваш уровень: {userLevel}{profile?.level_frozen ? " (заморожен)" : ""}</h3>
                    <p>L1 просмотр · L2 фото · L3 услуги · L4 контент · L5 полный профиль.</p>
                  </div>

                  <div className="panelSection">
                    <h3>Загрузка работ и медиа</h3>
                    <div className="gridForm">
                      <input placeholder="Название" value={mediaForm.title} onChange={(e) => setMediaForm((s) => ({ ...s, title: e.target.value }))} />
                      <textarea placeholder="Описание" value={mediaForm.description} onChange={(e) => setMediaForm((s) => ({ ...s, description: e.target.value }))} />
                      <select value={mediaForm.type} onChange={(e) => setMediaForm((s) => ({ ...s, type: e.target.value }))}>
                        <option value="photo">Фото</option>
                        <option value="audio">Аудио</option>
                        <option value="video">Видео</option>
                        <option value="link">Ссылка</option>
                      </select>
                      <select value={mediaForm.category} onChange={(e) => setMediaForm((s) => ({ ...s, category: e.target.value }))}>
                        <option value="mandala">Мандала</option>
                        <option value="artifact">Артефакт</option>
                      </select>
                      <select value={mediaForm.level_id} onChange={(e) => setMediaForm((s) => ({ ...s, level_id: Number(e.target.value), attunement_id: "" }))}>
                        {levelCatalog.map((l) => <option value={l.id} key={l.id}>{l.name}</option>)}
                      </select>
                      <select value={mediaForm.attunement_id} onChange={(e) => setMediaForm((s) => ({ ...s, attunement_id: e.target.value }))}>
                        <option value="">Выберите настройку</option>
                        {levelAttunements.map((a, idx) => <option value={idx + 1} key={`${a.name}${idx}`}>{a.name}</option>)}
                      </select>
                      <input placeholder="Ссылка YouTube/Vimeo" value={mediaForm.external_url} onChange={(e) => setMediaForm((s) => ({ ...s, external_url: e.target.value }))} />
                      <input type="file" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                    </div>
                    <label><input type="checkbox" checked={mediaForm.comments_enabled} onChange={(e) => setMediaForm((s) => ({ ...s, comments_enabled: e.target.checked }))} /> Комментарии включены</label>
                    <label><input type="checkbox" checked={mediaForm.visibility === "public"} onChange={(e) => setMediaForm((s) => ({ ...s, visibility: e.target.checked ? "public" : "private" }))} /> Публично для мастеров</label>
                    <button disabled={(!canUploadPhoto && mediaForm.type === "photo") || (!canCreateMedia && (mediaForm.type === "audio" || mediaForm.type === "video" || mediaForm.type === "link"))} onClick={submitMedia}>Загрузить</button>
                  </div>

                  <div className="panelSection">
                    <h3>Услуги</h3>
                    <div className="gridForm">
                      <select value={serviceForm.kind} onChange={(e) => setServiceForm((s) => ({ ...s, kind: e.target.value }))}>
                        <option value="bonus">Бонусные бесплатные</option>
                        <option value="paid">Платные</option>
                      </select>
                      <input placeholder="Название" value={serviceForm.title} onChange={(e) => setServiceForm((s) => ({ ...s, title: e.target.value }))} />
                      <textarea placeholder="Описание" value={serviceForm.description} onChange={(e) => setServiceForm((s) => ({ ...s, description: e.target.value }))} />
                      {serviceForm.kind === "paid" && <input type="number" placeholder="Цена" value={serviceForm.price} onChange={(e) => setServiceForm((s) => ({ ...s, price: e.target.value }))} />}
                      <select value={serviceForm.format} onChange={(e) => setServiceForm((s) => ({ ...s, format: e.target.value }))}>
                        <option value="online">Онлайн</option>
                        <option value="offline">Офлайн</option>
                        <option value="other">Другое</option>
                      </select>
                      <input placeholder="Telegram / WhatsApp / email" value={serviceForm.contact_url} onChange={(e) => setServiceForm((s) => ({ ...s, contact_url: e.target.value }))} />
                    </div>
                    <button disabled={!canManageServices || (!canFullProfile && serviceForm.kind === "paid")} onClick={submitService}>Добавить услугу</button>
                    <ul>{services.map((x) => <li key={x.id}>{x.kind} · {x.title}</li>)}</ul>
                  </div>

                  <div className="panelSection">
                    <h3>Видео и материалы</h3>
                    <div className="feedGrid">
                      {feed.map((item) => (
                        <article className="miniCard" key={item.id}>
                          <b>{item.title}</b>
                          <p>{item.description}</p>
                          <small>{item.type} · L{item.level_id}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
