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
    <section className="profileLiteModule profileLiteChats" aria-label="Чаты">
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Чаты</p>
            <h2>Диалоги мастеров</h2>
          </div>
          <span className="cabinetStatus">{chatsStatus}</span>
        </div>
        {chatsError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {chatsError}</div>}
        <div className="profileLiteThreadList">
          {chatThreads.map((thread) => (
            <button className={thread.conversation_id === selectedThreadId ? "active" : ""} key={thread.conversation_id} type="button" onClick={() => onThreadSelect(thread.conversation_id)}>
              <b>{thread.master?.display_name || "Чат"}</b>
              <span>{thread.messages?.length || 0} сообщений</span>
            </button>
          ))}
          {chatsStatus === "success" && chatThreads.length === 0 && <p>Чаты пока не найдены. Создание новых диалогов: needs verification до live-проверки approved profiles и RLS.</p>}
        </div>
      </div>

      <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onSendMessage(selectedThread); }}>
        <p className="cabinetEyebrow">Сообщения</p>
        <h2>{selectedThread?.master?.display_name || "Выберите чат"}</h2>
        <div className="chatMockMessages profileLiteRealMessages">
          {(selectedThread?.messages || []).map((message) => (
            <div key={message.id || message.created_at} className={message.sender_profile_id === selectedThread?.ownerProfileId ? "own" : ""}>
              <b>{message.sender_profile_id || "Участник"}</b>
              <p>{message.body}</p>
            </div>
          ))}
          {!selectedThread && <p>Существующие чаты будут показаны после загрузки `profile_cabinet_chat_*`.</p>}
        </div>
        <label>
          Сообщение
          <textarea value={chatDraft} onChange={(event) => onChatDraftChange(event.target.value)} rows={3} placeholder="Написать сообщение..." />
        </label>
        <button className="cabinetPrimary" type="submit" disabled={!selectedThread}>Отправить</button>
      </form>
    </section>
  );
}
