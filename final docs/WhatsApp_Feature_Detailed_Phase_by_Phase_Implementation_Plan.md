# WhatsApp → Our App → Order → ERP
# Detailed Phase-by-Phase Implementation Plan

## Project Goal

Implement the WhatsApp Business feature inside the existing application so the complete journey becomes:

```text
Admin creates/selects product
        ↓
Select relevant customers
        ↓
Send approved WhatsApp message
        ↓
Customer receives message
        ↓
Customer taps "View Product & Order"
        ↓
Our Web App opens
        ↓
Customer views product/catalogue
        ↓
Add to cart
        ↓
Place order
        ↓
Existing backend/order system
        ↓
ERP processes the order
```

> **Core principle:** WhatsApp is the communication and re-engagement channel. Our application is the shopping/order channel. The ERP remains the business-processing system.

---

# Phase 0 — Understand the Existing Project

## Goal

Before changing code, understand the existing project and reuse its current product, customer, cart, order and ERP functionality.

## Inspect

- Frontend structure
- Backend structure
- Authentication
- Database
- Product model/table
- Customer/party model/table
- Cart
- Order model/table
- Inventory
- ERP integration
- Admin dashboard
- Existing API conventions
- Environment variables
- Deployment

## Deliverable

Create:

```text
docs/whatsapp-integration/PROJECT_MAPPING.md
```

Document:

- Existing product model
- Existing customer model
- Existing order model
- Existing authentication
- Existing API routes
- Existing database relationships
- Where the WhatsApp feature will be added

## Completion

You can clearly answer:

1. Where are products stored?
2. Where are customers stored?
3. Where are orders stored?
4. How does customer authentication work?
5. How does admin create products?
6. How is an order currently created?
7. How does ERP receive/process an order?

---

# Phase 1 — Freeze the MVP Requirements

## Goal

Do not build every possible WhatsApp feature at once.

### MVP

```text
Admin
 ↓
Select Product
 ↓
Select Test Customers
 ↓
Send WhatsApp Message
 ↓
Customer taps button
 ↓
Product page opens
 ↓
Customer adds product
 ↓
Customer places order
 ↓
Order enters existing system
```

## Admin MVP

- WhatsApp integration status
- Select product
- Select customer group
- Preview message
- Send campaign
- View campaign status
- View basic results

## Customer MVP

- Open product link
- View product
- Select quantity
- Add to cart
- Place order
- Receive order confirmation

## Completion

Write exact acceptance criteria before development.

---

# Phase 2 — Meta / WhatsApp Business Setup

## Goal

Create the official WhatsApp Business Platform / Cloud API connection.

Configure the required Meta/WhatsApp resources:

- Meta developer application
- WhatsApp Business account
- Business phone number
- API access
- Access token
- Phone number ID
- Business account ID
- Webhook
- Required permissions
- Approved message templates

## Backend environment variables

Use the project's existing naming convention. Example:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=
```

Never commit real credentials.

## Completion

Backend can authenticate with the WhatsApp API and required business resources are available.

---

# Phase 3 — Build the WhatsApp Backend Module

## Goal

Keep WhatsApp logic separate from normal business controllers.

Suggested structure:

```text
backend/
└── modules/
    └── whatsapp/
        ├── controller
        ├── service
        ├── routes
        ├── webhook
        ├── templates
        ├── validation
        ├── types
        └── utils
```

## WhatsApp service responsibilities

- Send message
- Send template message
- Send media
- Build product message
- Track API response
- Handle API errors
- Normalize WhatsApp data

Prefer:

```text
Controller
   ↓
WhatsApp Service
   ↓
Meta API
```

rather than putting Meta API logic directly inside controllers.

## Completion

A backend function successfully sends an approved/test WhatsApp message.

---

# Phase 4 — Build the Webhook

## Goal

Receive events from WhatsApp/Meta.

Handle:

- Webhook verification
- Incoming messages where required
- Message status
- Delivery status
- Read status where available
- Errors
- Unknown events

Flow:

```text
Meta
 ↓
POST /api/whatsapp/webhook
 ↓
Validate request
 ↓
Identify event
 ↓
Store event
 ↓
Update message status
 ↓
Return success
```

## Security

Implement the required webhook verification and request validation.

## Idempotency

WhatsApp events can be delivered more than once.

Use an external event/message ID:

```text
Event received
      ↓
Already processed?
   ↙       ↘
 Yes       No
 ↓          ↓
Ignore    Store + process
```

## Completion

A real/test WhatsApp event reaches the backend and is correctly processed.

---

# Phase 5 — Add Database Support

## Goal

Store WhatsApp data without creating a second customer/order system.

Follow the existing project's database conventions.

## Suggested entities

### whatsapp_contacts

```text
id
customer_id
whatsapp_phone
external_id
display_name
permission/status where required
created_at
updated_at
```

Purpose: connect an existing business customer with WhatsApp.

### whatsapp_messages

```text
id
customer_id
campaign_id
external_message_id
direction
message_type
category
template_name
status
sent_at
delivered_at
read_at
failed_at
error_code
error_message
created_at
updated_at
```

### whatsapp_campaigns

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

### whatsapp_events

Optional audit/idempotency table:

```text
id
external_event_id
event_type
processed
processed_at
created_at
```

Do not store unnecessary personal/raw data indefinitely.

## Completion

Database migrations are complete and test data can be stored.

---

# Phase 6 — Connect Existing Customers to WhatsApp

## Goal

Use the existing customer/party records.

```text
Existing Customer
       ↓
WhatsApp Contact
```

Example:

```text
Customer ID: 1024
Name: ABC Traders
Phone: +91XXXXXXXXXX
       ↓
WhatsApp Contact
Customer ID: 1024
WhatsApp Number: +91XXXXXXXXXX
```

## Handle

- Phone normalization
- Duplicate customers
- Missing numbers
- Invalid numbers
- Customer status
- Required permission/consent

Do not create a separate customer just because the customer uses WhatsApp.

## Completion

A known business customer can be safely mapped to their WhatsApp identity.

---

# Phase 7 — Product → WhatsApp Message

## Goal

Allow admin to promote a product.

Flow:

```text
Admin selects product
       ↓
Select audience
       ↓
Preview message
       ↓
Confirm
       ↓
Backend sends approved template
       ↓
Campaign/message is stored
```

Example concept:

```text
🆕 New Product Available

Coca-Cola 250ml
Available: 20 boxes
Wholesale: ₹500/box

[View Product & Order]
```

The final template must follow the approved WhatsApp template structure.

## Product deep link

Concept:

```text
https://your-domain.com/products/{product-id}
```

Use the real application domain in production.

## Backend validation

Before sending, verify:

- Product exists
- Product is active
- Product can be shown to that customer
- Current product information is valid

## Completion

Admin can select a product and send a test message containing a working product link.

---

# Phase 8 — Customer Product Page

## Goal

Build the page opened after the WhatsApp button.

Flow:

```text
WhatsApp
   ↓
Product link
   ↓
Product page
   ↓
Quantity
   ↓
Add to cart
```

Show:

- Product image
- Product name
- Description
- Price
- Availability
- Packing
- Quantity
- Add to Cart

Reuse the existing product/catalogue system.

Do not maintain a separate WhatsApp catalogue.

## Completion

The WhatsApp product link works on mobile and desktop and displays current product data.

---

# Phase 9 — Customer Authentication / Identification

## Goal

Safely identify which customer is shopping.

Concept:

```text
WhatsApp customer
       ↓
Product link
       ↓
Secure customer identification
       ↓
Existing customer account
       ↓
Shopping session
       ↓
Order
```

If the project already has authentication, reuse it.

Do not treat a phone number or URL parameter alone as proof of identity.

## Completion

The application can securely associate the shopping session with the correct customer before order creation.

---

# Phase 10 — Cart Integration

## Goal

Reuse the existing cart.

```text
Product
 ↓
Quantity
 ↓
Cart
 ↓
Checkout
```

Backend must validate:

- Product exists
- Product is active
- Current price
- Current stock
- Quantity rules
- Customer-specific pricing where applicable

Never trust price/total values from the frontend.

## Completion

Customer entering through WhatsApp can add the product to the normal application cart.

---

# Phase 11 — Order Creation

## Goal

Create a normal business order.

Flow:

```text
Customer Cart
     ↓
Checkout
     ↓
Backend validation
     ↓
Create Order
     ↓
Order Items
     ↓
ERP
```

Order should contain:

- Customer
- Products
- Quantity
- Price
- Discount if applicable
- Total
- Source/channel
- Status
- Created time

Add a source value using the project's convention, for example:

```text
source = "whatsapp"
```

This lets the business distinguish:

```text
WhatsApp Orders
Website/App Orders
Admin Orders
```

## Completion

A WhatsApp-originated order is stored as a valid existing order.

---

# Phase 12 — ERP Integration

## Goal

Do not create a separate WhatsApp order process.

```text
WhatsApp
   ↓
Our App
   ↓
Existing Order System
   ↓
ERP
```

Verify the existing business process for:

- Inventory
- Pricing
- Customer credit/balance rules where applicable
- Salesperson
- Order status
- Delivery
- Invoice
- Payment

## Completion

A WhatsApp order enters the same ERP workflow as other orders.

---

# Phase 13 — Customer Segmentation

## Goal

Send relevant products to relevant customers.

Possible business segments:

```text
Beverage Buyers
Biscuit Buyers
Mixed Buyers
Inactive Customers
High-Value Customers
```

Start with simple rules based on existing order/product/category data.

Example:

```text
Customer
 ↓
Past orders
 ↓
Products/categories purchased
 ↓
Segment
```

Admin flow:

```text
Select Product
 ↓
Select Segment
 ↓
Preview Audience
 ↓
Show Customer Count
 ↓
Confirm
```

Apply applicable customer permission and WhatsApp messaging rules.

## Completion

Admin can select a segment and see the intended audience before sending.

---

# Phase 14 — Campaign Management

## Goal

Give admin a simple campaign dashboard.

## Campaign list

Show:

```text
Campaign
Product
Audience
Status
Sent
Delivered
Read
Orders
Created
```

## Create campaign

```text
1. Select product
2. Select segment
3. Select approved template
4. Preview
5. Confirm
6. Send
```

## Campaign states

```text
Draft
 ↓
Ready
 ↓
Sending
 ↓
Completed
```

Also handle:

```text
Failed
Cancelled
```

where needed.

---

# Phase 15 — Message and Funnel Tracking

## Goal

Measure the complete journey.

```text
Sent
 ↓
Delivered
 ↓
Read
 ↓
Clicked
 ↓
App Opened
 ↓
Product Viewed
 ↓
Cart
 ↓
Order
```

Important:

WhatsApp provides WhatsApp-side events where available.

Our application must track:

- Click
- App opened
- Product viewed
- Cart
- Order

Use campaign/product identifiers in the deep link so the application can attribute activity.

Example:

```text
/product/123?campaign=456
```

Then:

```text
Campaign 456
 ↓
Product 123
 ↓
Customer visit
 ↓
Cart
 ↓
Order
```

---

# Phase 16 — Analytics Dashboard

## Goal

Measure business results rather than only message counts.

Show:

- Audience
- Sent
- Delivered
- Read
- Clicks
- App visits
- Product views
- Cart additions
- Orders
- Revenue

Main question:

> **How many orders and how much revenue did the campaign generate?**

Funnel:

```text
Audience
 ↓
Messages
 ↓
Delivered
 ↓
Read
 ↓
Clicked
 ↓
App
 ↓
Cart
 ↓
Orders
 ↓
Revenue
```

---

# Phase 17 — Order/Business Notifications

## Goal

Use WhatsApp for useful post-order communication.

Potential flows:

```text
Order placed
 ↓
Order confirmation
```

```text
Order processed
 ↓
Order status
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

Use the appropriate message category/template and applicable WhatsApp rules.

---

# Phase 18 — Error Handling

Handle:

- Invalid phone number
- Invalid template
- API failure
- Authentication/token failure
- Rate limiting
- Network timeout
- Duplicate webhook
- Customer not found
- Product unavailable
- Order failure
- ERP failure

Example:

```text
Send message
 ↓
API error
 ↓
Store failure
 ↓
Retry when appropriate
 ↓
Update status
 ↓
Show useful admin error
```

Never silently ignore failures.

---

# Phase 19 — Retry + Idempotency

## Goal

Prevent duplicate messages and duplicate orders.

### Webhooks

Use external event/message IDs.

### Messages

Use internal campaign/message IDs.

### Orders

Use an appropriate idempotency mechanism for order creation.

Example:

```text
Webhook received
 ↓
External ID already exists?
 ↓
YES → Ignore duplicate
NO  → Process
```

---

# Phase 20 — Security

## Backend

- Keep Meta tokens server-side.
- Validate webhook requests.
- Validate all API input.
- Protect admin campaign endpoints.
- Validate customer authorization.
- Validate product access.
- Validate prices server-side.
- Validate quantities.
- Rate-limit sensitive endpoints.
- Log failures.
- Never expose secrets to frontend.

## Data

Only store data required by the feature.

---

# Phase 21 — Testing

## Unit tests

Test:

- Phone normalization
- Template payload creation
- Product validation
- Customer segmentation
- Order calculation
- Status mapping
- Webhook parsing

## Integration tests

Test:

```text
Backend → WhatsApp API
WhatsApp → Webhook
Product → Deep Link
Cart → Order
Order → ERP
```

## End-to-end test

```text
Admin creates product
 ↓
Selects test customers
 ↓
Sends WhatsApp
 ↓
Customer receives message
 ↓
Customer taps
 ↓
Product opens
 ↓
Customer adds to cart
 ↓
Customer orders
 ↓
ERP receives order
```

---

# Phase 22 — Test Environment

Do not start with a real customer campaign.

Use:

- Test WhatsApp setup where available
- Test numbers
- Test customers
- Test products
- Test campaigns
- Test orders

Keep development and production credentials separate.

```text
Development
 ↓
Test WhatsApp
 ↓
Test Database
 ↓
Test Customers
```

Then:

```text
Production
 ↓
Production WhatsApp
 ↓
Production Database
 ↓
Real Customers
```

---

# Phase 23 — Production Deployment

Before production, verify:

## Backend

- Environment variables
- HTTPS
- Webhook URL
- API permissions
- Logging
- Database migrations
- Security

## Frontend

- Production domain
- Product deep links
- Authentication
- Product pages
- Cart
- Checkout

## WhatsApp

- Business account
- Phone number
- Templates
- Required permissions
- Webhook
- Production credentials

## ERP

- Order creation
- Inventory
- Pricing
- Status
- Delivery/invoice process

---

# Phase 24 — Monitoring

Monitor:

## WhatsApp

- API errors
- Failed messages
- Delivery issues
- Template errors
- Webhook failures

## Application

- Product-page errors
- Cart errors
- Checkout errors
- Order failures

## ERP

- Sync failures
- Inventory mismatch
- Status mismatch

## Business

- Orders
- Revenue
- Conversion rate

---

# Recommended Project Structure

Add documentation:

```text
docs/
└── whatsapp-integration/
    ├── PROJECT_MAPPING.md
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── WEBHOOKS.md
    ├── MESSAGE_TEMPLATES.md
    ├── CUSTOMER_FLOW.md
    ├── ORDER_FLOW.md
    ├── CAMPAIGNS.md
    ├── ANALYTICS.md
    ├── SECURITY.md
    ├── TESTING.md
    └── DEPLOYMENT.md
```

Suggested API routes, adapted to the project's existing conventions:

```text
GET  /api/whatsapp/webhook
POST /api/whatsapp/webhook

GET  /api/whatsapp/status

POST /api/whatsapp/campaigns
GET  /api/whatsapp/campaigns
GET  /api/whatsapp/campaigns/:id
POST /api/whatsapp/campaigns/:id/send

GET /api/whatsapp/templates
GET /api/whatsapp/campaigns/:id/analytics
```

---

# Recommended Development Order

Implement in this order:

```text
PHASE 0  → Understand Project
PHASE 1  → Freeze MVP
PHASE 2  → Meta / WhatsApp Setup
PHASE 3  → WhatsApp Backend Module
PHASE 4  → Webhook
PHASE 5  → Database
PHASE 6  → Customer Mapping
PHASE 7  → Product → WhatsApp
PHASE 8  → Product Page
PHASE 9  → Authentication
PHASE 10 → Cart
PHASE 11 → Order Creation
PHASE 12 → ERP
PHASE 13 → Segmentation
PHASE 14 → Campaign Dashboard
PHASE 15 → Tracking
PHASE 16 → Analytics
PHASE 17 → Notifications
PHASE 18 → Error Handling
PHASE 19 → Retry / Idempotency
PHASE 20 → Security
PHASE 21 → Testing
PHASE 22 → Test Environment
PHASE 23 → Production
PHASE 24 → Monitoring
```

---

# First MVP Milestone

Do not wait until all 24 phases are finished.

The first working milestone should be:

```text
Admin
 ↓
Select Product
 ↓
Select Test Customer
 ↓
Send WhatsApp Template
 ↓
Customer Receives Message
 ↓
Customer Taps Button
 ↓
Product Page Opens
 ↓
Customer Adds Product
 ↓
Customer Places Order
 ↓
Order Appears in Existing System
```

Once this works end-to-end, expand with:

```text
Segmentation
 ↓
Campaign Management
 ↓
Tracking
 ↓
Analytics
 ↓
Notifications
 ↓
Advanced Automation
```

---

# Definition of Done

The feature is production-ready when:

- [ ] Official WhatsApp integration configured
- [ ] Backend can send approved messages
- [ ] Webhook works
- [ ] Webhook verification/security implemented
- [ ] Duplicate events handled
- [ ] WhatsApp messages stored
- [ ] Existing customers mapped
- [ ] Product links work
- [ ] Customer identification is secure
- [ ] Cart works
- [ ] Order creation works
- [ ] WhatsApp orders have source tracking
- [ ] ERP receives/processes orders
- [ ] Customer segmentation works
- [ ] Campaign dashboard works
- [ ] Message status tracking works where available
- [ ] Application funnel tracking works
- [ ] Analytics works
- [ ] Error handling works
- [ ] Retry/idempotency works
- [ ] Security review completed
- [ ] End-to-end tests pass
- [ ] Production environment configured
- [ ] Monitoring/logging available
- [ ] Business messaging rules and permissions documented

---

# Final Architecture

```text
                         ┌───────────────┐
                         │    ADMIN      │
                         └───────┬───────┘
                                 │
                         Create Campaign
                                 │
                                 ▼
                         ┌───────────────┐
                         │ OUR BACKEND   │
                         │               │
                         │ Campaign      │
                         │ WhatsApp      │
                         │ Customers     │
                         │ Products      │
                         │ Orders        │
                         └───────┬───────┘
                                 │
                         WhatsApp Cloud API
                                 │
                                 ▼
                         ┌───────────────┐
                         │   CUSTOMER    │
                         │   WhatsApp    │
                         └───────┬───────┘
                                 │
                                Tap
                                 │
                                 ▼
                         ┌───────────────┐
                         │   OUR APP     │
                         │ Product       │
                         │ Catalogue     │
                         │ Cart          │
                         │ Checkout      │
                         └───────┬───────┘
                                 │
                               Order
                                 │
                                 ▼
                         ┌───────────────┐
                         │     ERP       │
                         │ Processing    │
                         │ Inventory     │
                         │ Delivery      │
                         │ Payment       │
                         └───────────────┘
```

---

# Final Business Concept

## WhatsApp

**Attention + Notification + Re-engagement**

## Our App

**Catalogue + Cart + Ordering**

## ERP

**Business Processing**

```text
WhatsApp → Our App → Order → ERP
```

> **Admin creates a product → the right customers receive a WhatsApp message → the customer taps once → our app opens → the customer shops → the order enters the existing ERP/business process → the system measures the result.**
