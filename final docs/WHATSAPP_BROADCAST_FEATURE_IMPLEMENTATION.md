# Broadcast Feature — Complete Product, UX, Backend & Implementation Specification

## 1. Purpose

Implement a production-ready **Broadcast** feature inside our WhatsApp-like chat application.

The feature should allow a user/business to:

- Create reusable broadcast audiences/lists.
- Select individual contacts or groups of contacts using filters/lists/tags.
- Compose one message once.
- Send that message as **separate 1-to-1 messages** to every selected recipient.
- Support text, images, videos, documents, audio, links, replies, and other message types already supported by the application.
- Schedule broadcasts.
- Save drafts.
- Reuse previous broadcasts.
- Track delivery, read, failure, reply and engagement metrics.
- Pause/cancel scheduled broadcasts.
- Retry failed deliveries safely.
- Respect blocked users, opt-outs, permissions, rate limits and abuse-prevention rules.
- Make the recipient experience look like a normal private conversation, not a group chat.

This specification is intended to be given directly to Claude/Cursor/another coding agent for implementation.

---

# 2. Important Product Distinction

There are two concepts that should not be confused:

### Classic WhatsApp Broadcast Lists

WhatsApp's classic broadcast lists are reusable contact lists. A sender can message many contacts at once, while each recipient receives the message privately. Replies remain private and are not visible to other recipients. WhatsApp currently documents a limit of up to 256 contacts per classic broadcast list and notes that recipients generally need to have the sender's number saved. Classic broadcast lists are not supported on WhatsApp Web/Desktop according to the referenced Help Center documentation.

### WhatsApp Business Broadcasts

WhatsApp Business has a newer, more advanced business-broadcast experience. Current WhatsApp documentation describes:

- Audience selection
- Saved audiences/contact imports
- Text and media
- Action buttons
- Preview
- Scheduling
- Broadcast insights
- Delivery/read/reply metrics
- Paid business broadcasts in supported markets
- Review/quality controls
- Opt-out requirements

Our application is our own messaging platform, so **do not blindly copy WhatsApp's 256-contact or "recipient must save my number" restrictions** unless the product owner explicitly wants those restrictions.

Instead, implement a scalable architecture where the maximum audience size is configurable.

---

# 3. Core Broadcast Principle

A broadcast is NOT a group chat.

Example:

Sender: Business A

Audience:

- Customer 1
- Customer 2
- Customer 3

Message:

> New products have arrived!

The system creates three independent message deliveries:

```text
Business A -> Customer 1
Business A -> Customer 2
Business A -> Customer 3
```

Customer 1 must not know that Customer 2 or Customer 3 received the message.

Customer 1 replies:

```text
Customer 1 -> Business A
```

The reply must only appear in Customer 1's private conversation.

Never create a group conversation containing all broadcast recipients.

---

# 4. Feature Scope

Implement the following feature areas.

## A. Broadcast Lists / Audiences

Users can:

- Create audience
- Rename audience
- View audience
- Add contacts
- Remove contacts
- Search contacts
- Select all
- Deselect all
- Delete audience
- Duplicate audience
- See audience size
- See active/inactive recipients
- See opted-out recipients
- See blocked recipients
- See invalid recipients
- Import contacts if the application already supports imports

Example:

```text
Customers
VIP Customers
New Customers
Retailers
Nagpur Customers
Inactive Customers
```

An audience should be reusable.

---

# 5. Audience Selection

Provide multiple ways to select recipients.

## Individual Selection

User can search:

```text
[ Search contacts... ]

☑ Rahul
☑ Aisha
☐ Ahmed
☑ Priya
☐ John
```

Display:

- Profile picture
- Name
- Phone/email if applicable
- Online status if already supported
- Selection checkbox

## Select All

Allow:

```text
Select all 250 contacts
```

If the application has a large contact database, do not load thousands of contacts into the browser at once.

Use:

- Pagination
- Server-side search
- Server-side filtering
- Cursor pagination where appropriate

## Filters

Support filters if the application has the required data:

```text
Contact status
Tags
Customer type
Location
Last conversation date
Last active
Opted-in
Opted-out
Blocked
```

Example:

```text
Tag = VIP
Status = Active
Opt-in = Yes
```

The backend should resolve the final recipient set.

---

# 6. Audience Snapshot vs Dynamic Audience

Support two concepts.

## Saved Audience

A reusable list of contact IDs.

Example:

```text
VIP Customers
members:
- user_101
- user_205
- user_301
```

## Dynamic Audience

An audience defined by rules.

Example:

```text
Tag = VIP
AND
Status = Active
AND
Marketing Opt-In = true
```

When a broadcast is created, resolve the dynamic audience into a **recipient snapshot**.

This is extremely important.

If the audience contains 5,000 users today and someone is added tomorrow, an already-created broadcast must not unexpectedly send to that new user.

Store:

```text
broadcast_recipient_snapshot
```

for every broadcast.

---

# 7. Broadcast Creation Flow

Recommended flow:

```text
Broadcasts
    ↓
Create Broadcast
    ↓
Select Audience
    ↓
Compose Message
    ↓
Add Media / Buttons
    ↓
Preview
    ↓
Choose Send Now / Schedule
    ↓
Review
    ↓
Create Broadcast
    ↓
Queue Delivery
    ↓
Track Results
```

---

# 8. Broadcast Composer UI

The composer should feel familiar to the existing chat composer.

Example:

```text
--------------------------------------------------
Create Broadcast

Audience
[ VIP Customers                    1,248 people ]

Message
--------------------------------------------------
|                                                |
|  New collection has arrived!                  |
|                                                |
--------------------------------------------------

[ 📎 ] [ 🖼 Image ] [ 🎥 Video ] [ 📄 Document ]

Optional actions

[ + Add Button ]

Preview
--------------------------------------------------
| Business Name                                  |
|                                                |
| New collection has arrived!                   |
|                                                |
--------------------------------------------------

Send:
(•) Send now
( ) Schedule

[ Cancel ]                         [ Continue ]
--------------------------------------------------
```

Do not create a completely different message editor if the existing chat composer can be reused.

Prefer shared message-composition components.

---

# 9. Supported Message Types

The broadcast system should use the application's existing message model whenever possible.

Support:

### Text

```json
{
  "type": "text",
  "text": "New products have arrived!"
}
```

### Image

```json
{
  "type": "image",
  "media_id": "...",
  "caption": "New collection"
}
```

### Video

```json
{
  "type": "video",
  "media_id": "...",
  "caption": "Watch our new collection"
}
```

### Document

```json
{
  "type": "document",
  "media_id": "...",
  "filename": "catalog.pdf"
}
```

### Audio

If audio is already supported by the application, reuse the same media infrastructure.

### Link

Support link previews if the normal chat application supports them.

### Reply / Quoted Message

If the application supports replying to messages, decide whether broadcast messages can contain a quoted message.

### Rich Actions

If the product supports buttons, provide configurable action buttons.

Possible actions:

- Open conversation
- Open URL
- Call
- Open product
- Open catalog
- Custom reply

Only implement actions that the existing messaging platform can securely execute.

---

# 10. Personalization

A strong broadcast feature should support variables.

Example:

```text
Hi {{first_name}},

Your order {{order_number}} is ready.
```

Recipient 1 receives:

```text
Hi Rahul,

Your order ORD-1001 is ready.
```

Recipient 2 receives:

```text
Hi Aisha,

Your order ORD-1008 is ready.
```

Recommended variables:

```text
{{first_name}}
{{last_name}}
{{full_name}}
{{phone}}
{{email}}
{{company}}
{{customer_id}}
```

If the application's business domain provides additional fields, allow configurable variables.

Important:

Do not perform personalization only in the frontend.

The backend must render the final message per recipient.

---

# 11. Variable Safety

Never allow arbitrary SQL expressions or executable templates.

Use a strict allowlist:

```text
ALLOWED_VARIABLES = {
  first_name,
  last_name,
  full_name,
  phone,
  email,
  company
}
```

Unknown variables should either:

- remain unchanged and show a validation warning, or
- be rejected before sending.

Recommended behavior:

```text
"Hello {{unknown}}"
```

should trigger:

```text
Unknown variable: {{unknown}}
```

before the broadcast can be sent.

---

# 12. Preview

Before sending, display a preview.

Because personalization can change the message, preview at least:

- Generic preview
- Example recipient preview

Example:

```text
Preview for Rahul

Hi Rahul,

New products are now available.
```

If media/buttons exist, render them too.

---

# 13. Broadcast Confirmation

Before sending:

```text
Review Broadcast

Audience:
VIP Customers

Recipients:
1,248

Message:
New collection has arrived!

Media:
1 Image

Send:
Immediately

[ Back ]
[ Send Broadcast ]
```

For large broadcasts:

```text
You are about to message 12,450 contacts.

This action may take several minutes.

[ Cancel ]
[ Confirm & Send ]
```

Do not let the user accidentally double-send.

---

# 14. Idempotency

This is one of the most important backend requirements.

If the user clicks:

```text
Send Broadcast
```

twice because the network is slow, the application must NOT create two broadcasts.

Use an idempotency key.

Example:

```text
client_request_id = UUID
```

Database uniqueness:

```text
broadcast.idempotency_key UNIQUE
```

The backend should return the existing broadcast if the same request is submitted again.

---

# 15. Database Model

Adapt these tables to the existing database instead of blindly creating duplicates.

## broadcasts

```sql
CREATE TABLE broadcasts (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT,
    status TEXT NOT NULL,
    audience_id UUID NULL,

    message_type TEXT NOT NULL,
    content JSONB NOT NULL,

    scheduled_at TIMESTAMPTZ NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,

    total_recipients INTEGER NOT NULL DEFAULT 0,
    queued_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    read_count INTEGER NOT NULL DEFAULT 0,
    replied_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,

    idempotency_key TEXT UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## broadcast_audiences

```sql
CREATE TABLE broadcast_audiences (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'static',
    filter_definition JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## broadcast_audience_members

```sql
CREATE TABLE broadcast_audience_members (
    id UUID PRIMARY KEY,
    audience_id UUID NOT NULL,
    contact_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(audience_id, contact_id)
);
```

## broadcast_recipients

This table is critical.

```sql
CREATE TABLE broadcast_recipients (
    id UUID PRIMARY KEY,
    broadcast_id UUID NOT NULL,
    recipient_id UUID NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    conversation_id UUID NULL,
    message_id UUID NULL,

    personalized_content JSONB NULL,

    queued_at TIMESTAMPTZ NULL,
    sent_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    read_at TIMESTAMPTZ NULL,
    replied_at TIMESTAMPTZ NULL,
    failed_at TIMESTAMPTZ NULL,

    failure_code TEXT NULL,
    failure_reason TEXT NULL,

    retry_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(broadcast_id, recipient_id)
);
```

## broadcast_events

Optional but strongly recommended.

```sql
CREATE TABLE broadcast_events (
    id UUID PRIMARY KEY,
    broadcast_id UUID NOT NULL,
    recipient_id UUID NULL,
    message_id UUID NULL,

    event_type TEXT NOT NULL,
    event_data JSONB NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Examples:

```text
queued
processing
sent
delivered
read
failed
replied
cancelled
```

---

# 16. Broadcast Status State Machine

Broadcast:

```text
DRAFT
   ↓
SCHEDULED
   ↓
QUEUED
   ↓
PROCESSING
   ↓
COMPLETED
```

Alternative states:

```text
CANCELLED
FAILED
PARTIALLY_COMPLETED
```

Recipient:

```text
PENDING
   ↓
QUEUED
   ↓
SENDING
   ↓
SENT
   ↓
DELIVERED
   ↓
READ
```

Failure path:

```text
PENDING
   ↓
QUEUED
   ↓
SENDING
   ↓
FAILED
```

Retry:

```text
FAILED
   ↓
QUEUED
```

Do not overwrite the historical event history.

---

# 17. Delivery Architecture

Never send thousands of messages inside one HTTP request.

Bad:

```text
POST /broadcast/send

for recipient in recipients:
    send_message()
```

This will cause:

- HTTP timeouts
- duplicate sends
- poor scalability
- difficult retries
- poor failure handling

Instead:

```text
API
 ↓
Create Broadcast
 ↓
Create Recipient Jobs
 ↓
Queue
 ↓
Workers
 ↓
Messaging Service
 ↓
Recipient Conversations
```

---

# 18. Queue-Based Architecture

Recommended:

```text
FastAPI
   |
   | create broadcast
   v
PostgreSQL / Supabase
   |
   v
Job Queue
   |
   +---- Worker 1
   +---- Worker 2
   +---- Worker 3
   +---- Worker N
            |
            v
      Message Service
            |
            v
       Conversations
```

Possible queue technologies:

- Redis + Celery
- Redis + RQ
- Dramatiq
- RabbitMQ
- SQS
- Kafka
- Supabase/Postgres queue pattern

Choose the queue that best fits the existing project.

Do not introduce a second infrastructure system if the project already has a reliable queue.

---

# 19. Recommended FastAPI Backend Structure

If the backend is FastAPI, use something similar to:

```text
backend/
├── api/
│   └── broadcasts.py
│
├── schemas/
│   └── broadcast.py
│
├── services/
│   ├── broadcast_service.py
│   ├── broadcast_recipient_service.py
│   ├── broadcast_template_service.py
│   └── message_service.py
│
├── workers/
│   └── broadcast_worker.py
│
├── repositories/
│   └── broadcast_repository.py
│
└── models/
    └── broadcast.py
```

Adapt this to the existing project architecture.

Do not create duplicate service layers if equivalent abstractions already exist.

---

# 20. API Endpoints

Recommended REST API.

## Create Audience

```http
POST /api/broadcasts/audiences
```

Request:

```json
{
  "name": "VIP Customers",
  "contact_ids": [
    "user_1",
    "user_2",
    "user_3"
  ]
}
```

## Get Audiences

```http
GET /api/broadcasts/audiences
```

## Get Audience

```http
GET /api/broadcasts/audiences/{audience_id}
```

## Update Audience

```http
PATCH /api/broadcasts/audiences/{audience_id}
```

## Delete Audience

```http
DELETE /api/broadcasts/audiences/{audience_id}
```

## Create Broadcast

```http
POST /api/broadcasts
```

Example:

```json
{
  "name": "September Promotion",
  "audience_id": "audience_123",
  "message": {
    "type": "text",
    "text": "September sale is live!"
  },
  "send_mode": "now",
  "idempotency_key": "uuid"
}
```

## Schedule Broadcast

```http
POST /api/broadcasts/{broadcast_id}/schedule
```

## Cancel Broadcast

```http
POST /api/broadcasts/{broadcast_id}/cancel
```

## List Broadcasts

```http
GET /api/broadcasts
```

Support:

```text
?page=1
&page_size=20
&status=completed
&search=promotion
```

## Broadcast Details

```http
GET /api/broadcasts/{broadcast_id}
```

## Broadcast Recipients

```http
GET /api/broadcasts/{broadcast_id}/recipients
```

Support filtering:

```text
?status=failed
?status=delivered
?status=read
```

## Duplicate Broadcast

```http
POST /api/broadcasts/{broadcast_id}/duplicate
```

This should create a new draft, not resend immediately.

## Retry Failed

```http
POST /api/broadcasts/{broadcast_id}/retry-failed
```

---

# 21. Scheduling

Support:

```text
Send now
Schedule for later
```

Date/time:

```text
2026-09-10 10:30 AM
```

Always store timestamps in UTC.

Store user/business timezone separately.

Example:

```text
User timezone:
Asia/Kolkata

Selected:
10 September 2026
10:30 AM IST

Database:
2026-09-10T05:00:00Z
```

Never rely on the browser's local timezone without explicitly handling timezone conversion.

---

# 22. Scheduled Broadcast Worker

The scheduler should find:

```text
status = SCHEDULED
scheduled_at <= NOW()
```

Then atomically change:

```text
SCHEDULED -> QUEUED
```

Only one worker should be able to claim a broadcast.

Use row locking/atomic update or an equivalent distributed locking mechanism.

---

# 23. Recipient Job Processing

For every recipient:

1. Validate recipient still exists.
2. Validate sender permission.
3. Validate block relationship.
4. Validate opt-out status.
5. Find or create the recipient's private conversation.
6. Render personalized content.
7. Create the message.
8. Associate message with broadcast recipient.
9. Queue/send the message through the normal messaging system.
10. Update delivery state.
11. Record event.
12. Continue to next recipient.

---

# 24. Reuse Existing Chat Message System

This is critical.

Do NOT create a completely separate message implementation for broadcasts if the application already has a normal message service.

Preferred:

```text
Broadcast
   ↓
Broadcast Service
   ↓
Existing Message Service
   ↓
Existing Conversation
   ↓
Existing Realtime / Notification System
```

This ensures broadcast messages automatically work with:

- Chat UI
- Notifications
- Message status
- Search
- Media
- Reply
- Reactions
- Forwarding
- Delete
- Read receipts

where applicable.

---

# 25. Conversation Handling

For each recipient:

```text
sender_id = business/user
recipient_id = customer
```

Find the existing one-to-one conversation.

If it doesn't exist:

```text
create conversation
```

Then create the message inside that conversation.

Never create:

```text
Broadcast Conversation
```

that is visible to all recipients.

---

# 26. Message Metadata

Add broadcast metadata to the message if the existing message schema allows it.

Example:

```json
{
  "source": "broadcast",
  "broadcast_id": "broadcast_123",
  "broadcast_recipient_id": "recipient_456"
}
```

This allows the system to know that a normal-looking private message originated from a broadcast.

Do not expose internal broadcast IDs unnecessarily to recipients.

---

# 27. Read Receipts

If the normal chat application already has read receipts:

```text
sent
delivered
read
```

reuse them.

Broadcast analytics can aggregate these states.

Example:

```text
Total: 1,000

Sent:       1,000
Delivered:    972
Read:         814
Failed:        28
```

If a recipient has disabled read receipts, the system should not falsely claim that the message was read.

---

# 28. Reply Tracking

A reply should remain a normal private message.

Example:

```text
Broadcast:
"New offer available!"

Customer replies:
"Can you tell me the price?"
```

The reply is:

```text
customer -> business
```

It must NOT become a message to other broadcast recipients.

For analytics:

```text
broadcast_recipients.replied_at
```

can be updated when the first qualifying reply is detected.

Optionally track:

```text
reply_count
```

for total replies.

---

# 29. Analytics

Broadcast detail screen should show:

```text
Audience
1,248

Sent
1,248

Delivered
1,210

Read
982

Failed
38

Replies
146
```

Calculate:

### Delivery Rate

```text
delivered / sent * 100
```

### Read Rate

```text
read / delivered * 100
```

### Reply Rate

```text
replied recipients / delivered * 100
```

Avoid division by zero.

---

# 30. Analytics UI

Example:

```text
September Promotion

Sent Sep 3, 2026

Recipients
1,248

---------------------------------
Delivery
1,210 / 1,248
96.9%
---------------------------------

Read
982 / 1,210
81.2%
---------------------------------

Replies
146
---------------------------------

Failed
38
---------------------------------
```

Then:

```text
Recipient Results

Search recipients...

Rahul       Delivered     Read
Aisha       Delivered     Read
Ahmed       Failed        -
Priya       Delivered     Read
```

Allow filtering by status.

---

# 31. Broadcast List Screen

Recommended UI:

```text
Broadcasts                         [+ New Broadcast]

Search broadcasts...

-----------------------------------------------
September Promotion
1,248 recipients
Sent Sep 3
Delivered 96.9%
-----------------------------------------------

New Product Launch
856 recipients
Scheduled Sep 8, 10:00 AM
-----------------------------------------------

Festival Offer
2,500 recipients
Draft
-----------------------------------------------
```

Filters:

```text
All
Drafts
Scheduled
Processing
Completed
Failed
```

---

# 32. Audience Screen

```text
Broadcast Audiences                    [+ New]

Search audiences...

VIP Customers
1,248 contacts

Retail Customers
4,820 contacts

New Customers
320 contacts
```

Actions:

```text
Open
Rename
Edit contacts
Duplicate
Delete
```

---

# 33. Recipient Details

When opening a broadcast:

```text
Broadcast Details

[Message preview]

Audience:
VIP Customers

Total:
1,248

Delivery:
96.9%

Read:
81.2%

Replies:
146

----------------------------------

Recipients

All       Sent       Delivered
Read      Failed     Replied
```

Clicking a recipient can open the existing private conversation.

---

# 34. Drafts

Allow broadcasts to be saved as drafts.

Draft contains:

- Name
- Audience
- Message
- Media
- Buttons
- Personalization
- Schedule
- Created by
- Updated time

A draft must not create any recipient messages.

---

# 35. Duplicate / Reuse

Users should be able to:

```text
Duplicate
```

a completed broadcast.

Result:

```text
New draft
```

Do not immediately send.

This allows:

```text
September Offer
        ↓ Duplicate
September Offer - Copy
        ↓ Edit
        ↓ Send
```

---

# 36. Cancel Scheduled Broadcast

Before processing begins:

```text
SCHEDULED -> CANCELLED
```

If processing has already started:

```text
PROCESSING -> cancellation_requested
```

Workers should stop creating new recipient jobs where possible.

Already delivered messages cannot be magically unsent by the broadcast system.

---

# 37. Partial Completion

A broadcast can partially succeed.

Example:

```text
1,000 recipients
950 delivered
30 failed
20 pending
```

The status should not be marked simply "FAILED".

Use:

```text
PARTIALLY_COMPLETED
```

when appropriate.

---

# 38. Retry Strategy

Retries should be automatic for transient failures.

Example:

```text
Attempt 1
   ↓
Failed
   ↓
Wait 5 sec
   ↓
Attempt 2
   ↓
Failed
   ↓
Wait 30 sec
   ↓
Attempt 3
```

Use exponential backoff.

Example:

```text
5s
30s
2m
10m
```

Maximum retry count should be configurable.

Do NOT retry permanent failures indefinitely.

Permanent failures include examples such as:

```text
USER_BLOCKED
INVALID_RECIPIENT
ACCOUNT_DISABLED
PERMISSION_DENIED
```

---

# 39. Rate Limiting

Broadcast is a high-volume operation.

Implement rate limiting.

Example configuration:

```text
messages_per_second = configurable
max_concurrent_jobs = configurable
```

Do not hard-code arbitrary limits into the frontend.

The backend must enforce limits.

If the application grows, use per-sender and global rate limits.

Example:

```text
sender_limit
tenant_limit
global_limit
```

---

# 40. Abuse Prevention

A broadcast feature can be abused for spam.

Implement:

- Per-user rate limits
- Per-business limits
- Maximum audience size
- Cooldowns if required
- Opt-out handling
- Block handling
- Abuse detection hooks
- Failed delivery monitoring
- Audit logs
- Permission checks

Administrators should be able to configure limits.

---

# 41. Opt-In / Opt-Out

If broadcasts are used for marketing, store explicit communication preferences.

Example:

```text
marketing_opt_in
transactional_opt_in
promotional_opt_in
```

At minimum:

```text
broadcast_opt_in
```

Before sending, exclude users who have opted out.

Example:

```text
Audience:
1,000

Opted out:
80

Final recipients:
920
```

Show this in the review screen.

---

# 42. Opt-Out UX

Provide a simple way for recipients to stop broadcasts.

Possible UI:

```text
Stop receiving promotional messages
```

If the application supports commands:

```text
STOP
UNSUBSCRIBE
```

can update the user's preference.

Do not unsubscribe users from unrelated transactional messages unless the product explicitly defines that behavior.

---

# 43. Blocked Users

If:

```text
sender blocked by recipient
```

or the platform's permissions prevent messaging:

```text
exclude recipient
```

and record:

```text
failure_code = USER_BLOCKED
```

Do not keep retrying.

---

# 44. Permission Model

Only authorized users should create broadcasts.

Example permissions:

```text
broadcast.view
broadcast.create
broadcast.edit
broadcast.send
broadcast.schedule
broadcast.cancel
broadcast.delete
broadcast.analytics
```

For a multi-tenant application:

```text
owner_id / organization_id
```

must be checked on every endpoint.

Never trust `owner_id` from the client.

Take identity from authenticated session/JWT.

---

# 45. Multi-Tenant Isolation

If the application supports businesses/organizations:

Every broadcast must belong to:

```text
organization_id
```

Every audience must belong to:

```text
organization_id
```

Every recipient must be validated against that organization.

Never allow:

```text
Organization A
```

to access:

```text
Organization B's
```

broadcasts or contacts.

---

# 46. Security

Backend must validate:

- Authenticated sender
- Organization membership
- Permission
- Audience ownership
- Recipient ownership/access
- Message size
- Media ownership
- Allowed media types
- URL safety if applicable
- Template variables
- Scheduling time
- Maximum audience size

Never rely on frontend validation alone.

---

# 47. Media Handling

Do not upload media once per recipient.

Correct:

```text
Upload image once
       ↓
media_id
       ↓
reuse media reference
```

Incorrect:

```text
recipient 1 -> upload
recipient 2 -> upload
recipient 3 -> upload
...
```

Use the existing media storage/CDN.

If media must be copied per message for platform reasons, make this a backend concern.

---

# 48. Large Audience Optimization

For 100,000 recipients:

Do NOT load all recipient records into application memory.

Use:

```text
cursor pagination
batch processing
```

Example:

```text
Batch 1: 1,000
Batch 2: 1,000
Batch 3: 1,000
...
```

Workers process batches.

Database indexes are essential.

Recommended indexes:

```sql
CREATE INDEX idx_broadcast_recipients_broadcast
ON broadcast_recipients(broadcast_id);

CREATE INDEX idx_broadcast_recipients_status
ON broadcast_recipients(broadcast_id, status);

CREATE INDEX idx_broadcasts_owner
ON broadcasts(owner_id);

CREATE INDEX idx_broadcasts_status_schedule
ON broadcasts(status, scheduled_at);

CREATE INDEX idx_audience_members_audience
ON broadcast_audience_members(audience_id);

CREATE INDEX idx_audience_members_contact
ON broadcast_audience_members(contact_id);
```

Adapt index names/types to the actual schema.

---

# 49. Transaction Boundaries

Creating a broadcast should be transactional.

Recommended:

```text
BEGIN

create broadcast
resolve audience
create recipient snapshot
store message definition

COMMIT
```

Only after the transaction succeeds should delivery jobs become available.

This prevents a broadcast from being partially created.

---

# 50. Recipient Snapshot Creation

At send time:

```text
Audience
   ↓
Resolve contacts
   ↓
Filter blocked
   ↓
Filter opted out
   ↓
Filter invalid
   ↓
Create broadcast_recipient rows
```

Store the final recipient count.

Example:

```text
Audience size: 5,000
Blocked: 50
Opted out: 120
Invalid: 10

Final:
4,820
```

The final number should be immutable for that broadcast except for explicitly recorded changes such as cancellation.

---

# 51. Race Conditions

Consider these scenarios.

## Double Send

Two API requests attempt to send the same broadcast.

Solution:

```text
idempotency_key
```

and atomic state transition.

## Double Worker

Two workers process the same recipient.

Solution:

```text
claim job atomically
```

before sending.

## User Edits Audience During Send

Do not change recipient snapshot.

The broadcast continues using its original snapshot.

## User Deletes Audience

Existing broadcasts should continue to work because recipient snapshots are independent.

---

# 52. Recommended Recipient Job Claim

Use an atomic pattern such as:

```text
PENDING -> PROCESSING
```

with a database condition.

Only the worker that successfully changes the row owns the job.

If a worker crashes while processing, use a lease/visibility timeout:

```text
processing_started_at
lease_until
```

Then another worker can safely reclaim abandoned jobs.

---

# 53. Observability

Log:

```text
broadcast_id
recipient_id
message_id
worker_id
attempt
event
timestamp
failure_code
```

Do not log sensitive message content unnecessarily.

Metrics:

```text
broadcasts_created
broadcasts_completed
broadcasts_failed
messages_queued
messages_sent
messages_delivered
messages_failed
average_delivery_time
worker_queue_depth
retry_count
```

---

# 54. Audit Log

For business applications, record:

```text
who created broadcast
who edited broadcast
who scheduled broadcast
who cancelled broadcast
who sent broadcast
when action happened
```

Example:

```text
User Rahul created broadcast B123
User Rahul scheduled B123
User Admin cancelled B123
```

---

# 55. Notifications

Broadcast messages should use the same notification system as normal messages.

However, avoid accidentally generating duplicate notifications.

Architecture:

```text
Broadcast
   ↓
Normal Message
   ↓
Normal Notification Pipeline
```

Do not:

```text
Broadcast Notification
+
Normal Message Notification
```

for the same message unless intentionally designed.

---

# 56. Chat UI Behavior

To the recipient, the message should look like a normal incoming message.

Do NOT show:

```text
Broadcast sent to 1,000 people
```

inside the recipient's conversation.

Optionally, for the sender/business's own UI, show a small internal indicator:

```text
Broadcast
```

but do not expose recipient information.

---

# 57. Sender Chat UI

When the sender opens a conversation, the message can optionally display:

```text
Broadcast message
Delivered
Read
```

But recipient-level analytics should primarily live inside Broadcast Details.

---

# 58. Templates

The application can optionally support reusable templates.

Example:

```text
Template:
New Product Announcement

Hi {{first_name}},

We have launched our new product collection.

Shop now: {{link}}
```

Template states:

```text
DRAFT
ACTIVE
ARCHIVED
```

Templates should be reusable.

Do not automatically send a template when it is created.

---

# 59. Template Management UI

```text
Message Templates

[ + Create Template ]

Product Launch
Marketing
Active

Festival Offer
Marketing
Active

Order Reminder
Transactional
Active
```

Actions:

```text
Use
Edit
Duplicate
Archive
Delete
```

If the project does not need templates yet, keep the architecture extensible but do not overbuild the first version.

---

# 60. Broadcast vs Group Chat

Broadcast:

```text
1 sender
   ↓
many private conversations
```

Group:

```text
many participants
   ↕
shared conversation
```

Never reuse group-chat membership logic for broadcast delivery.

---

# 61. Broadcast vs Channel

A channel is generally:

```text
Admin
 ↓
Followers
```

and is designed as a one-way publishing surface.

A broadcast is:

```text
Sender
 ↓
private 1-to-1 conversations
```

with replies remaining private.

If the product later adds channels, implement channels as a separate domain.

---

# 62. WhatsApp-Like UX Features Worth Reproducing

The broadcast feature should provide the familiar behaviors users expect:

- Saved recipient lists
- Reusable audiences
- Search contacts
- Add/remove recipients
- Rename lists
- Delete lists
- One-to-many sending
- Private recipient conversations
- Private replies
- Media support
- Preview
- Scheduling
- Broadcast history
- Delivery status
- Read status
- Reply analytics
- Drafts
- Duplicate/reuse
- Failure handling
- Retry
- Recipient filtering

---

# 63. Business Broadcast Enhancements

For a more advanced version, add:

## Action Buttons

```text
[ View Product ]
[ Call Us ]
[ Reply ]
```

## Product / Catalog Action

If the app has products:

```text
[ View Product ]
```

opens the product page.

## Website

```text
[ Visit Website ]
```

## Custom Reply

```text
[ I'm Interested ]
```

which sends a predefined response.

---

# 64. Import Audience

If contact import is required, support:

```text
CSV
XLSX
```

Possible columns:

```text
name
phone
email
tags
```

Validate:

- Required fields
- Duplicate contacts
- Invalid phone numbers
- Existing users
- Opt-out status

Never silently import invalid contacts.

Provide an import report:

```text
Imported: 980
Duplicates: 15
Invalid: 5
Opted out: 20
```

---

# 65. Mobile UX

The mobile broadcast composer should be optimized for one-hand use.

Suggested:

```text
Broadcast
────────────────────

Audience
VIP Customers
1,248 recipients

Message
────────────────────
New collection is live!
────────────────────

📎  🖼  🎥  📄

Schedule
Send now

                [Next]
```

Use bottom sheets for:

- Audience selection
- Schedule
- Media selection
- Advanced options

---

# 66. Desktop UX

Desktop can use a two-column layout:

```text
--------------------------------------------------------
Broadcast Composer

LEFT                         RIGHT
--------------------------------------------------------
Audience                     Preview
VIP Customers                ----------------
1,248                        Business
                             New collection...
Message
New collection is live!

Media

Schedule

[Cancel] [Send]
--------------------------------------------------------
```

---

# 67. Empty States

Broadcast list:

```text
No broadcasts yet.

Create your first broadcast to message multiple
contacts privately at once.

[ Create Broadcast ]
```

Audience:

```text
No audiences created.

Create a reusable contact audience.

[ Create Audience ]
```

---

# 68. Loading States

Do not freeze the UI during large operations.

Show:

```text
Preparing broadcast...
```

Then:

```text
Broadcast queued
```

Then:

```text
Sending...
1,250 / 10,000
```

Use polling or realtime updates.

---

# 69. Realtime Progress

If the application already uses WebSockets/Supabase Realtime:

```text
broadcast_progress
```

events can update the UI.

Example:

```json
{
  "broadcast_id": "B123",
  "queued": 10000,
  "sent": 7200,
  "delivered": 6810,
  "failed": 390
}
```

The frontend should not have to repeatedly reload the entire broadcast.

---

# 70. Progress UI

```text
Sending Broadcast...

██████████████░░░░ 72%

7,200 / 10,000 processed

Delivered: 6,810
Failed: 390

You can leave this page.
The broadcast will continue in the background.
```

This last sentence is important.

Broadcast processing must happen server-side.

---

# 71. Error Handling

Frontend errors should be human-readable.

Bad:

```text
HTTP 500
```

Better:

```text
We couldn't start this broadcast.
Please try again.
```

For validation:

```text
Please select at least one recipient.
```

For permissions:

```text
You don't have permission to send broadcasts.
```

For audience size:

```text
This audience exceeds your current broadcast limit.
```

---

# 72. API Error Format

Use a consistent structure:

```json
{
  "error": {
    "code": "BROADCAST_LIMIT_EXCEEDED",
    "message": "The selected audience is larger than the allowed limit."
  }
}
```

Recommended codes:

```text
BROADCAST_NOT_FOUND
BROADCAST_ACCESS_DENIED
BROADCAST_ALREADY_SENT
BROADCAST_CANCELLED
BROADCAST_LIMIT_EXCEEDED
EMPTY_AUDIENCE
INVALID_RECIPIENT
RECIPIENT_BLOCKED
RECIPIENT_OPTED_OUT
INVALID_TEMPLATE
INVALID_MEDIA
SCHEDULE_TIME_INVALID
DUPLICATE_REQUEST
```

---

# 73. Testing Requirements

Implement unit tests.

## Audience Tests

- Create audience
- Rename audience
- Add member
- Remove member
- Duplicate member prevented
- Delete audience

## Broadcast Tests

- Create draft
- Create send-now broadcast
- Schedule broadcast
- Cancel scheduled broadcast
- Duplicate broadcast
- Retry failed recipients

## Recipient Tests

- Correct recipient snapshot
- Blocked user excluded
- Opted-out user excluded
- Invalid user excluded
- Duplicate recipient prevented

## Delivery Tests

- Successful send
- Temporary failure
- Permanent failure
- Retry
- Worker crash recovery
- Duplicate worker prevention

## Personalization Tests

Input:

```text
Hello {{first_name}}
```

Expected:

```text
Hello Rahul
```

Unknown variable should fail validation.

## Security Tests

- User cannot access another organization's broadcast
- User cannot modify another organization's audience
- Unauthorized send is rejected
- Invalid media ownership is rejected

---

# 74. End-to-End Test

Test:

```text
Create audience with 3 contacts
        ↓
Create broadcast
        ↓
Preview
        ↓
Send
        ↓
Three private conversations receive messages
        ↓
Recipient 1 replies
        ↓
Only sender + Recipient 1 see reply
        ↓
Analytics show 1 reply
```

This test is mandatory.

---

# 75. Performance Test

Test with:

```text
10 recipients
100 recipients
1,000 recipients
10,000 recipients
100,000 recipients
```

Measure:

```text
queue latency
processing throughput
database load
memory usage
worker concurrency
failure rate
```

The system should not hold all recipients in application memory.

---

# 76. Frontend Components

Adapt names to the existing React architecture.

Recommended:

```text
BroadcastList.tsx
BroadcastCard.tsx
BroadcastDetails.tsx
BroadcastComposer.tsx
AudienceSelector.tsx
AudienceList.tsx
AudienceEditor.tsx
RecipientSelector.tsx
MessagePreview.tsx
BroadcastSchedulePicker.tsx
BroadcastAnalytics.tsx
BroadcastRecipientTable.tsx
BroadcastProgress.tsx
BroadcastEmptyState.tsx
```

Reuse:

```text
ChatComposer
MediaPicker
MessageRenderer
ContactSelector
Modal
Dropdown
Button
Avatar
```

where possible.

---

# 77. Frontend Routes

Possible:

```text
/broadcasts
/broadcasts/new
/broadcasts/:id
/broadcasts/:id/edit
/broadcasts/:id/recipients
/broadcast-audiences
/broadcast-audiences/:id
```

Use the application's existing routing conventions.

---

# 78. Frontend State

Recommended state:

```text
audience
selectedRecipients
message
attachments
variables
schedule
status
progress
error
```

Do not keep the entire recipient database in global state.

Use server-side pagination.

---

# 79. TypeScript Models

Example:

```ts
type BroadcastStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "processing"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

type BroadcastRecipientStatus =
  | "pending"
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "cancelled";

interface Broadcast {
  id: string;
  name?: string;
  status: BroadcastStatus;
  audienceId?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
}
```

Adapt to the actual project's naming convention.

---

# 80. Supabase Considerations

If the application uses Supabase/Postgres:

- Use Postgres tables for persistent broadcast state.
- Use Row Level Security where appropriate.
- Never expose service-role keys in the frontend.
- Use backend/server-side privileged operations for broadcast processing.
- Use Supabase Realtime only for progress/status updates, not as the primary job queue unless the chosen architecture explicitly supports reliable job claiming.
- Use database functions/RPC only when they improve atomicity and maintainability.
- Add appropriate indexes.
- Keep recipient snapshots independent from editable audiences.

---

# 81. RLS / Authorization

If Supabase RLS is used:

Users should only see:

```text
their own broadcasts
their organization's broadcasts
their own audiences
their organization's audiences
```

Never create a broad policy such as:

```text
authenticated users can select everything
```

Broadcast data can contain sensitive customer information.

---

# 82. Message Ordering

Suppose a sender sends:

```text
Broadcast A
Broadcast B
```

very quickly.

For the same recipient, messages should preserve intended ordering where required.

Use:

```text
broadcast_created_at
sequence
```

or queue ordering.

At minimum, avoid a later broadcast appearing before an earlier one because of uncontrolled worker concurrency.

---

# 83. Transactional vs Marketing Broadcasts

If the application supports both, distinguish them.

### Transactional

Examples:

```text
Order shipped
Payment received
Appointment reminder
```

### Marketing

Examples:

```text
Sale
Promotion
New product
Festival offer
```

Different consent and frequency policies may apply.

Do not treat all broadcasts as marketing by default.

---

# 84. Frequency Controls

Optional but recommended.

Example:

```text
Maximum promotional broadcasts per recipient:
3 / week
```

Before sending:

```text
recipient frequency policy
```

can prevent excessive messaging.

This should be configurable.

---

# 85. Quiet Hours

Optional.

Example:

```text
Do not send promotional broadcasts:
10:00 PM - 8:00 AM
```

For scheduled broadcasts, either:

- delay delivery until allowed hours, or
- prevent scheduling inside quiet hours.

Choose one policy and document it.

---

# 86. Data Retention

Decide how long to retain:

```text
broadcasts
recipient records
events
analytics
audit logs
```

Do not delete message history simply because a broadcast record is deleted.

If a broadcast is deleted, preserve normal chat messages unless the product explicitly defines another behavior.

Recommended:

```text
Delete broadcast metadata
Keep already-created chat messages
```

---

# 87. Privacy

Do not expose the broadcast audience to recipients.

Recipient A must never be able to discover:

- Other recipients
- Audience size
- Recipient names
- Recipient phone numbers
- Broadcast analytics

The sender can see analytics according to permissions.

---

# 88. UX Rule: No Accidental Grouping

The most important UI/backend invariant:

```text
Broadcast recipients are always isolated.
```

Never show:

```text
Rahul, Aisha, Ahmed, Priya...
```

inside a recipient-facing chat.

---

# 89. Recommended MVP

If implementation needs to be staged, build this first:

### Phase 1

- Broadcast list
- Create audience
- Select contacts
- Text broadcast
- Send immediately
- Separate private messages
- Delivery status
- Read status
- Basic analytics
- Drafts
- Duplicate

### Phase 2

- Media
- Scheduling
- Retry failed
- Progress tracking
- Realtime updates
- Personalization

### Phase 3

- Templates
- Buttons
- Dynamic audiences
- CSV/XLSX import
- Frequency controls
- Advanced analytics

### Phase 4

- Large-scale optimization
- Advanced abuse detection
- A/B testing
- Campaign comparison
- Conversion tracking

Do not delay the MVP unnecessarily with advanced marketing functionality.

---

# 90. Implementation Order

Claude should implement in this exact order unless the existing architecture requires a different dependency order.

## Step 1 — Inspect Existing Project

Before changing code:

- Inspect frontend architecture.
- Inspect backend architecture.
- Inspect authentication.
- Inspect users/contacts.
- Inspect conversations.
- Inspect messages.
- Inspect media.
- Inspect notifications.
- Inspect read receipts.
- Inspect realtime system.
- Inspect database schema.
- Inspect existing permissions.
- Inspect existing queue/background workers.

Do not create duplicate systems.

## Step 2 — Design Integration

Identify:

```text
Existing Contact Model
Existing Conversation Model
Existing Message Model
Existing Media Model
Existing Auth Model
Existing Realtime Model
```

Then map broadcast functionality onto them.

## Step 3 — Database Migration

Create only required new tables/columns/indexes.

Do not modify unrelated tables unnecessarily.

## Step 4 — Backend Domain

Implement:

```text
Audience Service
Broadcast Service
Recipient Snapshot Service
Broadcast Worker
Analytics Service
```

## Step 5 — API

Implement all required endpoints with authentication and authorization.

## Step 6 — Delivery Integration

Connect recipient jobs to the existing message service.

## Step 7 — Frontend

Implement:

```text
Broadcasts
Audience management
Composer
Preview
Scheduling
Analytics
Recipient results
```

## Step 8 — Realtime

Connect progress updates if existing realtime infrastructure supports it.

## Step 9 — Tests

Run unit, integration, security and end-to-end tests.

## Step 10 — Performance

Test large audiences and verify queue/worker behavior.

---

# 91. Definition of Done

The feature is complete only when all of these work:

### Audience

- [ ] Create audience
- [ ] Rename audience
- [ ] Add recipients
- [ ] Remove recipients
- [ ] Search recipients
- [ ] Delete audience
- [ ] Duplicate audience

### Broadcast

- [ ] Create broadcast
- [ ] Save draft
- [ ] Edit draft
- [ ] Preview
- [ ] Send now
- [ ] Schedule
- [ ] Cancel schedule
- [ ] Duplicate previous broadcast
- [ ] Delete/archive broadcast

### Delivery

- [ ] Messages arrive as private messages
- [ ] No group is created
- [ ] Replies remain private
- [ ] Existing message system is reused
- [ ] Duplicate delivery prevented
- [ ] Retry works
- [ ] Permanent failures stop retrying
- [ ] Rate limiting works

### Analytics

- [ ] Sent count
- [ ] Delivered count
- [ ] Read count
- [ ] Failed count
- [ ] Reply count
- [ ] Delivery rate
- [ ] Read rate
- [ ] Reply rate
- [ ] Recipient-level status

### Safety

- [ ] Authentication
- [ ] Authorization
- [ ] Tenant isolation
- [ ] Block handling
- [ ] Opt-out handling
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Secure media handling

### Performance

- [ ] Small audience works
- [ ] Large audience uses background processing
- [ ] Browser does not wait for entire broadcast
- [ ] Workers can recover from crashes
- [ ] No duplicate recipient jobs

---

# 92. Critical Engineering Rules for Claude

Claude MUST follow these rules while implementing.

1. **Inspect the existing codebase before creating files.**
2. **Reuse existing user/contact/conversation/message/media/auth systems.**
3. **Do not create a second chat/message system.**
4. **Do not create a group chat for broadcasts.**
5. **Every recipient must receive an independent 1-to-1 message.**
6. **Recipient replies must remain private.**
7. **Use a recipient snapshot so later audience changes do not modify an existing broadcast.**
8. **Use idempotency to prevent duplicate broadcasts.**
9. **Use background workers/queues for large sends.**
10. **Do not send thousands of messages in one HTTP request.**
11. **Do not trust frontend authorization.**
12. **Enforce tenant isolation on the backend.**
13. **Do not expose other recipients to a recipient.**
14. **Reuse existing realtime and notification systems where possible.**
15. **Do not upload the same media separately for every recipient unless technically required.**
16. **Do not hard-code small WhatsApp-specific limits unless explicitly requested by the product owner.**
17. **Do not implement undocumented WhatsApp behavior as fact.**
18. **Use configurable limits for audience size, concurrency and rate.**
19. **Do not delete normal chat messages merely because broadcast metadata is deleted.**
20. **Do not mark messages as read unless the existing read-receipt system confirms it.**
21. **All scheduled times must be converted correctly to UTC.**
22. **Every database migration must be safe and reversible where practical.**
23. **Run tests after implementation.**
24. **Fix TypeScript/Python/lint/type errors before declaring completion.**
25. **Do not replace existing working application behavior unnecessarily.**

---

# 93. Final Expected Architecture

The final system should look approximately like this:

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │                      │
                         │ Broadcasts           │
                         │ Audiences            │
                         │ Composer              │
                         │ Preview               │
                         │ Analytics             │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │                      │
                         │ Broadcast API        │
                         │ Audience API          │
                         │ Auth / Permissions   │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
          ┌────────────────────┐        ┌────────────────────┐
          │ PostgreSQL/Supabase│        │ Job Queue          │
          │                    │        │                    │
          │ broadcasts         │        │ recipient jobs     │
          │ audiences          │        │ retries            │
          │ recipients         │        │ scheduling         │
          │ events             │        └─────────┬──────────┘
          └────────────────────┘                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │ Broadcast Workers  │
                                       └─────────┬──────────┘
                                                 │
                                                 ▼
                                       ┌────────────────────┐
                                       │ Existing Message   │
                                       │ Service            │
                                       └─────────┬──────────┘
                                                 │
                             ┌───────────────────┼───────────────────┐
                             ▼                   ▼                   ▼
                      Conversation 1     Conversation 2     Conversation N
                         User A              User B              User N
                             │                   │                   │
                             ▼                   ▼                   ▼
                         Private              Private              Private
                         message              message              message
```

---

# 94. Reference Behavior Based on WhatsApp

For product inspiration, the implementation should reproduce the core WhatsApp broadcast concept:

- Saved contact lists
- Multiple recipients
- Individual/private delivery
- Private replies
- List editing
- List deletion
- Business audience selection
- Media
- Scheduling
- Action buttons
- Preview
- Broadcast management
- Delivery/read/reply insights

Current WhatsApp documentation also states that classic broadcast lists can contain up to 256 contacts and that recipients generally need to have the sender saved. The newer WhatsApp Business broadcast product has additional capabilities such as audience selection, media, action buttons, scheduling and insights.

These platform-specific rules should be treated as **reference behavior**, not necessarily hard limits for our own application.

---

# 95. Final Instruction to the Coding Agent

Implement the Broadcast feature as a **first-class module of the existing chat application**, not as a disconnected mini-application.

Before writing code:

1. Inspect the repository.
2. Identify existing models/services/components.
3. Create an implementation plan.
4. Identify files that will be changed.
5. Avoid unnecessary rewrites.

Then implement:

```text
Audience Management
+
Broadcast Composer
+
Message Delivery
+
Background Processing
+
Scheduling
+
Analytics
+
Retries
+
Security
+
Permissions
+
Realtime Progress
```

The final implementation must preserve the application's existing chat functionality.

The most important invariant is:

> **One broadcast message becomes multiple independent private messages, one per recipient.**

A broadcast must never expose the recipient list and must never turn into a group conversation.

---

# 96. Official Reference Sources

The following official WhatsApp resources were used to establish the current reference behavior:

- WhatsApp Help Center — How to use broadcast lists
- WhatsApp Help Center — How to use broadcast lists on WhatsApp Business
- WhatsApp Help Center — How to create and send a business broadcast
- WhatsApp Help Center — How to manage business broadcasts
- WhatsApp Help Center — Lists
- WhatsApp Business — About business broadcasts
- Meta Newsroom — Business messaging/broadcast updates

Because WhatsApp changes product behavior and availability over time, verify current platform-specific limits and policies before intentionally copying any particular restriction into the application.
