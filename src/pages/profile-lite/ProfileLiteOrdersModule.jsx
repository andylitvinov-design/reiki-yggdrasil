import React from "react";
import { orderStatusText } from "../../lib/profileServicesClient.js";

export default function ProfileLiteOrdersModule({ onOrderPatchChange, onOrderUpdate, orderPatch, orders, ordersError, ordersStatus }) {
  return (
    <section className="profileLiteModule profileLiteOrders" aria-label="Заказы">
      <div className="cabinetCard">
        <div className="cabinetFormHeader">
          <div>
            <p className="cabinetEyebrow">Заказы</p>
            <h2>Заявки клиентов</h2>
          </div>
          <span className="cabinetStatus">{ordersStatus}</span>
        </div>
        {ordersError && <div className="cabinetNotice cabinetSecondaryDataWarning">needs verification: {ordersError}</div>}
        <div className="profileLiteServiceList">
          {orders.map((order) => (
            <article className="cabinetCard profileLiteOrderCard" key={order.id}>
              <h3>{order.client_name || "Клиент"}</h3>
              <p>{order.request_text || "Запрос не заполнен."}</p>
              <small>{order.service?.title || "Услуга"} · {orderStatusText(order.status)}</small>
              <div className="cabinetActions">
                <button type="button" onClick={() => onOrderPatchChange(order)}>Редактировать ответ</button>
              </div>
            </article>
          ))}
          {ordersStatus === "success" && orders.length === 0 && <p>Заказы пока не найдены.</p>}
        </div>
      </div>

      <form className="cabinetCard" onSubmit={(event) => { event.preventDefault(); onOrderUpdate(); }}>
        <p className="cabinetEyebrow">Ответ на заказ</p>
        <h2>{orderPatch.id ? "Обновить заказ" : "Выберите заказ"}</h2>
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
    </section>
  );
}
