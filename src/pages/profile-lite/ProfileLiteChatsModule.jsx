import React from "react";
import {
  filterPublishedServices,
  getMasterPageInsertText,
  getServiceInsertText
} from "../../lib/masterChatLinks.js";

export default function ProfileLiteChatsModule({
  approvedChatProfiles = [],
  approvedChatProfilesError = "",
  approvedChatProfilesStatus = "idle",
  chatDraft,
  chatThreads,
  chatsError,
  chatsStatus,
  onChatDraftChange,
  onSendMessage,
  onStartChatWithMaster,
  profile,
  services,
  shellChrome,
  onThreadSelect,
  selectedThreadId
}) {
  const selectedThread = chatThreads.find((thread) => thread.conversation_id === selectedThreadId) || chatThreads[0] || null;
  const hasDraft = Boolean(String(chatDraft || "").trim());
  const publishedServices = filterPublishedServices(services);

  function insertIntoDraft(text) {
    if (!text) return;
    const separator = String(chatDraft || "") && !String(chatDraft || "").endsWith("\n") ? "\n" : "";
    onChatDraftChange(String(chatDraft || "") + separator + text);
  }

  function handleInsertMasterPage() {
    const text = getMasterPageInsertText(profile?.id);
    if (text) insertIntoDraft(text);
  }

  function handleInsertService(service) {
    const text = getServiceInsertText(service);
    if (text) insertIntoDraft(text);
  }

  const statusLabel = chatsStatus === "loading"
    ? "Загрузка"
    : chatsStatus === "needs-verification"
      ? "Требуется обновление"
      : chatsStatus === "success"
        ? "Готово"
        : "Ожидает входа";

  return (
    <section className="profileLiteModule profileLiteChats mandalaWorkspace" aria-label="Чаты">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">◈</div>
        <div>
          <p className="cabinetEyebrow">Чаты</p>
          <h2>Чаты и рабочие заметки</h2>
          <p>Сохраняйте диалоги по местам силы, фото клиентов, мистериям и материалам в едином кабинете.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{chatThreads.length}</b> Чаты</span>
          <span><b>{approvedChatProfiles.length}</b> Мастера</span>
          <span><b>{selectedThread ? "Открыт" : "Нет"}</b> Диалог</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Рабочий режим</p>
          <h3>Чаты</h3>
          <div className="chatModeNav" aria-label="Список чатов">
            {chatThreads.length > 0 ? chatThreads.map((thread) => (
              <button className={thread.conversation_id === selectedThreadId ? "active" : ""} key={thread.conversation_id} type="button" onClick={() => onThreadSelect(thread.conversation_id)}>
                <span>{thread.master?.display_name || "Чат с мастером"}</span>
                <small>{thread.messages?.length || 0} сообщений</small>
              </button>
            )) : (
              <div className="chatEmptyCompact">
                <b>Чатов пока нет</b>
                <span>Выберите мастера ниже, чтобы начать диалог.</span>
              </div>
            )}
          </div>

          <div className="chatMasterPicker" aria-label="Начать чат с мастером">
            <p className="cabinetEyebrow">Новый диалог</p>
            {approvedChatProfiles.map((master) => (
              <button key={master.id} type="button" onClick={() => onStartChatWithMaster(master.id)} disabled={chatsStatus === "loading"}>
                <span>{master.display_name || "Мастер"}</span>
                <small>{[master.city, master.country].filter(Boolean).join(", ") || "Одобренный профиль"}</small>
              </button>
            ))}
            {approvedChatProfilesStatus === "loading" && <div className="chatEmptyCompact">Загружаю мастеров...</div>}
            {approvedChatProfilesStatus === "success" && approvedChatProfiles.length === 0 && (
              <div className="chatEmptyCompact">Пока нет доступных мастеров для нового диалога.</div>
            )}
            {approvedChatProfilesError && (
              <div className="cabinetNotice compactNotice">Не удалось загрузить список мастеров. Попробуйте обновить страницу.</div>
            )}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label="Статический режим чатов">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Центр действия</p>
              <h2>{selectedThread?.master?.display_name || "Начните диалог с мастером"}</h2>
              <span>{statusLabel}</span>
            </div>
            {chatsError && <div className="cabinetNotice compactNotice">Не удалось загрузить или создать чат. Попробуйте обновить страницу.</div>}
            <div className="chatMockMessages profileLiteRealMessages">
              {selectedThread ? (selectedThread.messages || []).map((message) => (
                <div key={message.id || message.created_at} className={message.sender_profile_id === selectedThread?.ownerProfileId ? "own" : ""}>
                  <b>{message.sender_profile_id || "Участник"}</b>
                  <p>{message.body}</p>
                </div>
              )) : (
                <div>
                  <b>Чаты пока не найдены</b>
                  <p>Выберите мастера из одобренных профилей. После создания диалог сохранится здесь.</p>
                </div>
              )}
              {selectedThread && (selectedThread.messages || []).length === 0 && (
                <div>
                  <b>Диалог открыт</b>
                  <p>Напишите первое сообщение мастеру.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSendMessage(selectedThread); }}>
            <p className="cabinetEyebrow">Сообщения</p>
            <h2>{selectedThread?.master?.display_name || "Выберите чат"}</h2>
            <span className="cabinetStatus">{statusLabel}</span>
            <label>
              Сообщение
              <textarea value={chatDraft} onChange={(event) => onChatDraftChange(event.target.value)} rows={3} placeholder="Написать сообщение..." />
            </label>
            <button className="cabinetPrimary" type="submit" disabled={!selectedThread || !hasDraft}>Отправить</button>
          </form>
          <div className="cabinetCard chatLinkInsert" aria-label="Подтянуть ссылку">
            <p className="cabinetEyebrow">Подтянуть ссылку</p>
            <div className="chatLinkInsertActions">
              {profile?.id && (
                <button
                  type="button"
                  className="cabinetSecondary chatInsertMasterPage"
                  onClick={handleInsertMasterPage}
                  title="Вставить ссылку на свою страницу мастера"
                >
                  Моя страница мастера
                </button>
              )}
              {!profile?.id && (
                <span className="cabinetNotice">Войдите в кабинет, чтобы вставить ссылку на страницу мастера.</span>
              )}
            </div>
            {publishedServices.length > 0 && (
              <div className="chatLinkServiceList">
                <p className="cabinetEyebrow">Опубликованные услуги</p>
                {publishedServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="cabinetSecondary chatInsertService"
                    onClick={() => handleInsertService(service)}
                    title={`Вставить ссылку на услугу: ${service.title || service.id}`}
                  >
                    {service.title || service.id}
                  </button>
                ))}
              </div>
            )}
            {publishedServices.length === 0 && profile?.id && (
              <p className="cabinetNotice">Нет опубликованных услуг. Опубликуйте услугу в разделе «Услуги», чтобы вставить ссылку.</p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
