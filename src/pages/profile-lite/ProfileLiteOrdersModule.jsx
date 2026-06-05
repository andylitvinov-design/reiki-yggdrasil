import React from "react";
import { formatServicePrice, orderStatusText } from "../../lib/profileServicesClient.js";

const PHOTO_LIMIT_MESSAGE = "Можно хранить до 4 фото. Удалите старое фото или выберите одно из существующих.";
const PHOTO_REQUIRED_MESSAGE = "Загрузите своё фото, чтобы отправить заказ в работу Мастеру.";

function photoTitle(photo, index) {
  return photo?.title || photo?.notes || `Фото ${index + 1}`;
}

export default function ProfileLiteOrdersModule({
  clientGoalPhotos = [],
  clientOrders = [],
  clientPhotoForm = {},
  onClientPhotoFieldChange,
  onClientPhotoFileChange,
  onClientPhotoSave,
  onOrderConfirmationChange,
  onSubmitOrderToMaster,
  orderConfirmation = {},
  orders = [],
  ordersError,
  ordersStatus,
  pendingCartMessage = "",
  shellChrome
}) {
  const hasPhotoLimit = clientGoalPhotos.length >= 4;

  return (
    <section className="profileLiteModule profileLiteOrders mandalaWorkspace" aria-label="Заказы">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">□</div>
        <div>
          <p className="cabinetEyebrow">Кабинет Личный / Кабинет Мастера</p>
          <h2>Мои Заказы и Заявки</h2>
          <p>Один профиль может быть клиентом и мастером: личные заказы отделены от входящих заявок мастера.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{clientOrders.length}</b> Мои Заказы</span>
          <span><b>{orders.length}</b> Заявки</span>
          <span><b>{ordersStatus}</b> Статус</span>
        </div>
      </div>
      {shellChrome}
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Кабинет Личный</p>
          <h3>Мои Заказы</h3>
          <div className="chatModeNav" aria-label="Разделы заказов">
            {["Мои Заказы", "Мои Фото", "Кабинет Мастера", "Заявки"].map((item) => (
              <button className={item === "Мои Заказы" ? "active" : ""} key={item} type="button">
                <span>{item}</span>
                <small>Profile Lite</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label="Кабинет Личный Мои Заказы">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Кабинет Личный</p>
              <h2>Мои Заказы</h2>
              <span>Источник данных: profile_cabinet_service_orders · client_profile_id</span>
            </div>
            {pendingCartMessage && <div className="cabinetNotice">{pendingCartMessage}</div>}
            {ordersError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {ordersError}</div>}
            <div className="profileLiteServiceList">
              {clientOrders.map((order) => (
                <article className="materialCard profileLiteOrderCard" key={order.id}>
                  <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
                  <div>
                    <h3>{order.service?.title || "Услуга"}</h3>
                    <p>{order.request_text || "Подготовьте фото и отправьте заказ мастеру."}</p>
                    <small>{formatServicePrice(order.service || {})} · {orderStatusText(order.status)} · {order.order_format}</small>
                    {order.status !== "new" && order.status !== "in_progress" && order.status !== "sent" && (
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
          <section className="cabinetCard" aria-label="Кабинет Личный Мои Фото">
            <p className="cabinetEyebrow">Кабинет Личный</p>
            <h2>Мои Фото</h2>
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

          <section className="cabinetCard" aria-label="Кабинет Мастера Заявки">
            <p className="cabinetEyebrow">Кабинет Мастера</p>
            <h2>Заявки</h2>
            <span className="cabinetStatus">{ordersStatus}</span>
            {orders.map((order) => (
              <article className="materialCard profileLiteOrderCard" key={order.id}>
                <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
                <div>
                  <h3>{order.service?.title || "Услуга"}</h3>
                  <p>{order.request_text || "Запрос клиента не заполнен."}</p>
                  <small>{orderStatusText(order.status)} · {order.order_format}</small>
                  <p className="cabinetMuted">{order.client_photo_id ? "Фото клиента выбрано" : "Фото клиента не выбрано"}</p>
                </div>
              </article>
            ))}
            {ordersStatus === "success" && orders.length === 0 && <p>Входящих заявок пока нет.</p>}
          </section>
        </div>
      </div>
    </section>
  );
}
