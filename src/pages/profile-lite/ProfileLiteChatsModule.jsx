import React from "react";

export default function ProfileLiteChatsModule({
  chatDraft,
  chatThreads,
  chatsError,
  chatsStatus,
  onChatDraftChange,
  onSendMessage,
  onThreadSelect,
  selectedThreadId
}) {
  const selectedThread = chatThreads.find((thread) => thread.conversation_id === selectedThreadId) || chatThreads[0] || null;

  return (
    <section className="profileLiteModule profileLiteChats mandalaWorkspace" aria-label="Чаты">
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
        </div>
      </div>
    </section>
  );
}
