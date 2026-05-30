import assert from "node:assert/strict";

import {
  createEmptyServiceForm,
  deliveryModeText,
  normalizeServiceForm,
  normalizeServiceOrder,
  normalizeServiceRow,
  orderStatusText,
  priceForDeliveryMode,
  serviceDeliveryOptions,
  serviceStatusText
} from "../src/lib/profileServicesClient.js";

const empty = createEmptyServiceForm();

assert.equal(empty.status, "draft");
assert.equal(empty.price_currency, "EUR");
assert.equal(empty.image_url, "");
assert.equal(empty.template_image_url, "");
assert.equal(empty.delivery_auto_enabled, true);
assert.equal(empty.delivery_master_enabled, true);
assert.equal(empty.delivery_both_enabled, true);

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
      template_image_url: " https://example.com/template.jpg ",
      template_image_bucket: " profile-cabinet-media ",
      template_image_path: " services/template.jpg ",
      delivery_auto_enabled: true,
      delivery_master_enabled: "false",
      delivery_both_enabled: "true",
      price_amount: "120.5",
      price_auto_amount: "90",
      price_master_amount: "180",
      price_both_amount: "240",
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
    template_image_url: "https://example.com/template.jpg",
    template_image_bucket: "profile-cabinet-media",
    template_image_path: "services/template.jpg",
    delivery_auto_enabled: true,
    delivery_master_enabled: false,
    delivery_both_enabled: true,
    price_amount: 120.5,
    price_auto_amount: 90,
    price_master_amount: 180,
    price_both_amount: 240,
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
    template_image_url: "",
    template_image_bucket: null,
    template_image_path: null,
    delivery_auto_enabled: true,
    delivery_master_enabled: true,
    delivery_both_enabled: true,
    price_amount: null,
    price_auto_amount: null,
    price_master_amount: null,
    price_both_amount: null,
    price_currency: "EUR",
    status: "draft"
  }
);

const normalizedRow = normalizeServiceRow({
  id: " service-1 ",
  profile_id: "profile-1",
  price_amount: "200",
  price_auto_amount: "100",
  price_master_amount: "220",
  price_both_amount: "300",
  status: "published",
  image_url: "https://example.com/service.jpg",
  template_image_url: "https://example.com/template.jpg"
});

assert.equal(normalizedRow.id, "service-1");
assert.equal(normalizedRow.price_amount, 200);
assert.equal(normalizedRow.price_auto_amount, 100);
assert.equal(normalizedRow.price_master_amount, 220);
assert.equal(normalizedRow.price_both_amount, 300);
assert.equal(normalizedRow.display_url, "https://example.com/template.jpg");
assert.equal(serviceDeliveryOptions(normalizedRow).length, 3);
assert.equal(priceForDeliveryMode(normalizedRow, "master_finish"), 220);
assert.equal(priceForDeliveryMode(normalizedRow, "both"), 300);

const order = normalizeServiceOrder({
  id: " order-1 ",
  service_id: " service-1 ",
  master_profile_id: " master-1 ",
  client_name: " Анна ",
  client_photo_url: " https://example.com/client.jpg ",
  request_text: " Запрос клиента ",
  delivery_mode: "both",
  master_comment: " Готово ",
  auto_result_image_url: " https://example.com/auto.jpg ",
  master_result_image_url: " https://example.com/master.jpg ",
  final_result_image_url: " https://example.com/final.jpg ",
  result_image_url: " https://example.com/legacy.jpg ",
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
assert.equal(order.delivery_mode, "both");
assert.equal(order.auto_result_image_url, "https://example.com/auto.jpg");
assert.equal(order.master_result_image_url, "https://example.com/master.jpg");
assert.equal(order.final_result_image_url, "https://example.com/final.jpg");
assert.equal(order.status, "sent");
assert.equal(order.service.title, "Услуга");
assert.equal(order.service.price_amount, 90);
assert.equal(serviceStatusText("published"), "Размещено");
assert.equal(orderStatusText("in_progress"), "В работе");
assert.equal(deliveryModeText("auto_template"), "Автоматическая мандала");
assert.equal(deliveryModeText("master_finish"), "С доработкой мастера");
assert.equal(deliveryModeText("both"), "Обе мандалы");
