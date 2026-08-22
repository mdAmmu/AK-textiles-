# WhatsApp Business Integration — Separate Module
## Detailed Phase-by-Phase Implementation Plan + Test Cases

## 1. Goal

Implement WhatsApp Business functionality as a **separate module** inside the existing application.

The target flow is:

```text
Admin
  ↓
Select Product
  ↓
Select Customer/Audience
  ↓
Send approved WhatsApp message
  ↓
Customer receives message
  ↓
Customer taps "View Product & Order"
  ↓
Our App opens
  ↓
Product → Cart → Checkout
  ↓
Existing Order Module
  ↓
ERP
```

### Core architecture rule

```text
WhatsApp Module
      ↓
uses existing Product / Customer / Cart / Order / ERP modules
      ↓
does NOT recreate them
```

WhatsApp is the **communication and re-engagement channel**. The existing application remains the **shopping/order system**.

---

# 2. What the Separate WhatsApp Module Owns

The WhatsApp module owns:

- WhatsApp API communication
- WhatsApp configuration
- Webhook verification
- Webhook event processing
- WhatsApp contacts/mapping
- WhatsApp messages
- Message templates
- Campaigns
- Audience selection
- Message status
- Retry/idempotency
- Campaign attribution
- WhatsApp analytics
- WhatsApp admin screens

It should NOT own:

- Product master data
- Customer master data
- Cart
- Order calculation
- Inventory
- Invoice
- ERP business logic

Those remain in the existing modules.

---

# 3. Recommended Module Structure

## Backend

```text
backend/
└── modules/
    └── whatsapp/
        ├── controllers/
        │   ├── whatsapp.controller
        │   ├── webhook.controller
        │   └── campaign.controller
        ├── services/
        │   ├── whatsapp-api.service
        │   ├── whatsapp-message.service
        │   ├── whatsapp-webhook.service
        │   ├── whatsapp-campaign.service
        │   ├── whatsapp-contact.service
        │   ├── whatsapp-template.service
        │   ├── whatsapp-analytics.service
        │   └── whatsapp-attribution.service
        ├── repositories/
        │   ├── whatsapp-contact.repository
        │   ├── whatsapp-message.repository
        │   ├── whatsapp-campaign.repository
        │   └── whatsapp-event.repository
        ├── routes/
        │   └── whatsapp.routes
        ├── validators/
        │   ├── campaign.validator
        │   ├── webhook.validator
        │   └── message.validator
        ├── types/
        ├── utils/
        ├── constants/
        └── index
```

## Frontend

```text
frontend/
└── modules/
    └── whatsapp/
        ├── pages/
        │   ├── WhatsAppDashboard
        │   ├── CampaignList
        │   ├── CreateCampaign
        │   ├── CampaignDetails
        │   └── WhatsAppSettings
        ├── components/
        │   ├── CampaignForm
        │   ├── CampaignPreview
        │   ├── AudienceSelector
        │   ├── TemplateSelector
        │   ├── CampaignStatus
        │   └── CampaignAnalytics
        ├── services/
        ├── hooks/
        ├── types/
        └── utils/
```

Adapt filenames to the existing project's framework and conventions.

---

# 4. Implementation Order

```text
PHASE 0  → Existing Project Audit
PHASE 1  → WhatsApp Module Skeleton
PHASE 2  → Configuration + Secrets
PHASE 3  → Meta API Client
PHASE 4  → Webhook
PHASE 5  → WhatsApp Database
PHASE 6  → Customer/Phone Mapping
PHASE 7  → Message Templates
PHASE 8  → Send Test Message
PHASE 9  → Product Campaign
PHASE 10 → Deep Link + Attribution
PHASE 11 → Customer Product Flow
PHASE 12 → Cart + Order Integration
PHASE 13 → Campaign Management UI
PHASE 14 → Customer Segmentation
PHASE 15 → Message Status + Analytics
PHASE 16 → Business Notifications
PHASE 17 → Reliability + Security
PHASE 18 → Full Testing
PHASE 19 → Staging
PHASE 20 → Production
```

Every phase below contains:
- Objective
- Implementation tasks
- Test cases
- Definition of Done

---

# PHASE 0 — Existing Project Audit

## Objective

Understand the existing project before writing WhatsApp code.

## Inspect

- Frontend architecture
- Backend architecture
- Database
- Authentication
- Admin roles
- Customer/party model
- Product model
- Product categories
- Cart
- Checkout
- Order model
- Inventory
- ERP integration
- API conventions
- Error handling
- Logging
- Environment variables
- Deployment

## Create

```text
docs/whatsapp/PROJECT_INTEGRATION_MAP.md
```

Document:

| Existing Module | WhatsApp Requirement |
|---|---|
| Product | Product ID, name, image, price, availability |
| Customer | Customer ID, phone, status |
| Cart | Add products |
| Order | Create order |
| ERP | Process order |
| Admin | Create campaigns |
| Authentication | Protect admin/customer actions |

## Test Cases

### TC-0.1 Product mapping
Find the existing product API/model.

**Expected:** Product ID and required fields are identified.

### TC-0.2 Customer mapping
Find the customer/party API/model.

**Expected:** Customer ID and phone field are identified.

### TC-0.3 Order mapping
Find the existing order creation flow.

**Expected:** WhatsApp can later reuse it.

### TC-0.4 Authentication
Identify admin and customer authentication.

**Expected:** WhatsApp can reuse existing authorization.

## Definition of Done

Integration points are documented before WhatsApp business code is written.

---

# PHASE 1 — Create the Separate WhatsApp Module

## Objective

Create the module without changing existing business logic.

Create:

```text
backend/modules/whatsapp/
frontend/modules/whatsapp/
```

Add:

```http
GET /api/whatsapp/health
```

Expected:

```json
{
  "module": "whatsapp",
  "status": "ok"
}
```

## Test Cases

### TC-1.1 Module health
Call `/api/whatsapp/health`.

**Expected:** `200 OK`.

### TC-1.2 Existing product regression
Call an existing product endpoint.

**Expected:** Existing product functionality still works.

### TC-1.3 Existing order regression
Create/read a test order using the existing flow.

**Expected:** No behavior changes.

## Definition of Done

WhatsApp exists as an isolated module and existing functionality is unaffected.

---

# PHASE 2 — WhatsApp Configuration and Secrets

## Objective

Securely configure the official WhatsApp Business API.

Example backend variables:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=
```

Use the existing project's naming conventions.

## Rules

Never:

- Put access tokens in React/frontend
- Commit `.env` secrets
- Return secrets from APIs
- Log access tokens

## Test Cases

### TC-2.1 Valid configuration
Start backend with all required values.

**Expected:** Backend starts.

### TC-2.2 Missing token
Remove access token.

**Expected:** Clear configuration error.

### TC-2.3 Secret exposure
Inspect frontend/network responses.

**Expected:** No WhatsApp secret is exposed.

### TC-2.4 Git protection
Check tracked files.

**Expected:** Real `.env` secrets are not committed.

## Definition of Done

Only the backend can access WhatsApp credentials.

---

# PHASE 3 — Build the Meta WhatsApp API Client

## Objective

Create one reusable service for communication with Meta.

Flow:

```text
Campaign Service
      ↓
WhatsApp Message Service
      ↓
WhatsApp API Client
      ↓
Meta WhatsApp API
```

The API client handles:

- Authentication
- HTTP requests
- Timeouts
- Response parsing
- Error normalization

Business controllers should never contain raw Meta API logic.

## Test Cases

### TC-3.1 Initialization
Start the application.

**Expected:** API client initializes.

### TC-3.2 Invalid token
Use an invalid test token.

**Expected:** Normalized authentication error.

### TC-3.3 Timeout
Simulate network timeout.

**Expected:** Controlled error; application does not crash.

### TC-3.4 Meta error
Mock an API error.

**Expected:** Internal WhatsApp error format is returned.

## Definition of Done

All Meta API calls pass through the WhatsApp API client.

---

# PHASE 4 — Webhook Module

## Objective

Receive WhatsApp events.

Routes:

```http
GET  /api/whatsapp/webhook
POST /api/whatsapp/webhook
```

Flow:

```text
Meta
 ↓
Webhook Controller
 ↓
Validation
 ↓
Webhook Service
 ↓
Event Repository
 ↓
Message/Campaign updates
```

Support initially:

- Verification
- Message status
- Delivered
- Read
- Failed
- Relevant incoming events

## Security

Implement the required webhook verification/authenticity validation.

## Idempotency

Use the external event/message ID so the same event cannot be processed twice.

## Test Cases

### TC-4.1 Valid verification
Send valid verification request.

**Expected:** Verification succeeds.

### TC-4.2 Invalid verification
Send invalid verification data.

**Expected:** Request rejected.

### TC-4.3 Valid event
Send a test event.

**Expected:** Event is accepted and processed.

### TC-4.4 Duplicate event
Send the same event twice.

**Expected:** Second event does not duplicate processing.

### TC-4.5 Unknown event
Send unsupported event.

**Expected:** No crash; handled safely.

## Definition of Done

Webhook verification and event processing work reliably.

---

# PHASE 5 — WhatsApp Database Layer

## Objective

Store WhatsApp-specific information.

## Suggested tables

### `whatsapp_contacts`

```text
id
customer_id
phone_number
external_whatsapp_id
display_name
status
created_at
updated_at
```

### `whatsapp_messages`

```text
id
campaign_id
customer_id
external_message_id
direction
message_type
category
template_name
status
error_code
error_message
sent_at
delivered_at
read_at
failed_at
created_at
updated_at
```

### `whatsapp_campaigns`

```text
id
name
product_id
segment_id
template_name
status
audience_count
sent_count
delivered_count
read_count
clicked_count
ordered_count
created_by
created_at
updated_at
```

### `whatsapp_events`

```text
id
external_event_id
event_type
payload_hash/reference
processed
processed_at
created_at
```

Use foreign keys to existing customers/products where appropriate.

## Test Cases

### TC-5.1 Migration
Run migration.

**Expected:** Tables created successfully.

### TC-5.2 Invalid customer
Insert an invalid customer reference.

**Expected:** Database rejects invalid relationship.

### TC-5.3 Duplicate message
Insert same external message ID twice.

**Expected:** Duplicate prevented.

### TC-5.4 Regression
Run existing database tests.

**Expected:** Existing functionality remains intact.

## Definition of Done

WhatsApp data can be stored safely.

---

# PHASE 6 — Customer + WhatsApp Mapping

## Objective

Connect existing customers with WhatsApp.

```text
Existing Customer
       ↓
WhatsApp Contact
```

Implement:

- Phone normalization
- Mapping
- Duplicate detection
- Missing number handling
- Invalid number handling
- Customer status checks
- Required messaging permission/status rules

## Test Cases

### TC-6.1 Valid customer
Use valid customer phone.

**Expected:** Mapping created.

### TC-6.2 Duplicate phone
Map same normalized number twice.

**Expected:** Duplicate prevented.

### TC-6.3 Invalid phone
Use invalid phone.

**Expected:** Validation error.

### TC-6.4 Missing phone
Customer has no phone.

**Expected:** Customer excluded from WhatsApp audience.

### TC-6.5 Phone normalization
Use different formatting of the same number.

**Expected:** Same canonical contact.

## Definition of Done

Existing customers can safely be targeted.

---

# PHASE 7 — Message Templates

## Objective

Create a reusable template abstraction.

Example concept:

```text
🆕 New Product Available

{{product_name}}

Price: {{price}}
Availability: {{availability}}

[View Product & Order]
```

The real template must follow the applicable WhatsApp approval/category requirements.

## Template service

Responsibilities:

- List available templates
- Validate selected template
- Validate variables
- Build CTA
- Build message payload

## Test Cases

### TC-7.1 Valid template
Select valid template.

**Expected:** Payload generated.

### TC-7.2 Missing variable
Remove required product name.

**Expected:** Validation fails.

### TC-7.3 Invalid template
Use unknown template.

**Expected:** Campaign cannot send.

### TC-7.4 CTA URL
Generate product URL.

**Expected:** Correct product URL.

## Definition of Done

The application generates valid template payloads.

---

# PHASE 8 — Send One Test Message

## Objective

Prove the basic API cycle before implementing campaigns.

Flow:

```text
Backend
 ↓
Test Customer
 ↓
Approved Template
 ↓
Meta
 ↓
Test WhatsApp Number
```

Store:

- Campaign/message record
- External message ID
- Status

## Test endpoint

Conceptually:

```http
POST /api/whatsapp/test-message
```

Admin-only and preferably disabled outside development/staging.

## Test Cases

### TC-8.1 Successful send
Send to test number.

**Expected:** WhatsApp receives message and external ID is stored.

### TC-8.2 Invalid number
Use invalid number.

**Expected:** Clear failure.

### TC-8.3 Invalid template
Use invalid template.

**Expected:** Message is not sent.

### TC-8.4 Database record
After sending.

**Expected:** Message record exists.

### TC-8.5 Status webhook
Receive delivery/read event.

**Expected:** Message status updates.

## Definition of Done

This complete loop works:

```text
Backend → Meta → WhatsApp → Webhook → Database
```

---

# PHASE 9 — Product Campaign

## Objective

Connect existing products to WhatsApp.

Admin flow:

```text
Select Product
 ↓
Select Audience
 ↓
Select Template
 ↓
Preview
 ↓
Confirm
 ↓
Create Campaign
 ↓
Send
```

Use the existing product master.

Do not duplicate products inside WhatsApp.

## Test Cases

### TC-9.1 Active product
Select active product.

**Expected:** Campaign can be created.

### TC-9.2 Inactive product
Select inactive product.

**Expected:** Campaign blocked.

### TC-9.3 Deleted product
Try sending an old campaign for a deleted product.

**Expected:** Safe failure.

### TC-9.4 Customer eligibility
Customer cannot access the product.

**Expected:** Customer excluded or campaign blocked according to business rules.

## Definition of Done

Admin can send a product campaign to a controlled test audience.

---

# PHASE 10 — Deep Link + Attribution

## Objective

Connect the WhatsApp campaign to the application.

Example:

```text
https://your-domain.com/products/123?campaign=456
```

Capture:

```text
product_id
campaign_id
session/customer context
```

Track:

```text
Campaign
 ↓
Click/Visit
 ↓
Product
```

## Test Cases

### TC-10.1 Valid link
Open link.

**Expected:** Correct product page and campaign attribution.

### TC-10.2 Invalid product
Open invalid product ID.

**Expected:** Safe 404/error.

### TC-10.3 Invalid campaign
Use invalid campaign ID.

**Expected:** No unauthorized information exposed.

### TC-10.4 Attribution
Open link and inspect campaign analytics.

**Expected:** Visit attributed to correct campaign.

## Definition of Done

Campaign activity can be connected to application activity.

---

# PHASE 11 — Customer Product Experience

## Objective

Make the WhatsApp landing page useful.

Show:

- Product image
- Product name
- Description
- Current price
- Availability
- Packing
- Quantity selector
- Add to Cart

## Test Cases

### TC-11.1 Product display
Open product.

**Expected:** Correct current data.

### TC-11.2 Price
Check displayed price.

**Expected:** Comes from current backend data.

### TC-11.3 Stock
Test available and unavailable product.

**Expected:** Correct state shown.

### TC-11.4 Quantity validation
Test `0`, negative, valid and very large quantity.

**Expected:** Only valid quantities accepted.

### TC-11.5 Mobile
Open from phone/WhatsApp.

**Expected:** Responsive experience.

## Definition of Done

Customer can open a useful product page directly from WhatsApp.

---

# PHASE 12 — Cart + Order Integration

## Objective

Reuse the existing cart and order system.

```text
Product
 ↓
Existing Cart
 ↓
Checkout
 ↓
Existing Order Service
```

Backend validates:

- Product
- Price
- Stock
- Quantity
- Discount
- Customer-specific pricing

Never trust frontend totals.

Use an order source field according to existing conventions, for example:

```text
source = "whatsapp"
```

## Test Cases

### TC-12.1 Add to cart
**Expected:** Product appears in normal cart.

### TC-12.2 Checkout
**Expected:** Existing checkout succeeds.

### TC-12.3 Price tampering
Modify frontend price before submitting.

**Expected:** Backend ignores tampered value.

### TC-12.4 Stock changed
Change stock before checkout.

**Expected:** Current stock is revalidated.

### TC-12.5 Order source
Place WhatsApp order.

**Expected:** Order source is WhatsApp.

### TC-12.6 Normal order regression
Place normal non-WhatsApp order.

**Expected:** Existing order flow still works.

## Definition of Done

WhatsApp is simply another entry point into the existing order system.

---

# PHASE 13 — Admin Campaign UI

## Objective

Create a simple WhatsApp admin area.

Pages:

```text
WhatsApp Dashboard
Campaign List
Create Campaign
Campaign Details
WhatsApp Settings
```

Campaign form:

```text
Product
Audience
Template
Preview
Send
```

Campaign list:

```text
Name
Product
Audience
Status
Sent
Delivered
Read
Orders
Created
```

## Test Cases

### TC-13.1 Admin access
**Expected:** Authorized admin can access.

### TC-13.2 Unauthorized access
**Expected:** 401/403.

### TC-13.3 Create campaign
**Expected:** Draft/Ready campaign saved.

### TC-13.4 Preview
**Expected:** Correct product/template data.

### TC-13.5 Send confirmation
**Expected:** Admin confirms before sending.

## Definition of Done

Admin can manage campaigns without manually calling APIs.

---

# PHASE 14 — Customer Segmentation

## Objective

Send relevant products to relevant customers.

Start with simple existing data:

```text
Customer
 ↓
Past Orders
 ↓
Product Categories
 ↓
Segment
```

Possible segments:

```text
Beverage Buyers
Biscuit Buyers
Mixed Buyers
Inactive Customers
High-Value Customers
```

Before sending:

```text
Segment
 ↓
Eligible Customers
 ↓
Excluded Customers
 ↓
Final Audience Count
```

## Test Cases

### TC-14.1 Correct segment
**Expected:** Matching customers appear.

### TC-14.2 Missing phone
**Expected:** Customer excluded.

### TC-14.3 Duplicate phone
**Expected:** Duplicate targeting prevented.

### TC-14.4 Audience count
**Expected:** UI count matches backend query.

## Definition of Done

Admin can safely target a relevant audience.

---

# PHASE 15 — Status Tracking + Analytics

## Objective

Measure the full funnel.

WhatsApp-side status:

```text
Sent
 ↓
Delivered
 ↓
Read
```

Application-side:

```text
Clicked
 ↓
App Opened
 ↓
Product Viewed
 ↓
Cart
 ↓
Order
 ↓
Revenue
```

## Test Cases

### TC-15.1 Sent
**Expected:** Campaign sent count increments.

### TC-15.2 Delivered
Receive webhook.

**Expected:** Message status becomes delivered.

### TC-15.3 Read
Receive webhook.

**Expected:** Message status becomes read.

### TC-15.4 Failed
Receive failure event.

**Expected:** Message becomes failed and error is stored.

### TC-15.5 Product visit
Open campaign URL.

**Expected:** Campaign visit is recorded.

### TC-15.6 Order attribution
Place order after campaign link.

**Expected:** Campaign order/revenue is attributed.

## Definition of Done

Business can measure campaign performance.

---

# PHASE 16 — Business Notifications

## Objective

Use WhatsApp for useful post-order updates.

Potential events:

```text
Order placed
 ↓
Order confirmation
```

```text
Order processed
 ↓
Status update
```

```text
Order dispatched
 ↓
Delivery notification
```

```text
Payment received
 ↓
Payment confirmation
```

Use appropriate message categories/templates and applicable business rules.

## Test Cases

### TC-16.1 Order notification
Create test order.

**Expected:** Correct notification is triggered when enabled.

### TC-16.2 Correct customer
**Expected:** Only the order's customer receives it.

### TC-16.3 WhatsApp failure
Simulate notification failure.

**Expected:** Core order remains safe and failure is logged.

## Definition of Done

WhatsApp notifications are decoupled from core order processing.

---

# PHASE 17 — Reliability, Retry and Idempotency

## Objective

Prevent duplicates and uncontrolled retries.

Use:

- External event IDs
- External message IDs
- Internal campaign/message IDs
- Existing order idempotency strategy

## Retry

Retry only transient/safe failures.

Do not retry permanent failures forever.

## Test Cases

### TC-17.1 Duplicate webhook
**Expected:** Event processed once.

### TC-17.2 Duplicate send request
**Expected:** No unintended duplicate message/campaign.

### TC-17.3 Temporary API failure
**Expected:** Controlled retry.

### TC-17.4 Permanent API failure
**Expected:** Marked failed without infinite retry.

## Definition of Done

The module is safe against duplicate events and duplicate operations.

---

# PHASE 18 — Security Hardening

## Backend

- Admin authorization
- Customer authorization
- Webhook validation
- Input validation
- Product authorization
- Server-side pricing
- Quantity validation
- Rate limiting
- Secure logs

## Secrets

Never expose:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_APP_SECRET
```

## Test Cases

### TC-18.1 Unauthorized campaign
**Expected:** 401/403.

### TC-18.2 Invalid webhook
**Expected:** Rejected.

### TC-18.3 Unauthorized customer data
**Expected:** Access denied.

### TC-18.4 Secret inspection
**Expected:** No secrets in frontend, API responses or logs.

## Definition of Done

Security tests pass.

---

# PHASE 19 — Full End-to-End Testing

## Happy path

```text
Admin
 ↓
Product
 ↓
Audience
 ↓
Campaign
 ↓
WhatsApp
 ↓
Customer
 ↓
CTA
 ↓
Product
 ↓
Cart
 ↓
Checkout
 ↓
Order
 ↓
ERP
 ↓
Analytics
```

Expected: every step succeeds.

## Failure scenarios

### Product becomes unavailable

Expected:

```text
Customer sees current availability.
Invalid order is prevented.
```

### WhatsApp API failure

Expected:

```text
Campaign/message fails visibly.
Application continues working.
```

### Duplicate webhook

Expected:

```text
Only one logical event is processed.
```

### ERP failure

Expected:

```text
Failure is recoverable and duplicate order creation is prevented.
```

---

# PHASE 20 — Staging

Deploy:

```text
Staging Frontend
      ↓
Staging Backend
      ↓
Staging Database
      ↓
Test WhatsApp Configuration
```

Run the complete test suite with controlled test users.

## Staging exit criteria

- No duplicate messages
- No duplicate orders
- No secret leaks
- No broken existing order flow
- No broken customer flow
- No unhandled webhook failures
- All critical test cases pass

---

# PHASE 21 — Production

## Backend checklist

- [ ] HTTPS
- [ ] Production environment variables
- [ ] Database migrations
- [ ] Webhook URL
- [ ] Error monitoring
- [ ] Logging
- [ ] Rate limiting
- [ ] Security review

## Frontend checklist

- [ ] Production domain
- [ ] Product deep links
- [ ] Authentication
- [ ] Mobile responsiveness
- [ ] Cart
- [ ] Checkout

## WhatsApp checklist

- [ ] Business account
- [ ] Production phone number
- [ ] Approved templates
- [ ] Required permissions
- [ ] Production webhook
- [ ] Production credentials

## Business checklist

- [ ] Messaging rules documented
- [ ] Audience rules documented
- [ ] Admin permissions documented
- [ ] Campaign approval process documented

---

# 5. Suggested API Routes

Adapt these to the existing backend conventions.

## Health

```http
GET /api/whatsapp/health
GET /api/whatsapp/status
```

## Webhook

```http
GET  /api/whatsapp/webhook
POST /api/whatsapp/webhook
```

## Templates

```http
GET /api/whatsapp/templates
```

## Contacts

```http
GET /api/whatsapp/contacts
GET /api/whatsapp/contacts/:customerId
```

## Campaigns

```http
POST /api/whatsapp/campaigns
GET  /api/whatsapp/campaigns
GET  /api/whatsapp/campaigns/:id
POST /api/whatsapp/campaigns/:id/send
POST /api/whatsapp/campaigns/:id/cancel
```

## Analytics

```http
GET /api/whatsapp/campaigns/:id/analytics
```

---

# 6. Service Responsibilities

## whatsapp-api.service

Only Meta API communication:

```text
sendTemplate()
sendMedia()
getTemplates()
```

## whatsapp-message.service

```text
sendCampaignMessage()
recordMessage()
updateMessageStatus()
```

## whatsapp-webhook.service

```text
verifyEvent()
processEvent()
processStatus()
```

## whatsapp-campaign.service

```text
createCampaign()
previewAudience()
sendCampaign()
getCampaign()
```

## whatsapp-contact.service

```text
syncCustomer()
normalizePhone()
findContact()
```

## whatsapp-attribution.service

```text
recordClick()
recordProductView()
attributeOrder()
```

## whatsapp-analytics.service

Calculates:

```text
sent
delivered
read
clicked
orders
revenue
conversion
```

---

# 7. Data Relationships

```text
Customer
   │
   └──── whatsapp_contact
             │
             ├──── whatsapp_message
             │
             └──── campaign
                       │
                       └──── Product
                              │
                              ▼
                         App Visit
                              │
                              ▼
                             Cart
                              │
                              ▼
                             Order
                              │
                              ▼
                             ERP
```

Do not duplicate Product, Customer, Cart or Order master data in the WhatsApp module.

---

# 8. Campaign Lifecycle

```text
DRAFT
  ↓
READY
  ↓
SENDING
  ↓
COMPLETED
```

Failure path:

```text
SENDING
  ↓
FAILED
```

Optional cancellation:

```text
READY → CANCELLED
```

---

# 9. Message Lifecycle

```text
Created
  ↓
Queued
  ↓
Sent
  ↓
Delivered
  ↓
Read
```

Failure:

```text
Created
  ↓
Sending
  ↓
Failed
```

Store the external WhatsApp message ID whenever provided.

---

# 10. Recommended Git Strategy

Use separate branches for major phases:

```text
main
 │
 ├── feature/whatsapp-module
 ├── feature/whatsapp-config
 ├── feature/whatsapp-api
 ├── feature/whatsapp-webhook
 ├── feature/whatsapp-database
 ├── feature/whatsapp-contact-mapping
 ├── feature/whatsapp-template
 ├── feature/whatsapp-product-campaign
 ├── feature/whatsapp-attribution
 ├── feature/whatsapp-order-flow
 └── feature/whatsapp-analytics
```

For each branch:

```text
Implement
 ↓
Run tests
 ↓
Manual test
 ↓
Commit
 ↓
Pull Request
 ↓
Review
 ↓
Merge
```

---

# 11. Phase Completion Rule

Do not move to the next phase until:

- [ ] Code implemented
- [ ] Unit tests pass
- [ ] Integration tests pass where applicable
- [ ] Manual test completed
- [ ] Existing functionality checked
- [ ] No secrets committed
- [ ] Errors handled
- [ ] Logs understandable
- [ ] Documentation updated

---

# 12. First Development Sprint

Do NOT start with analytics or campaigns.

First implement:

```text
Phase 0
 ↓
Phase 1
 ↓
Phase 2
 ↓
Phase 3
 ↓
Phase 4
 ↓
Phase 5
```

Prove:

```text
Backend
 ↓
Meta
 ↓
Webhook
 ↓
Database
```

Then:

```text
Phase 6
 ↓
Phase 7
 ↓
Phase 8
```

Prove:

```text
Customer
 ↓
WhatsApp
 ↓
Message
 ↓
Webhook
 ↓
Database
```

Then:

```text
Phase 9
 ↓
Phase 10
 ↓
Phase 11
 ↓
Phase 12
```

Prove:

```text
WhatsApp
 ↓
Product
 ↓
Cart
 ↓
Order
 ↓
ERP
```

Only after that implement:

```text
Campaign Management
 ↓
Segmentation
 ↓
Analytics
 ↓
Notifications
 ↓
Production Hardening
```

---

# 13. Final Definition of Done

- [ ] Separate WhatsApp backend module exists
- [ ] Separate WhatsApp frontend/admin module exists
- [ ] Meta configuration is secure
- [ ] API client works
- [ ] Webhook verification works
- [ ] Webhook events are processed
- [ ] Duplicate events are prevented
- [ ] WhatsApp tables exist
- [ ] Customers map correctly
- [ ] Templates are supported
- [ ] Test message works
- [ ] Product campaign works
- [ ] Product deep links work
- [ ] Customer can open product from WhatsApp
- [ ] Cart works
- [ ] Order works
- [ ] WhatsApp order source is recorded
- [ ] ERP receives/processes order
- [ ] Campaign UI works
- [ ] Segmentation works
- [ ] Message statuses update
- [ ] Campaign attribution works
- [ ] Analytics works
- [ ] Notifications work where required
- [ ] Retry/idempotency works
- [ ] Security tests pass
- [ ] End-to-end tests pass
- [ ] Staging passes
- [ ] Production deployment passes
- [ ] Monitoring is enabled

---

# Final Architecture

```text
                         ADMIN
                           │
                           ▼
                    WhatsApp Dashboard
                           │
                     Create Campaign
                           │
                           ▼
                  Existing Product Data
                           │
                           ▼
                  Customer Segmentation
                           │
                           ▼
                    WhatsApp Module
                           │
                           ▼
                    Meta WhatsApp API
                           │
                           ▼
                       CUSTOMER
                           │
                      Receives Message
                           │
                         Tap CTA
                           │
                           ▼
                      OUR APP
                           │
                  ┌────────┼────────┐
                  ▼        ▼        ▼
               Product   Cart    Checkout
                           │
                           ▼
                      ORDER MODULE
                           │
                           ▼
                           ERP
                           │
                           ▼
                     Business Process
```

## Final principle

```text
WhatsApp
= Communication + Notification + Re-engagement

Our Application
= Catalogue + Cart + Checkout + Ordering

Existing Backend
= Business Logic

ERP
= Inventory + Processing + Delivery + Payment
```

## Final flow

```text
WhatsApp → Our App → Order → ERP
```

Build the integration as an independent module, connect it to existing modules through clean services/APIs, test every phase, and only then move it to production.
