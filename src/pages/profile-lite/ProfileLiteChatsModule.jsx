import React from "react";
import {
  filterPublishedServices,
  getMasterPageInsertText,
  getServiceInsertText
} from "../../lib/masterChatLinks.js";

export default function ProfileLiteChatsModule({
  chatDraft,
  chatThreads,
  chatsError,
  chatsStatus,
  onChatDraftChange,
  onSendMessage,
  profile,
  services,
  shellChrome,
  onThreadSelect,
  selectedThreadId
}) {
  const selectedThread = chatThreads.find((thread) => thread.conversation_id === selectedThreadId) || chatThreads[0] || null;
  const publishedServices = filterPublishedServices(services);

  function insertIntoDraft(text) {
    if (!text) return;
    const separator = chatDraft && !chatDraft.endsWith("\n") ? "\n" : "";
    onChatDraftChange(chatDraft + separator + text);
  }

  function handleInsertMasterPage() {
    const text = getMasterPageInsertText(profile?.id);
    if (text) insertIntoDraft(text);
  }

  function handleInsertService(service) {
    const text = getServiceInsertText(service);
    if (text) insertIntoDraft(text);
  }

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
          <span><b>{chatsStatus}</b> Статус</span>
          <span><b>{selectedThread ? "open" : "idle"}</b> Поток</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Рабочий режим</p>
          <h3>Чаты</h3>
          <div className="chatModeNav" aria-label="Статические разделы чатов">
            {chatThreads.map((thread) => (
              <button className={thread.conversation_id === selectedThreadId ? "active" : ""} key={thread.conversation_id} type="button" onClick={() => onThreadSelect(thread.conversation_id)}>
                <span>{thread.master?.display_name || "Чат"}</span>
                <small>{thread.messages?.length || 0} сообщений</small>
              </button>
            ))}
            {chatThreads.length === 0 && ["Места силы", "Фото клиентов", "Мистерии", "Галерея"].map((item) => (
              <button key={item} type="button">
                <span>{item}</span>
                <small>placeholder</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label="Статический режим чатов">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Центр действия</p>
              <h2>Чаты и рабочие заметки</h2>
              <span>Источник данных: profile_cabinet_chat_* · stable auth shell</span>
            </div>
            {chatsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {chatsError}</div>}
            <div className="chatMockMessages profileLiteRealMessages">
              {(selectedThread?.messages || []).map((message) => (
                <div key={message.id || message.created_at} className={message.sender_profile_id === selectedThread?.ownerProfileId ? "own" : ""}>
                  <b>{message.sender_profile_id || "Участник"}</b>
                  <p>{message.body}</p>
                </div>
              ))}
              {!selectedThread && [
                { id: "placeholder-client-1", author: "Мария Север", body: "Добавила фото цели. Проверь зодиакальную мандалу.", own: false },
                { id: "placeholder-master", author: "Вы", body: "Место силы открываем отдельной вкладкой рабочей области.", own: true },
                { id: "placeholder-client-2", author: "Мария Север", body: "Сохрани потом в Мистерии → Традиция.", own: false }
              ].map((message) => (
                <div className={message.own ? "own" : ""} key={message.id}>
                  <b>{message.author}</b>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
            {chatsStatus === "success" && chatThreads.length === 0 && <p>Чаты пока не найдены. Создание новых диалогов: needs verification до live-проверки approved profiles и RLS.</p>}
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSendMessage(selectedThread); }}>
            <p className="cabinetEyebrow">Сообщения</p>
            <h2>{selectedThread?.master?.display_name || "Выберите чат"}</h2>
            <span className="cabinetStatus">{chatsStatus}</span>
            <label>
              Сообщение
              <textarea value={chatDraft} onChange={(event) => onChatDraftChange(event.target.value)} rows={3} placeholder="Написать сообщение..." />
            </label>
            <button className="cabinetPrimary" type="submit" disabled={!selectedThread}>Отправить</button>
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
