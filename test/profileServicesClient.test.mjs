import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildClientInviteUrl,
  buildClientDirectoryFromOrders,
  buildCompositionResultUrl,
  buildCompositionServicePayload,
  buildServiceCartItem,
  buildServicePublicUrl,
  buildServiceQueryParams,
  buildServiceOrderDraftPayload,
  buildSendOrderResultPayload,
  buildServiceOrderSubmitPayload,
  claimClientInvite,
  clientMandalaStatusText,
  createClientInvite,
  createEmptyServiceForm,
  createServiceCartStore,
  filterPublishedServices,
  formatServicePrice,
  getClientDisplayName,
  getClientMandalaPreviewState,
  getServicePublicLinkState,
  groupServicesByStatus,
  isPendingServiceCartFresh,
  PUBLIC_SERVICE_NOT_FOUND_MESSAGE,
  PUBLIC_SERVICE_UNAVAILABLE_MESSAGE,
  SERVICE_FORMAT_OPTIONS,
  SERVICE_CART_KEY,
  PENDING_SERVICE_CART_KEY,
  normalizeServiceForm,
  normalizeServiceOrder,
  normalizeServiceRow,
  orderHasClientVisibleResult,
  orderStatusText,
  resolvePublicServiceState,
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
  SERVICE_FORMAT_OPTIONS.map((option) => option.value),
  ["signature", "no_signature", "both"],
  "public service format values must match the Phase 3 contract"
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
assert.equal(order.result_image_url, "https://example.com/result.jpg");
assert.deepEqual(getClientMandalaPreviewState(order), { src: "https://example.com/result.jpg", message: "" });
assert.equal(order.draft_result_composition_id, "", "missing draft result should normalize to empty string");
assert.equal(order.final_result_composition_id, "", "missing final result should normalize to empty string");
assert.equal(serviceStatusText("published"), "Размещено");
assert.equal(orderStatusText("in_progress"), "В работе");
assert.equal(clientMandalaStatusText("ready_for_review"), "Готово к отправке");
assert.equal(clientMandalaStatusText("sent"), "Отправлено клиенту");
assert.equal(clientMandalaStatusText("saved_for_client"), "Сохранено для клиента");
assert.equal(clientMandalaStatusText("send_error"), "Ошибка сохранения/отправки");
assert.deepEqual(
  getClientMandalaPreviewState({ result_image_bucket: "profile-cabinet-media", result_image_path: "orders/result.png" }),
  { src: "", message: "Превью недоступно" },
  "private storage result refs should not be exposed as preview URLs without signed display data"
);
assert.deepEqual(
  getClientMandalaPreviewState({}),
  { src: "", message: "Превью мандалы пока не создано" }
);
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
  "Публичная ссылка для клиентов",
  "published service should expose a real public link after /services/:serviceId is implemented"
);
assert.equal(getServicePublicLinkState({ status: "published", id: "service-1" }).isActive, true);
assert.equal(buildServicePublicUrl({ id: "service-1" }, "https://mentalica.vercel.app"), "https://mentalica.vercel.app/services/service-1");
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

const clientDirectory = buildClientDirectoryFromOrders([
  normalizeServiceOrder({
    id: "order-a",
    client_profile_id: "client-profile-a",
    client_name: " Анна ",
    request_text: "Запрос 1"
  }),
  normalizeServiceOrder({
    id: "order-b",
    client_profile_id: "client-profile-a",
    client_name: "Анна",
    request_text: "Запрос 2"
  }),
  normalizeServiceOrder({
    id: "order-c",
    client_name: " Борис ",
    final_result_composition_id: "final-c",
    status: "sent"
  })
]);
assert.deepEqual(
  clientDirectory.map((client) => [client.key, client.client_name, client.orders.map((order) => order.id)]),
  [
    ["client:client-profile-a", "Анна", ["order-a", "order-b"]],
    ["name:Борис", "Борис", ["order-c"]]
  ],
  "client directory should group by client_profile_id first and client_name fallback second"
);

const clientDirectoryWithSavedWork = buildClientDirectoryFromOrders([], [], [
  {
    id: "composition-for-client",
    title: "Клиентская мандала",
    object_refs: {
      __client_work: {
        client_name: "Вера",
        request_text: "личный запрос",
        result_composition_id: "composition-for-client",
        status: "saved_for_client"
      },
      __center_image: "storage://profile-cabinet-media/compositions/center.png"
    },
    object_ref_urls: {
      "storage://profile-cabinet-media/compositions/center.png": "https://signed.example/center.png"
    }
  }
]);
assert.equal(clientDirectoryWithSavedWork[0].client_name, "Вера");
assert.equal(clientDirectoryWithSavedWork[0].clientWorks[0].result_composition_id, "composition-for-client");
assert.equal(clientDirectoryWithSavedWork[0].clientWorks[0].preview_url, "https://signed.example/center.png");
assert.deepEqual(
  getClientMandalaPreviewState(clientDirectoryWithSavedWork[0].clientWorks[0]),
  { src: "https://signed.example/center.png", message: "" }
);

const clientDirectoryWithLegacySavedWork = buildClientDirectoryFromOrders([], [], [
  {
    id: "legacy-kora-1",
    title: "Кора · 1",
    object_refs: {
      __center_image: "storage://profile-cabinet-media/compositions/kora-1.png"
    },
    object_ref_urls: {
      "storage://profile-cabinet-media/compositions/kora-1.png": "https://signed.example/kora-1.png"
    }
  },
  {
    id: "global-template",
    title: "Шаблон мастера",
    object_refs: {}
  }
]);
assert.equal(clientDirectoryWithLegacySavedWork.length, 1, "legacy wrongly-routed client mandalas should prevent an empty Clients tab");
assert.equal(clientDirectoryWithLegacySavedWork[0].client_name, "1");
assert.equal(clientDirectoryWithLegacySavedWork[0].clientWorks[0].result_composition_id, "legacy-kora-1");
assert.deepEqual(
  getClientMandalaPreviewState(clientDirectoryWithLegacySavedWork[0].clientWorks[0]),
  { src: "https://signed.example/kora-1.png", message: "" },
  "legacy client mandalas should still use signed composition previews in Clients"
);

const clientDirectoryWithFilenameNames = buildClientDirectoryFromOrders([
  normalizeServiceOrder({
    id: "order-img",
    client_name: "IMG_2481.jpeg",
    client_photo_id: "photo-2481"
  }),
  normalizeServiceOrder({
    id: "order-human",
    client_name: " Мария Север "
  })
]);
assert.deepEqual(
  clientDirectoryWithFilenameNames.map((client) => [client.key, client.client_name, client.client_display_name, client.client_display_note]),
  [
    ["name:IMG_2481.jpeg", "IMG_2481.jpeg", "Клиент без имени", "Имя клиента не заполнено"],
    ["name:Мария Север", "Мария Север", "Мария Север", ""]
  ],
  "client directory should keep stable raw keys but use safe display names for filename-like client names"
);
assert.equal(getClientDisplayName({ client_name: "IMG_2482.jpeg" }), "Клиент без имени");
assert.equal(getClientDisplayName({ client_name: "Анна" }), "Анна");

const clientDirectoryWithPhotosOnly = buildClientDirectoryFromOrders([], [
  { id: "photo-a", title: "IMG_1842.jpeg", notes: "цель клиента" },
  { id: "photo-b", title: "Фото цели" }
], []);
assert.deepEqual(
  clientDirectoryWithPhotosOnly,
  [],
  "client selector should not list client/goal photo titles or filenames as clients"
);

const clientDirectoryWithInvites = buildClientDirectoryFromOrders([], [], [], [
  {
    id: "invite-1",
    client_name: "Анна",
    invite_token: "token-1",
    status: "pending"
  }
]);
assert.equal(clientDirectoryWithInvites[0].invites.length, 1, "client directory should include pending invites");
assert.equal(clientDirectoryWithInvites[0].status, "pending", "pending invite should keep pending status until claim");
assert.equal(
  buildClientInviteUrl(clientDirectoryWithInvites[0].invites[0], "https://2mentalica.vercel.app"),
  "https://2mentalica.vercel.app/profile/orders?invite=token-1",
  "invite URL should point to authenticated orders claim route"
);

assert.equal(buildCompositionResultUrl("", "https://mentalica.vercel.app"), "");
assert.equal(
  buildCompositionResultUrl("final result 1", "https://mentalica.vercel.app/"),
  "https://mentalica.vercel.app/profile/mandalas?composition=final%20result%201",
  "composition result links should be authenticated internal cabinet links"
);

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

const publicServices = [
  normalizeServiceRow({ id: "draft-public", status: "draft", title: "Черновик", description: "private" }),
  normalizeServiceRow({ id: "published-public", status: "published", title: "Опубликовано", description: "visible" }),
  normalizeServiceRow({ id: "archived-public", status: "archived", title: "Архив", description: "private" })
];
assert.deepEqual(
  filterPublishedServices(publicServices).map((item) => item.id),
  ["published-public"],
  "public shop should list only published services"
);
assert.deepEqual(
  buildServiceQueryParams({ publicOnly: true, id: "service-1" }),
  {
    path: "/rest/v1/profile_cabinet_services?id=eq.service-1&status=eq.published&select=id%2Cprofile_id%2Ccomposition_id%2Ctitle%2Cdescription%2Cimage_url%2Cimage_bucket%2Cimage_path%2Cprice_amount%2Cprice_currency%2Cstatus%2Ccreated_at%2Cupdated_at&limit=1",
    publicRequest: true
  },
  "public service detail query must filter by id and published status"
);
assert.equal(resolvePublicServiceState(null, "missing").message, PUBLIC_SERVICE_NOT_FOUND_MESSAGE);
assert.equal(resolvePublicServiceState(normalizeServiceRow({ id: "s1", status: "draft", title: "Draft title" }), "s1").message, PUBLIC_SERVICE_UNAVAILABLE_MESSAGE);
assert.equal(resolvePublicServiceState(normalizeServiceRow({ id: "s1", status: "archived", title: "Archived title" }), "s1").message, PUBLIC_SERVICE_UNAVAILABLE_MESSAGE);
assert.equal(resolvePublicServiceState(normalizeServiceRow({ id: "s1", status: "published", title: "Published title" }), "s1").isVisible, true);

const cartItem = buildServiceCartItem({
  service: normalizeServiceRow({
    id: " service-1 ",
    profile_id: " master-1 ",
    composition_id: " composition-1 ",
    price_amount: 0,
    price_currency: "EUR",
    status: "published",
    image_path: "private/path.jpg"
  }),
  format: "both",
  now: "2026-06-05T12:00:00.000Z"
});
assert.deepEqual(Object.keys(cartItem).sort(), [
  "composition_id",
  "created_at",
  "format",
  "master_profile_id",
  "price_amount",
  "price_currency",
  "service_id"
].sort(), "cart item must store only the approved compact fields");
assert.equal(cartItem.service_id, "service-1");
assert.equal(cartItem.composition_id, "composition-1");
assert.equal(cartItem.master_profile_id, "master-1");
assert.equal(cartItem.format, "both");
assert.equal(cartItem.price_amount, null);
assert.equal(cartItem.price_currency, "EUR");
assert.equal(JSON.stringify(cartItem).includes("private/path"), false, "cart must not store private image refs");

const memoryStorage = new Map();
const storage = {
  getItem: (key) => memoryStorage.get(key) || null,
  setItem: (key, value) => memoryStorage.set(key, value),
  removeItem: (key) => memoryStorage.delete(key)
};
const cartStore = createServiceCartStore(storage);
cartStore.set(cartItem);
cartStore.set(buildServiceCartItem({
  service: normalizeServiceRow({ id: "service-2", profile_id: "master-2", composition_id: "composition-2", price_amount: 25, price_currency: "USD", status: "published" }),
  format: "signature",
  now: "2026-06-05T12:01:00.000Z"
}));
assert.equal(JSON.parse(storage.getItem(SERVICE_CART_KEY)).service_id, "service-2", "adding a service should replace the previous one-service cart item");
cartStore.savePending();
assert.equal(JSON.parse(storage.getItem(PENDING_SERVICE_CART_KEY)).service_id, "service-2", "checkout should save pending cart for auth restore");
assert.equal(isPendingServiceCartFresh({ created_at: "2026-06-05T00:00:00.000Z" }, new Date("2026-06-05T23:59:59.000Z")), true);
assert.equal(isPendingServiceCartFresh({ created_at: "2026-06-04T00:00:00.000Z" }, new Date("2026-06-05T00:00:01.000Z")), false);

const orderDraft = buildServiceOrderDraftPayload({
  cartItem,
  clientProfileId: "client-1",
  service: normalizeServiceRow({ id: "service-1", profile_id: "master-1", composition_id: "composition-1", status: "published" })
});
assert.deepEqual(orderDraft, {
  service_id: "service-1",
  master_profile_id: "master-1",
  client_profile_id: "client-1",
  template_composition_id: "composition-1",
  order_format: "both",
  client_photo_id: null,
  client_photo_url: "",
  client_photo_bucket: null,
  client_photo_path: null,
  request_text: "",
  status: "photo_required"
});
assert.throws(
  () => buildServiceOrderDraftPayload({ cartItem, clientProfileId: "client-1", service: normalizeServiceRow({ id: "service-1", status: "draft" }) }),
  /Услуга недоступна/,
  "order drafts must re-check that the service is still published"
);
assert.deepEqual(
  buildServiceOrderSubmitPayload({
    orderId: "order-1",
    clientProfileId: "client-1",
    photo: { id: "photo-1", image_ref: "storage://profile-cabinet-media/client/photo.jpg", image_bucket: "profile-cabinet-media", image_path: "client/photo.jpg" },
    requestText: "Запрос"
  }),
  {
    id: "order-1",
    client_profile_id: "client-1",
    client_photo_id: "photo-1",
    client_photo_url: "",
    client_photo_bucket: "profile-cabinet-media",
    client_photo_path: "client/photo.jpg",
    request_text: "Запрос",
    status: "new"
  },
  "explicit submit should lock selected photo and move status to new"
);

const draftResultOrder = normalizeServiceOrder({
  id: "order-draft-result",
  service_id: "service-1",
  status: "ready_for_review",
  draft_result_composition_id: "draft-composition-1",
  final_result_composition_id: "",
  master_comment: "Черновик готов"
});
assert.equal(draftResultOrder.status, "ready_for_review");
assert.equal(draftResultOrder.draft_result_composition_id, "draft-composition-1");
assert.equal(orderHasClientVisibleResult(draftResultOrder), false, "client must not see a draft result before sent");

const sentResultOrder = normalizeServiceOrder({
  id: "order-sent",
  service_id: "service-1",
  status: "sent",
  draft_result_composition_id: "draft-composition-1",
  final_result_composition_id: "final-composition-1",
  sent_at: "2026-06-05T17:30:00.000Z",
  master_comment: "Готово"
});
assert.equal(sentResultOrder.final_result_composition_id, "final-composition-1");
assert.equal(sentResultOrder.sent_at, "2026-06-05T17:30:00.000Z");
assert.equal(orderHasClientVisibleResult(sentResultOrder), true, "sent order should expose the final result to client UI");

assert.deepEqual(
  buildSendOrderResultPayload({
    orderId: "order-1",
    resultCompositionId: "result-1",
    comment: " Мандала готова "
  }),
  {
    id: "order-1",
    final_result_composition_id: "result-1",
    master_comment: "Мандала готова",
    status: "sent"
  },
  "send result should set final composition and sent status without exposing draft fields"
);
assert.throws(
  () => buildSendOrderResultPayload({ orderId: "order-1", resultCompositionId: "", comment: "" }),
  /Сначала создайте или выберите результат мандалы заказа/,
  "send result must require an existing result composition"
);

const phase4Migration = readFileSync(new URL("../supabase/migrations/20260605153000_service_orders_client_phase4.sql", import.meta.url), "utf8");
assert.match(
  phase4Migration,
  /prevent_service_order_identity_change/,
  "migration should install a trigger that prevents changing service order identity fields"
);
assert.match(phase4Migration, /old\.service_id is distinct from new\.service_id/);
assert.match(phase4Migration, /old\.master_profile_id is distinct from new\.master_profile_id/);
assert.match(phase4Migration, /old\.client_profile_id is distinct from new\.client_profile_id/);


const phase5Migration = readFileSync(new URL("../supabase/migrations/20260605184500_service_orders_result_delivery_phase5.sql", import.meta.url), "utf8");
assert.match(phase5Migration, /draft_result_composition_id/, "Phase 5 migration should add draft result composition id");
assert.match(phase5Migration, /final_result_composition_id/, "Phase 5 migration should add final result composition id");
assert.match(phase5Migration, /ready_for_review/, "Phase 5 migration should allow ready_for_review status");
assert.match(phase5Migration, /sent_at/, "Phase 5 migration should add sent_at");
assert.match(phase5Migration, /client reads own sent final result compositions/, "RLS assumptions should document client final-only visibility");
assert.doesNotMatch(phase5Migration, /drop table|drop column|alter column .* type/i, "Phase 5 migration must stay additive");

const personalOrdersSchemaMigration = readFileSync(new URL("../supabase/migrations/20260623120000_service_orders_personal_schema_fix.sql", import.meta.url), "utf8");
for (const columnName of [
  "client_profile_id",
  "template_composition_id",
  "draft_result_composition_id",
  "final_result_composition_id",
  "order_format",
  "client_photo_id",
  "sent_at"
]) {
  assert.match(personalOrdersSchemaMigration, new RegExp(`add column if not exists ${columnName}\\b`), `personal orders schema migration should add ${columnName}`);
}
assert.match(personalOrdersSchemaMigration, /profile_cabinet_service_orders_client_profile_id_idx/, "personal orders schema migration should index client_profile_id");
assert.match(personalOrdersSchemaMigration, /draft[\s\S]*photo_required[\s\S]*ready_for_review[\s\S]*sent/, "personal orders schema migration should allow the current client/master status flow");
assert.match(personalOrdersSchemaMigration, /client reads own service orders/, "personal orders schema migration should add authenticated client read policy");
assert.match(personalOrdersSchemaMigration, /client updates own service orders/, "personal orders schema migration should add authenticated client update policy");
assert.match(personalOrdersSchemaMigration, /owner reads own service orders/, "personal orders schema migration should preserve master read policy");
assert.match(personalOrdersSchemaMigration, /owner updates own service orders/, "personal orders schema migration should preserve master update policy");
assert.match(personalOrdersSchemaMigration, /public creates orders for published services/, "personal orders schema migration should preserve legacy public order creation policy");
assert.doesNotMatch(personalOrdersSchemaMigration, /drop table|drop column|alter column .* type/i, "personal orders schema migration must stay additive");

const inviteMigration = readFileSync(new URL("../supabase/migrations/20260622190000_profile_client_invites.sql", import.meta.url), "utf8");
assert.match(inviteMigration, /profile_cabinet_client_invites/, "invite migration should add client invite table");
assert.match(inviteMigration, /invite_token_hash/, "invite migration should store token hash, not raw token");
assert.match(inviteMigration, /create_client_invite/, "invite migration should expose master invite RPC");
assert.match(inviteMigration, /claim_client_invite/, "invite migration should expose client claim RPC");
assert.match(inviteMigration, /enable row level security/, "invite table must keep RLS enabled");
assert.doesNotMatch(inviteMigration, /service_role/i, "invite implementation must not require a frontend service-role key");
assert.doesNotMatch(inviteMigration, /client_name\s*=/i, "claim flow must not link by name-only matching");
assert.equal(typeof createClientInvite, "function", "services client should expose createClientInvite RPC helper");
assert.equal(typeof claimClientInvite, "function", "services client should expose claimClientInvite RPC helper");

console.log("profileServicesClient: all assertions passed.");
