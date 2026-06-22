import React from "react";
import { formatServicePrice, orderHasClientVisibleResult, orderStatusText } from "../../lib/profileServicesClient.js";

const PHOTO_LIMIT_MESSAGE = "Можно хранить до 4 фото. Удалите старое фото или выберите одно из существующих.";
const PHOTO_REQUIRED_MESSAGE = "Загрузите своё фото, чтобы отправить заказ в работу Мастеру.";

function photoTitle(photo, index) {
  return photo?.title || photo?.notes || `Фото ${index + 1}`;
}

function ClientOrdersView({
  clientGoalPhotos,
  clientOrders,
  clientPhotoForm,
  hasPhotoLimit,
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onDownloadOrderResult,
  onOpenOrderResult,
  onOrderConfirmationChange,
  onSubmitOrderToMaster,
  orderConfirmation,
  ordersStatus,
  pendingCartMessage,
  visibleOrdersError
}) {
  return (
    <>
      <div className="workspaceCenterColumn">
        <section className="chatPlaceholderWorkspace" aria-label="Кабинет Личный Мои заказы">
          <div className="chatPlaceholderHeader">
            <p className="cabinetEyebrow">Кабинет Личный</p>
            <h2>Мои заказы</h2>
          </div>
          {pendingCartMessage && <div className="cabinetNotice">{pendingCartMessage}</div>}
          {visibleOrdersError && <div className="cabinetNotice cabinetSecondaryDataWarning">{visibleOrdersError}</div>}
          <div className="profileLiteServiceList">
            {clientOrders.map((order) => (
              <article className="materialCard profileLiteOrderCard" key={order.id}>
                <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
                <div>
                  <h3>{order.service?.title || "Услуга"}</h3>
                  <p>{order.request_text || "Подготовьте фото и отправьте заказ мастеру."}</p>
                  <small>{formatServicePrice(order.service || {})} · {orderStatusText(order.status)} · {order.order_format}</small>
                  {orderHasClientVisibleResult(order) && (
                    <div className="cabinetCardInline">
                      <p className="cabinetEyebrow">Результат отправлен</p>
                      {order.master_comment && <p>{order.master_comment}</p>}
                      <div className="cabinetActions">
                        <button className="cabinetSecondary" onClick={() => onOpenOrderResult(order, "final")} type="button">Открыть результат</button>
                        <button className="cabinetSecondary" onClick={() => onDownloadOrderResult(order)} type="button">Скачать результат</button>
                      </div>
                    </div>
                  )}
                  {order.status !== "new" && order.status !== "ready_for_review" && order.status !== "in_progress" && order.status !== "sent" && (
                    <div className="cabinetCardInline">
                      <p className="cabinetEyebrow">Фото для заказа</p>
                      {clientGoalPhotos.length === 0 && <p>{PHOTO_REQUIRED_MESSAGE}</p>}
                      {clientGoalPhotos.map((photo, index) => (
                        <label className="cabinetCheckbox" key={photo.id || index}>
                          <input
                            checked={orderConfirmation.orderId === order.id && orderConfirmation.photoId === photo.id}
                            name={`order-photo-${order.id}`}
                            onChange={() => onOrderConfirmationChange({ orderId: order.id, photoId: photo.id })}
                            type="radio"
                          />
                          {photoTitle(photo, index)}
                        </label>
                      ))}
                      <textarea
                        onChange={(event) => onOrderConfirmationChange({ orderId: order.id, requestText: event.target.value })}
                        placeholder="Комментарий к заказу"
                        rows={3}
                        value={orderConfirmation.orderId === order.id ? orderConfirmation.requestText || "" : ""}
                      />
                      {orderConfirmation.orderId === order.id && orderConfirmation.message && (
                        <p className="cabinetSecondaryDataWarning">{orderConfirmation.message}</p>
                      )}
                      <button
                        className="cabinetPrimary"
                        disabled={orderConfirmation.status === "loading"}
                        onClick={() => onSubmitOrderToMaster(order)}
                        type="button"
                      >
                        Отправить заказ мастеру
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {ordersStatus === "success" && clientOrders.length === 0 && <p>Личные заказы пока не найдены.</p>}
          </div>
        </section>
      </div>

      <div className="workspaceRightColumn">
        <section className="cabinetCard" aria-label="Кабинет Личный Мои фото">
          <p className="cabinetEyebrow">Кабинет Личный</p>
          <h2>Мои фото</h2>
          <span className="cabinetStatus">{clientGoalPhotos.length}/4</span>
          {hasPhotoLimit && <p className="cabinetSecondaryDataWarning">{PHOTO_LIMIT_MESSAGE}</p>}
          {clientGoalPhotos.map((photo, index) => (
            <p className="cabinetMuted" key={photo.id || index}>{photoTitle(photo, index)}</p>
          ))}
          {!hasPhotoLimit && (
            <>
              <label>
                Название фото
                <input value={clientPhotoForm.title || ""} onChange={(event) => onClientPhotoFieldChange("title", event.target.value)} placeholder="Фото для услуги" />
              </label>
              <label>
                Файл
                <input accept="image/*" onChange={onClientPhotoFileChange} type="file" />
              </label>
              <button className="cabinetSecondary" onClick={onClientPhotoSave} type="button">Загрузить фото</button>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function MasterOrdersView({
  onGenerateDraftResult,
  onOpenOrderResult,
  onOrderPatchChange,
  onSendOrderResult,
  orderPatch,
  orders,
  ordersStatus,
  visibleOrdersError
}) {
  return (
    <div className="workspaceCenterColumn">
      <section className="chatPlaceholderWorkspace" aria-label="Кабинет Мастера Заявки мастера">
        <div className="chatPlaceholderHeader">
          <p className="cabinetEyebrow">Кабинет Мастера</p>
          <h2>Заявки мастера</h2>
        </div>
        {visibleOrdersError && <div className="cabinetNotice cabinetSecondaryDataWarning">{visibleOrdersError}</div>}
        <div className="profileLiteServiceList">
          {orders.map((order) => (
            <article className="materialCard profileLiteOrderCard" key={order.id}>
              <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
              <div>
                <h3>{order.service?.title || "Услуга"}</h3>
                <p>{order.request_text || "Запрос клиента не заполнен."}</p>
                <small>{orderStatusText(order.status)} · {order.order_format}</small>
                <p className="cabinetMuted">{order.client_photo_id ? "Фото клиента выбрано" : "Фото клиента не выбрано"}</p>
                {order.client_photo_path && <p className="cabinetMuted">Выбранное фото: {order.client_photo_path.split("/").pop()}</p>}
                <div className="cabinetCardInline">
                  <button className="cabinetSecondary" onClick={() => onGenerateDraftResult(order)} type="button">Создать мандалу заказа</button>
                  {order.draft_result_composition_id && (
                    <button className="cabinetSecondary" onClick={() => onOpenOrderResult(order, "draft")} type="button">Открыть мандалу заказа</button>
                  )}
                  <label>
                    Комментарий мастера
                    <textarea
                      onChange={(event) => onOrderPatchChange({ id: order.id, master_comment: event.target.value })}
                      rows={3}
                      value={orderPatch.id === order.id ? orderPatch.master_comment || "" : order.master_comment || ""}
                    />
                  </label>
                  {!order.draft_result_composition_id && <p className="cabinetSecondaryDataWarning">Сначала создайте или выберите результат мандалы заказа.</p>}
                  <button
                    className="cabinetPrimary"
                    disabled={!order.draft_result_composition_id}
                    onClick={() => onSendOrderResult(order)}
                    type="button"
                  >
                    Отправить клиенту
                  </button>
                </div>
              </div>
            </article>
          ))}
          {ordersStatus === "success" && orders.length === 0 && <p>Входящих заявок пока нет.</p>}
        </div>
      </section>
    </div>
  );
}

export default function ProfileLiteOrdersModule({
  cabinetRole = "client",
  clientGoalPhotos = [],
  clientOrders = [],
  clientPhotoForm = {},
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onDownloadOrderResult,
  onGenerateDraftResult,
  onOpenOrderResult,
  onOrderConfirmationChange,
  onOrderPatchChange,
  onSendOrderResult,
  onSubmitOrderToMaster,
  orderConfirmation = {},
  orderPatch = {},
  orders = [],
  ordersError,
  ordersStatus,
  pendingCartMessage = "",
  shellChrome
}) {
  const hasPhotoLimit = clientGoalPhotos.length >= 4;
  const isMasterRole = cabinetRole === "master";
  const visibleOrdersError = ordersError
    ? isMasterRole
      ? "Не удалось загрузить заявки мастера. Попробуйте обновить страницу."
      : "Не удалось загрузить личные заказы. Попробуйте обновить страницу."
    : "";

  if (ordersError && import.meta.env.DEV) {
    console.warn("Profile Lite service orders load failed", ordersError);
  }

  return (
    <section className="profileLiteModule profileLiteOrders mandalaWorkspace" aria-label="Заказы">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">□</div>
        <div>
          <p className="cabinetEyebrow">{isMasterRole ? "Кабинет Мастера" : "Кабинет Личный"}</p>
          <h2>{isMasterRole ? "Заявки мастера" : "Мои заказы"}</h2>
          <p>{isMasterRole ? "Входящие заявки клиентов и подготовка результата." : "Личные заказы, фото и отправка задания мастеру."}</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{isMasterRole ? orders.length : clientOrders.length}</b> {isMasterRole ? "Заявки" : "Заказы"}</span>
          <span><b>{ordersStatus}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className={`workspaceMainColumns profileLiteLegacyColumns ${isMasterRole ? "profileLiteOrdersMasterMode" : "profileLiteOrdersClientMode"}`}>
        {isMasterRole ? (
          <MasterOrdersView
            onGenerateDraftResult={onGenerateDraftResult}
            onOpenOrderResult={onOpenOrderResult}
            onOrderPatchChange={onOrderPatchChange}
            onSendOrderResult={onSendOrderResult}
            orderPatch={orderPatch}
            orders={orders}
            ordersStatus={ordersStatus}
            visibleOrdersError={visibleOrdersError}
          />
        ) : (
          <ClientOrdersView
            clientGoalPhotos={clientGoalPhotos}
            clientOrders={clientOrders}
            clientPhotoForm={clientPhotoForm}
            hasPhotoLimit={hasPhotoLimit}
            onClientPhotoFieldChange={onClientPhotoFieldChange}
            onClientPhotoFileChange={onClientPhotoFileChange}
            onClientPhotoSave={onClientPhotoSave}
            onDownloadOrderResult={onDownloadOrderResult}
            onOpenOrderResult={onOpenOrderResult}
            onOrderConfirmationChange={onOrderConfirmationChange}
            onSubmitOrderToMaster={onSubmitOrderToMaster}
            orderConfirmation={orderConfirmation}
            ordersStatus={ordersStatus}
            pendingCartMessage={pendingCartMessage}
            visibleOrdersError={visibleOrdersError}
          />
        )}
      </div>
    </section>
  );
}
