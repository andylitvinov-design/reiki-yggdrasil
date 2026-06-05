import assert from "node:assert/strict";

import {
  buildCompositionServicePayload,
  createEmptyServiceForm,
  formatServicePrice,
  getServicePublicLinkState,
  groupServicesByStatus,
  SERVICE_FORMAT_OPTIONS,
  normalizeServiceForm,
  normalizeServiceOrder,
  normalizeServiceRow,
  orderStatusText,
  serviceStatusText
} from "../src/lib/profileServicesClient.js";

const empty = createEmptyServiceForm();

assert.equal(empty.status, "draft");
assert.equal(empty.price_currency, "EUR");
assert.equal(empty.image_url, "");
assert.deepEqual(
  SERVICE_FORMAT_OPTIONS.map((option) => option.label),
  ["С подписью мастера", "Без подписи мастера", "Две версии"],
  "services manager should expose Phase 2 MVP format labels"
);

assert.deepEqual(
  normalizeServiceForm(
    {
      profile_id: " profile-1 ",
      composition_id: " composition-1 ",
      title: " Место силы для цели ",
      description: " Описание услуги ",
      image_url: " https://example.com/power.jpg ",
      image_bucket: " profile-cabinet-media ",
      image_path: " services/image.jpg ",
      price_amount: "120.5",
      price_currency: " EUR "
    },
    "published"
  ),
  {
    profile_id: "profile-1",
    composition_id: "composition-1",
    title: "Место силы для цели",
    description: "Описание услуги",
    image_url: "https://example.com/power.jpg",
    image_bucket: "profile-cabinet-media",
    image_path: "services/image.jpg",
    price_amount: 120.5,
    price_currency: "EUR",
    status: "published"
  }
);

assert.deepEqual(
  normalizeServiceForm({ price_amount: "bad", price_currency: "" }, "bad-status"),
  {
    profile_id: "",
    composition_id: null,
    title: "",
    description: "",
    image_url: "",
    image_bucket: null,
    image_path: null,
    price_amount: null,
    price_currency: "EUR",
    status: "draft"
  }
);

const normalizedRow = normalizeServiceRow({
  id: " service-1 ",
  profile_id: "profile-1",
  price_amount: "200",
  status: "published",
  image_url: "https://example.com/service.jpg"
});

assert.equal(normalizedRow.id, "service-1");
assert.equal(normalizedRow.price_amount, 200);
assert.equal(normalizedRow.display_url, "https://example.com/service.jpg");

const order = normalizeServiceOrder({
  id: " order-1 ",
  service_id: " service-1 ",
  master_profile_id: " master-1 ",
  client_name: " Анна ",
  client_photo_url: " https://example.com/client.jpg ",
  request_text: " Запрос клиента ",
  master_comment: " Готово ",
  result_image_url: " https://example.com/result.jpg ",
  status: "sent",
  profile_cabinet_services: {
    id: "service-1",
    profile_id: "master-1",
    title: "Услуга",
    price_amount: "90",
    price_currency: "EUR",
    status: "published"
  }
});

assert.equal(order.id, "order-1");
assert.equal(order.status, "sent");
assert.equal(order.service.title, "Услуга");
assert.equal(order.service.price_amount, 90);
assert.equal(serviceStatusText("published"), "Размещено");
assert.equal(orderStatusText("in_progress"), "В работе");
assert.equal(formatServicePrice({ price_amount: null, price_currency: "EUR" }), "Бесплатно");
assert.equal(formatServicePrice({ price_amount: "", price_currency: "EUR" }), "Бесплатно");
assert.equal(formatServicePrice({ price_amount: 0, price_currency: "EUR" }), "Бесплатно");
assert.equal(formatServicePrice({ price_amount: "25", price_currency: "EUR" }), "25 EUR");
assert.equal(
  getServicePublicLinkState({ status: "draft" }).message,
  "Ссылка появится после публикации.",
  "draft service should not expose an active public link"
);
assert.equal(
  getServicePublicLinkState({ status: "published", id: "service-1" }).message,
  "Услуга опубликована. Публичная ссылка будет доступна после подключения маршрута /services/:serviceId.",
  "published service should not expose a fake public link while route is missing"
);
assert.equal(
  getServicePublicLinkState({ status: "archived", id: "service-1" }).message,
  "Услуга в архиве. Публичная ссылка отключена.",
  "archived service should keep public link disabled"
);

// composition_id is normalized through normalizeServiceForm
const withComposition = normalizeServiceForm({ profile_id: "p1", composition_id: " comp-abc ", title: "Т" }, "draft");
assert.equal(withComposition.composition_id, "comp-abc", "normalizeServiceForm should trim and pass composition_id");

const withoutComposition = normalizeServiceForm({ profile_id: "p1" }, "draft");
assert.equal(withoutComposition.composition_id, null, "normalizeServiceForm should convert empty composition_id to null");

// duplicate guard: services filtered by composition_id
const servicesList = [
  normalizeServiceRow({ id: "s1", profile_id: "p1", composition_id: "comp-1", title: "Услуга 1", status: "draft" }),
  normalizeServiceRow({ id: "s2", profile_id: "p1", composition_id: null, title: "Услуга 2", status: "draft" })
];
const duplicate = servicesList.find((s) => s.composition_id && String(s.composition_id) === String("comp-1"));
assert.ok(duplicate, "duplicate guard should find an existing service by composition_id");
const noDuplicate = servicesList.find((s) => s.composition_id && String(s.composition_id) === String("comp-2"));
assert.equal(noDuplicate, undefined, "duplicate guard should not find a service for a different composition_id");

const groupedServices = groupServicesByStatus([
  normalizeServiceRow({ id: "draft-1", status: "draft", title: "Черновик" }),
  normalizeServiceRow({ id: "published-1", status: "published", title: "Опубликовано" }),
  normalizeServiceRow({ id: "archived-1", status: "archived", title: "Архив" }),
  normalizeServiceRow({ id: "draft-2", status: "bad-status", title: "Fallback draft" })
]);
assert.deepEqual(groupedServices.draft.map((item) => item.id), ["draft-1", "draft-2"]);
assert.deepEqual(groupedServices.published.map((item) => item.id), ["published-1"]);
assert.deepEqual(groupedServices.archived.map((item) => item.id), ["archived-1"]);

const archivedStatus = normalizeServiceForm({ profile_id: "p1", title: "Archived" }, "archived");
assert.equal(archivedStatus.status, "archived", "archive action should normalize to archived status safely");

const preserved = buildCompositionServicePayload({
  profileId: "profile-1",
  composition: { id: "composition-1", title: "New mandala title" },
  status: "published",
  existing: normalizeServiceRow({
    id: "service-existing",
    profile_id: "profile-1",
    composition_id: "composition-1",
    title: "Edited service title",
    description: "Edited description",
    image_url: "stored-image-ref",
    image_bucket: "media-bucket",
    image_path: "service-image-path",
    price_amount: 77,
    price_currency: "CAD",
    status: "draft"
  })
});
assert.equal(preserved.title, "Edited service title");
assert.equal(preserved.description, "Edited description");
assert.equal(preserved.image_url, "stored-image-ref");
assert.equal(preserved.image_bucket, "media-bucket");
assert.equal(preserved.image_path, "service-image-path");
assert.equal(preserved.price_amount, 77);
assert.equal(preserved.price_currency, "CAD");
assert.equal(preserved.status, "published");

console.log("profileServicesClient: all assertions passed.");
