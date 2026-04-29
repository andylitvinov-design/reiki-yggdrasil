import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { attunementCatalog, levelCatalog } from "../data/reikiTaxonomy";
import { adminUpdateLevel, listModerationMedia, listUsersForAdmin, moderateMedia } from "../lib/adminService";
import { createMediaItem, uploadStorageFile } from "../lib/mediaService";
import { supabase } from "../lib/supabaseClient";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "andy.litvinov@gmail.com";

export function AdminPage() {
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioForm, setAudioForm] = useState({
    title: "",
    description: "",
    category: "practice",
    level_id: 1,
    attunement_id: ""
  });

  const levelAttunements = useMemo(
    () => attunementCatalog
      .map((item, index) => ({ ...item, id: index + 1 }))
      .filter((item) => item.levelId === Number(audioForm.level_id)),
    [audioForm.level_id]
  );

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (!session?.user || session.user.email !== adminEmail) return;
    Promise.all([listUsersForAdmin(), listModerationMedia()])
      .then(([u, m]) => {
        setUsers(u);
        setMedia(m);
      })
      .catch((e) => setError(e.message));
  }, [session?.user?.id]);

  async function refreshMedia() {
    const nextMedia = await listModerationMedia();
    setMedia(nextMedia);
  }

  async function submitAudioMeditation() {
    if (!session?.user) return;
    setError("");
    setMessage("");
    if (!audioForm.title.trim() || !audioForm.attunement_id || !audioFile) {
      setError("Заполните название, настройку и выберите аудиофайл.");
      return;
    }

    try {
      const storagePath = await uploadStorageFile("audio", audioFile, session.user.id);
      await createMediaItem({
        owner_user_id: session.user.id,
        title: audioForm.title.trim(),
        description: audioForm.description.trim(),
        type: "audio",
        category: audioForm.category,
        level_id: Number(audioForm.level_id),
        attunement_id: Number(audioForm.attunement_id),
        storage_path: storagePath,
        external_url: null,
        comments_enabled: false,
        visibility: "public",
        status: "approved"
      });
      setAudioForm({ title: "", description: "", category: "practice", level_id: 1, attunement_id: "" });
      setAudioFile(null);
      setMessage("Аудио-медитация опубликована.");
      await refreshMedia();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!session?.user) return <Navigate to="/profile" replace />;
  if (session.user.email !== adminEmail) return <Navigate to="/profile" replace />;

  return (
    <div className="appShell">
      <AppHeader />
      <main className="profileLayout">
        <section className="profileCard">
          <h2>Админ-панель</h2>
          {error && <p className="errorText">{error}</p>}
          {message && <p className="successText">{message}</p>}

          <div className="panelSection">
            <h3>Пользователи и уровни</h3>
            <div className="adminTable">
              {users.map((u) => (
                <div className="adminRow" key={u.user_id}>
                  <span>{u.email || u.name || u.user_id}</span>
                  <span>L{u.master_level || 1}</span>
                  <button onClick={() => adminUpdateLevel(u.user_id, Math.max((u.master_level || 1) - 1, 1), u.level_frozen)}> - </button>
                  <button onClick={() => adminUpdateLevel(u.user_id, Math.min((u.master_level || 1) + 1, 5), u.level_frozen)}> + </button>
                  <button onClick={() => adminUpdateLevel(u.user_id, u.master_level || 1, !u.level_frozen)}>{u.level_frozen ? "Разморозить" : "Заморозить"}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="panelSection">
            <h3>Аудио-медитации</h3>
            <div className="gridForm">
              <input
                placeholder="Название"
                value={audioForm.title}
                onChange={(e) => setAudioForm((s) => ({ ...s, title: e.target.value }))}
              />
              <textarea
                placeholder="Описание"
                value={audioForm.description}
                onChange={(e) => setAudioForm((s) => ({ ...s, description: e.target.value }))}
              />
              <select value={audioForm.category} onChange={(e) => setAudioForm((s) => ({ ...s, category: e.target.value }))}>
                <option value="practice">Практика</option>
                <option value="mandala">Мандала</option>
                <option value="artifact">Артефакт</option>
                <option value="other">Другое</option>
              </select>
              <select
                value={audioForm.level_id}
                onChange={(e) => setAudioForm((s) => ({ ...s, level_id: Number(e.target.value), attunement_id: "" }))}
              >
                {levelCatalog.map((level) => <option value={level.id} key={level.id}>{level.name}</option>)}
              </select>
              <select value={audioForm.attunement_id} onChange={(e) => setAudioForm((s) => ({ ...s, attunement_id: e.target.value }))}>
                <option value="">Выберите настройку</option>
                {levelAttunements.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <input accept="audio/*" type="file" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </div>
            <button onClick={submitAudioMeditation}>Опубликовать аудио</button>
          </div>

          <div className="panelSection">
            <h3>Модерация контента</h3>
            <div className="adminTable">
              {media.map((m) => (
                <div className="adminRow" key={m.id}>
                  <span>{m.title}</span>
                  <span>{m.status}</span>
                  <button onClick={() => moderateMedia(m.id, "approved")}>Одобрить</button>
                  <button onClick={() => moderateMedia(m.id, "hidden")}>Скрыть</button>
                  <button onClick={() => moderateMedia(m.id, "rejected")}>Отклонить</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
