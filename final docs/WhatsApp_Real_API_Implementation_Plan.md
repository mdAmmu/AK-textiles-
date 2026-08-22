# Real WhatsApp Business API Integration — Implementation Plan

## 0. What we're actually building (confirmed with user)

```
Admin (in our app)
  -> selects ONE approved template (image + title + "View Product Detail" link/button)
  -> selects group(s)/community to send to
  -> clicks Send
  -> Meta WhatsApp Cloud API sends that template as an individual message
     to every customer's REAL WhatsApp number (1 template = 1 message,
     fanned out per customer: 200 customers = 200 messages for that template)
  -> Customer receives it on their actual WhatsApp app
  -> Customer taps "View Product Detail"
  -> Our PWA opens (deep link) showing chat interface with the product's
     3 images + description
  -> Customer types a message inside OUR APP's chat (not WhatsApp reply)
  -> Admin sees it in our app's existing conversation UI and negotiates /
     places the order manually in chat (no cart/checkout automation)
  -> Repeats daily, per template per group. Rough volume: up to ~4 templates
     x 200 customers = 800 messages/day (not sent to everyone every day —
     just the ceiling for planning quota/rate limits).
```

Key point: WhatsApp is **outbound-only marketing/notification channel** to pull the customer back into our existing chat app. The reply/negotiation/order conversation happens entirely inside our app's existing `conversations` / `messages` system — we are NOT building WhatsApp-side two-way chat, cart, checkout, or ERP.

---

## 1. Fit against the existing codebase

Existing app (`backend/app`, FastAPI + SQLAlchemy + Postgres via Supabase, JWT auth):

| Existing piece | Role in this feature |
|---|---|
| `models/user.py` (ADMIN/USER, `phone`) | Source of customer phone numbers for WhatsApp send |
| `models/group.py` | Existing "audience" concept — already used by `broadcast_service.py` |
| `models/product.py` | Source of image/title/price for the template |
| `models/conversation.py`, `models/message.py` (`MessageType.PRODUCT` already exists!) | The in-app chat the customer lands in after tapping the WhatsApp CTA — already supports product messages |
| `services/broadcast_service.py` | In-app broadcast (WebSocket) — we are NOT replacing this; WhatsApp send is a new, parallel path that also creates/reuses the same `conversation` + a `PRODUCT` message so the admin sees it in the normal chat UI |
| `api/products.py`, `api/groups.py` | Reused as-is for product/audience data — no duplication |
| `core/config.py` (`Settings`) | Extend with `WHATSAPP_*` env vars |
| `websocket/` | Reused to push the customer's new chat message to the admin in real time, same as today |

New, separate pieces to add (mirrors the module boundary from the original doc, adapted):

```
backend/app/
  models/whatsapp_message.py      (delivery log, NOT chat messages)
  schemas/whatsapp.py
  services/whatsapp_api_service.py     (Meta Cloud API client)
  services/whatsapp_template_service.py
  services/whatsapp_send_service.py    (fan-out to group members)
  api/whatsapp.py                      (admin endpoints + webhook)
  api/deep_link.py or reuse products.py for /r/{product_id}?wa=1

frontend/src/
  pages/admin/WhatsAppBroadcast.tsx   (pick template + group + send)
  components/admin/TemplatePicker.tsx
  pages/ProductLanding.tsx            (PWA landing: 3 images + desc + opens chat)
```

We do **not** need Cart/Checkout/Order/ERP modules — confirmed out of scope.

---

## 2. What "template" means here

A WhatsApp template (per Meta rules) must be pre-created and approved in Meta Business Manager before it can be sent. Structure for our use case:

```
Header:  IMAGE (product image_1)
Body:    {{1}} product name / short pitch text
Button:  URL button -> https://<our-domain>/p/{{2}}   (product_id or short code)
Category: MARKETING
```

Since Meta requires template approval in advance, our app does **not** create templates dynamically — it:
1. Stores a local mapping: `whatsapp_template_name` <-> internal metadata (which variables map to which product fields).
2. Lets the admin pick **one product** -> app auto-fills `{{1}}` = product name, `{{2}}` = product id, header image = product's `image_1`.
3. Sends that filled template via Meta Cloud API to each phone number in the selected group(s).

We only need one or a small number of approved template *shapes* (e.g. "product_announcement") reused for every product — not a new template per product.

---

## 3. Data model additions

### `whatsapp_templates` (optional, can start as a config/constant list)
```
id, meta_template_name, language_code, category, is_active, created_at
```

### `whatsapp_broadcasts` (one row per admin "Send" click)
```
id
template_id / meta_template_name
product_id            -> FK products
group_ids             -> array or join table whatsapp_broadcast_groups
status                 (DRAFT / SENDING / COMPLETED / FAILED)
total_recipients
sent_count
failed_count
created_by             -> FK users (admin)
created_at, updated_at
```

### `whatsapp_messages` (per-recipient delivery log — NOT the in-app chat `messages` table)
```
id
broadcast_id           -> FK whatsapp_broadcasts
user_id                 -> FK users (the customer)
phone_number
external_message_id     (Meta's wamid, for status webhook matching)
status                  (QUEUED / SENT / DELIVERED / READ / FAILED)
error_code, error_message
sent_at, delivered_at, read_at, failed_at
created_at
```

### `whatsapp_events` (idempotency for webhook)
```
id, external_event_id (unique), event_type, processed_at, created_at
```

No changes needed to `users`, `groups`, `products`, `conversations`, `messages` — reused as-is. When a customer opens the deep link, we reuse the existing `conversation` (create if missing, same as current chat flow) and insert a normal `MessageType.PRODUCT` message so it shows in the admin's existing chat UI — no new chat mechanism.

---

## 4. Phase-by-phase build order

### Phase 1 — Meta WhatsApp Cloud API setup (account/config only, no code)
- Create Meta Business Account + WhatsApp Business App, get a test phone number.
- Get `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.
- Create and submit ONE marketing template (image + body + URL button) for approval.
- **DoD:** Can send a manual test message via Meta's API tester (Postman/curl) to your own phone.

### Phase 2 — Backend config + API client
- Add env vars to `core/config.py` (`Settings`).
- `services/whatsapp_api_service.py`: thin client — `send_template(to, template_name, image_url, body_params, button_param)`, handles auth headers, timeout, error normalization. Never called directly from routes.
- **Test:** unit test with mocked HTTP call; invalid token returns normalized error, no crash.

### Phase 3 — Webhook (status + verification)
- `api/whatsapp.py`: `GET /api/whatsapp/webhook` (verification handshake using `WHATSAPP_VERIFY_TOKEN`), `POST /api/whatsapp/webhook` (delivery/read/failed status events).
- Validate `X-Hub-Signature-256` using `WHATSAPP_APP_SECRET`.
- On event: look up `whatsapp_messages` by `external_message_id`, update status; dedupe via `whatsapp_events.external_event_id`.
- **Test:** duplicate webhook delivery only updates status once; invalid signature rejected.

### Phase 4 — DB migrations
- Alembic migration for `whatsapp_broadcasts`, `whatsapp_messages`, `whatsapp_events` (and `whatsapp_templates` if not a static config).
- **Test:** migration runs clean; FK to `users`/`products`/`groups` enforced.

### Phase 5 — Send flow (the core feature)
- `services/whatsapp_send_service.py`:
  1. Resolve group(s) -> member `User` rows with non-null `phone`.
  2. Create `whatsapp_broadcasts` row (status SENDING).
  3. For each customer: build deep link `https://<domain>/p/{product_id}?b={broadcast_id}`, call `whatsapp_api_service.send_template(...)`, insert `whatsapp_messages` row with returned `wamid`.
  4. Update `sent_count`/`failed_count`, set broadcast COMPLETED/FAILED.
- Run the fan-out as a background task (FastAPI `BackgroundTasks` or a simple async loop with rate-limit-friendly delay) so the admin's "Send" click returns immediately.
- `api/whatsapp.py` admin endpoints:
  - `POST /api/whatsapp/broadcasts` (create + trigger send) — admin-only, reuses `require_admin`.
  - `GET /api/whatsapp/broadcasts` / `GET /api/whatsapp/broadcasts/{id}` (status + counts).
- **Test:** send to 3 test customers succeeds and creates 3 `whatsapp_messages` rows; customer with no/invalid phone excluded with reason; duplicate "Send" click doesn't double-fan-out (idempotency key per broadcast).

### Phase 6 — Deep link landing -> existing chat
- Frontend route `/p/:productId?b=:broadcastId` (public, PWA-installable):
  - Fetch product (3 images, name, description) via existing `products` API (public read variant, or lightweight public endpoint).
  - If customer not logged in: existing login/register flow (phone-based, since `User.phone` is the identity), then continue.
  - On load, ensure a `conversation` exists between this customer and an assigned/default admin (reuse existing conversation creation logic), and insert one `MessageType.PRODUCT` message (product snapshot: image/name/price/description) so the admin sees "customer came from WhatsApp about Product X" in their existing chat UI.
  - Redirect into the existing chat screen for that conversation, scrolled to the product message, with the input box focused so the customer can type immediately.
- Attribution: store `broadcast_id` on that first `Message` (or a lightweight `source`/`whatsapp_broadcast_id` nullable column) so admin/analytics later can see which broadcast drove the conversation.
- **Test:** tapping link as a known customer opens existing chat with product card at top; unknown phone routes to register-then-continue; invalid product id -> safe 404 page.

### Phase 7 — Admin UI
- `pages/admin/WhatsAppBroadcast.tsx`: pick product -> pick group(s) -> preview (image + filled template text + recipient count) -> Send (confirm dialog) -> broadcast list with status (Sending/Completed, sent/delivered/read/failed counts, polling or WS-pushed).
- Reuses existing admin auth guard/layout.
- **Test:** non-admin gets 403; preview recipient count matches backend query; send requires confirmation.

### Phase 8 — Reliability + security hardening
- Rate limit sends to respect Meta's messaging limits (tier-based, e.g. 250/1000/unlimited conversations per 24h) — throttle the fan-out loop accordingly.
- Never expose `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_APP_SECRET` to frontend, logs, or API responses.
- Retry only transient send failures (network/5xx), not permanent ones (invalid number, template rejected).
- **Test:** secret-exposure scan of frontend bundle + API responses; permanent failure marked FAILED without retry loop.

### Phase 9 — End-to-end test + go-live
- Full loop with a handful of real test WhatsApp numbers: Send -> real WhatsApp receipt -> tap -> PWA opens -> chat message sent -> admin replies in app -> (manual) order agreed in chat.
- Move template from Meta test mode to production approval; switch test phone number to production number.
- **DoD:** the whole flow above works end-to-end with real numbers before scaling to the full 200-customer group.

---

## 5. Explicitly out of scope (per user decision)

- Cart, checkout, automated order creation, ERP integration — order is agreed manually in chat, same as today.
- Two-way WhatsApp chat (replying to the WhatsApp message itself) — customer must reply inside the PWA, not on WhatsApp.
- Customer segmentation beyond existing `Group` model, for now.
- Revenue/conversion analytics tied to orders — no order records exist to attribute to.

---

## 6. Build order recap (start here)

```
Phase 1 (Meta setup, no code)
  -> Phase 2 (API client)
  -> Phase 3 (webhook)
  -> Phase 4 (migrations)
  -> Phase 5 (send/fan-out) <- prove Backend -> Meta -> real WhatsApp works first
  -> Phase 6 (deep link -> existing chat) <- prove Customer -> PWA -> chat works
  -> Phase 7 (admin UI)
  -> Phase 8 (hardening)
  -> Phase 9 (real end-to-end + go-live)
```

Next step: start Phase 1 (Meta Business/App setup + template submission) — this is account setup, not code, and blocks everything after Phase 2.
