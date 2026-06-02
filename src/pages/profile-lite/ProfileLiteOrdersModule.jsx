import React from "react";
import { orderStatusText } from "../../lib/profileServicesClient.js";

export default function ProfileLiteOrdersModule({ onOrderPatchChange, onOrderUpdate, orderPatch, orders, ordersError, ordersStatus }) {
  return (
    <section className="profileLiteModule profileLiteOrders mandalaWorkspace" aria-label="Заказы">
      <div className="workspaceMainColumns profileLiteLegacyColumns">
        <aside className="mandalaModeSidebar">
          <p className="cabinetEyebrow">Рабочий режим</p>
          <h3>Заявки</h3>
          <div className="chatModeNav" aria-label="Статические разделы заявок">
            {["Новые", "В работе", "Отправлено", "Закрыты"].map((item) => (
              <button className={item === "Новые" ? "active" : ""} key={item} type="button">
                <span>{item}</span>
                <small>inline status</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="workspaceCenterColumn">
          <section className="chatPlaceholderWorkspace" aria-label="Диагностика модуля заявок">
            <div className="chatPlaceholderHeader">
              <p className="cabinetEyebrow">Заявки</p>
              <h2>Заявки клиентов</h2>
              <span>Источник данных: profile_cabinet_service_orders · stable auth shell</span>
            </div>
            {ordersError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {ordersError}</div>}
            <div className="profileLiteServiceList">
              {orders.map((order) => (
                <article className="materialCard profileLiteOrderCard" key={order.id}>
                  <div className="materialThumb">{orderStatusText(order.status).slice(0, 1)}</div>
                  <div>
                    <h3>{order.client_name || "Клиент"}</h3>
                    <p>{order.request_text || "Запрос не заполнен."}</p>
                    <small>{order.service?.title || "Услуга"} · {orderStatusText(order.status)}</small>
                    <div className="cabinetActions">
                      <button type="button" onClick={() => onOrderPatchChange(order)}>Редактировать ответ</button>
                    </div>
                  </div>
                </article>
              ))}
              {ordersStatus === "success" && orders.length === 0 && <p>Заказы пока не найдены.</p>}
            </div>
          </section>
        </div>

        <div className="workspaceRightColumn">
          <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onOrderUpdate(); }}>
            <p className="cabinetEyebrow">Заказы</p>
            <h2>{orderPatch.id ? "Обновить заказ" : "Выберите заказ"}</h2>
            <span className="cabinetStatus">{ordersStatus}</span>
            <label>
              Комментарий мастера
              <textarea value={orderPatch.master_comment} onChange={(event) => onOrderPatchChange({ ...orderPatch, master_comment: event.target.value })} rows={3} />
            </label>
            <label>
              Итоговое изображение
              <input value={orderPatch.result_image_url} onChange={(event) => onOrderPatchChange({ ...orderPatch, result_image_url: event.target.value })} placeholder="https://... или storage ref" />
            </label>
            <label>
              Статус
              <select value={orderPatch.status} onChange={(event) => onOrderPatchChange({ ...orderPatch, status: event.target.value })}>
                <option value="new">Новая</option>
                <option value="in_progress">В работе</option>
                <option value="sent">Отправлено</option>
                <option value="closed">Закрыта</option>
              </select>
            </label>
            <button className="cabinetPrimary" type="submit" disabled={!orderPatch.id}>Сохранить ответ</button>
          </form>
        </div>
      </div>
    </section>
  );
}
