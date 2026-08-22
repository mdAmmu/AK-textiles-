# Simple WhatsApp + In-App Template Sending — Implementation Plan

## 1. Scope

Implement **only** this feature for the first version:

```text
Admin
  ↓
Create message template
  ↓
Open existing Group Chat
  ↓
Click Template icon
  ↓
Select template
  ↓
Click Send
  ↓
Template appears in the in-app chat for every user in that group
  +
Same approved WhatsApp template is sent to every eligible user
on their real WhatsApp
```

### Do NOT implement in this phase

- Incoming WhatsApp messages
- WhatsApp webhook
- Admin replying to WhatsApp
- WhatsApp inbox
- WhatsApp delivery/read dashboard
- Product deep links
- Product collections
- Campaign management
- Scheduling
- Analytics
- Advanced retry/queue architecture
- WhatsApp media/image/PDF sending
- CRM functionality

The goal is to get the **basic template broadcast working end-to-end** first.

---

## 2. Existing Project Stack

Use the existing project architecture:

- Frontend: **React + Vite**
- Backend: **FastAPI**
- Database: **PostgreSQL**
- ORM: **SQLAlchemy**
- Migrations: **Alembic**
- Realtime chat: existing FastAPI WebSocket implementation
- Existing group/community functionality
- Existing group chat functionality
- Existing user chat functionality
- Existing authentication/authorization
- Existing Supabase client where already used

### Do NOT introduce

- Next.js
- Next.js API routes
- Next.js Server Actions
- Supabase Realtime
- Supabase Edge Functions
- A new chat system
- A new group system

Reuse the current application.

---

## 3. Exact User Flow

### 3.1 Admin creates a template

Admin opens:

```text
Admin → Message Templates
```

Admin clicks:

```text
Create Template
```

Example:

```text
Template Name:
Today's Product

Message:
Today's products are available.
Please check the latest products.
```

Save the template.

The template then appears in the template list.

---

## 4. Template Fields

Keep the first version simple.

Create:

```text
name
message
whatsapp_template_name
whatsapp_template_language
created_by
created_at
updated_at
```

Example:

```text
Application Name:
Today's Product

Application Message:
Today's products are available.
Please check the latest products.

WhatsApp Template Name:
daily_product

WhatsApp Language:
en
```

Do not add complicated template variables unless the actual approved Meta template requires them.

---

## 5. Admin Template Screen

Create a simple admin screen using the existing React/Vite UI style.

Features:

- View all templates
- Create template
- Edit template
- Delete template if appropriate
- View template message

Example:

```text
Message Templates

--------------------------------
Today's Product

Today's products are available.
Please check the latest products.

[Edit]
--------------------------------

Weekly Product

Check this week's products.

[Edit]
--------------------------------

[+ Create Template]
```

---

## 6. Backend Template API

Create/reuse a FastAPI router following the existing project structure.

Example endpoints:

```text
GET    /api/message-templates
POST   /api/message-templates
GET    /api/message-templates/{id}
PUT    /api/message-templates/{id}
DELETE /api/message-templates/{id}
```

Use the existing authentication system.

Only authorized admins can create/edit/delete templates.

---

## 7. Database

Use the existing SQLAlchemy + Alembic architecture.

Create:

```text
message_templates
```

Suggested fields:

```text
id
name
message
whatsapp_template_name
whatsapp_template_language
created_by
created_at
updated_at
```

Use the project's existing ID/date conventions if they differ.

Before creating the model, inspect the existing database models to make sure an equivalent template table does not already exist.

Create an Alembic migration.

---

## 8. Existing Group Chat

The group chat already exists.

**Do not rebuild it.**

Add only the template functionality to the existing group chat message input.

Example:

```text
-----------------------------------------
Group Chat

Admin:
Hello everyone

User:
Hello

-----------------------------------------
[ Template ] [ Message input ] [Send]
-----------------------------------------
```

The exact UI should follow the existing project design.

---

## 9. Template Icon

When the admin clicks:

```text
Template
```

open a simple template selector.

Example:

```text
Select Template

Today's Product
Today's products are available.
----------------------------

Weekly Product
Check this week's products.
----------------------------

[Create Template]
```

The selector loads templates from the backend.

---

## 10. Template Selection

When the admin selects a template, show it in the existing message composer/preview.

Example:

```text
-----------------------------------------
Today's Product

Today's products are available.
Please check the latest products.
-----------------------------------------

[Cancel]                         [Send]
```

The admin must explicitly click Send.

Do not send automatically when selecting a template.

---

## 11. Send Button

When admin clicks:

```text
Send
```

the backend performs two actions:

```text
1. Send the template inside the application
2. Send the WhatsApp template to eligible group users
```

Conceptually:

```text
                    Admin clicks Send
                           |
                           v
                        FastAPI
                           |
              +------------+------------+
              |                         |
              v                         v
       In-App Messages           WhatsApp API
              |                         |
              v                         v
       Group Members             Group Members
              |                         |
              v                         v
       User Chat Screen          Real WhatsApp
```

---

## 12. In-App Message Sending

When the admin sends a template to a group:

1. Get all members of the group.
2. For each member, create an in-app message using the existing chat/message system.
3. The message must appear in the user's existing chat screen.
4. Use the existing WebSocket broadcaster if the application currently uses it for realtime messages.

Do not create a new messaging architecture.

Reuse the existing:

- conversation/message model
- message service
- WebSocket broadcaster
- chat API

---

## 13. In-App Message Content

The user's chat should display the template as an admin message.

Example:

```text
Admin

Today's products are available.
Please check the latest products.
```

The user should not be able to send this template themselves.

For this first version:

- Admin can send templates.
- User can receive/view templates.
- Existing user chat functionality remains unchanged.
- No WhatsApp reply functionality is required.

---

## 14. WhatsApp Sending

After creating the in-app messages, the backend sends the same template through the **Meta WhatsApp Cloud API**.

The WhatsApp message must be an approved WhatsApp template.

Important:

The application's local template and Meta's WhatsApp template are not automatically the same thing.

Example:

Application template:

```text
Today's Product

Today's products are available.
Please check the latest products.
```

Meta WhatsApp template:

```text
daily_product

Today's products are available.
```

The application stores the Meta template name so the backend knows which approved WhatsApp template to send.

---

## 15. Meta / WhatsApp Setup

Before testing real WhatsApp sending, the client needs:

- Meta Business account
- WhatsApp Business Account
- WhatsApp phone number
- Meta developer app
- WhatsApp Cloud API enabled
- WhatsApp access token
- Phone Number ID
- Approved WhatsApp template

Creating a local application template does **not** automatically create or approve a Meta WhatsApp template.

---

## 16. Environment Variables

Keep WhatsApp credentials on the FastAPI backend only.

Example:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=
```

If the existing project uses another configuration convention, follow it.

Never put `WHATSAPP_ACCESS_TOKEN` in React/Vite client-side environment variables.

---

## 17. WhatsApp Service

Create a small backend service following the existing project structure.

Example:

```text
backend/app/services/whatsapp.py
```

Main responsibility:

```text
send_template_message(...)
```

Conceptually:

```python
send_template_message(
    phone_number,
    template_name,
    language
)
```

The actual API payload must follow the current Meta WhatsApp Cloud API documentation. Do not invent or use an outdated payload format.

---

## 18. WhatsApp Recipient Selection

When admin sends a template to a group:

```text
Group
 ↓
Group Members
 ↓
Get WhatsApp number
 ↓
Send WhatsApp template
```

Only users with a valid WhatsApp number and required eligibility/opt-in should receive the WhatsApp message.

If the existing user model already has a suitable WhatsApp/consent field, reuse it.

Keep the eligibility check simple for this phase.

---

## 19. Sending to Group Members

Suppose the group has:

```text
200 users
```

When admin clicks Send:

```text
In-app:
200 messages

WhatsApp:
200 eligible WhatsApp messages
```

If some users do not have a WhatsApp number or are not eligible:

```text
In-app:
200 messages

WhatsApp:
only eligible users
```

One invalid user must not stop the entire send.

---

## 20. Simple Broadcast API

Add a FastAPI endpoint for sending a template to a group.

Example:

```text
POST /api/groups/{group_id}/template
```

Request:

```json
{
  "template_id": 123
}
```

Backend steps:

1. Authenticate admin.
2. Verify admin has access to the group.
3. Verify template exists.
4. Get group members.
5. Create in-app messages.
6. Send WhatsApp template to eligible users.
7. Return a simple result.

Example response:

```json
{
  "success": true,
  "in_app_sent": 200,
  "whatsapp_sent": 195,
  "whatsapp_skipped": 5
}
```

Follow the existing API response conventions if they differ.

---

## 21. Avoid Duplicate Sends

Frontend:

- Disable Send while the request is processing.
- Prevent double-clicks.

Backend:

- Add simple protection against the same template being submitted twice in rapid succession.

Do not build a complex idempotency system in this phase.

---

## 22. WhatsApp API Errors

If WhatsApp sending fails for one user, do not stop the entire operation.

Example:

```text
Group members: 200

In-app:
200 sent

WhatsApp:
195 sent
5 failed
```

Log detailed Meta errors on the backend.

Return only a simple summary to the admin.

Do not expose raw Meta API payloads to the admin.

---

## 23. Sending Strategy

Keep the first implementation straightforward.

If the current project already has a background-job system, reuse it.

If it does not, a simple FastAPI background task is acceptable for the initial small-group MVP.

Do not spend this phase building a complex worker/queue system.

If the client later needs reliable broadcasts to hundreds/thousands of users, introduce a proper worker/queue in a separate phase.

---

## 24. Realtime In-App Messages

The application already has WebSocket chat functionality.

After creating the message:

```text
Database
   ↓
Existing WebSocket broadcaster
   ↓
User's chat screen
```

Reuse the existing broadcaster.

Do not add:

- Supabase Realtime
- another WebSocket implementation
- another event system

---

## 25. Basic Security

Only admins can:

- create templates
- edit templates
- delete templates
- send templates to groups

The backend must verify permissions.

Do not rely only on hiding UI buttons.

Users must not be able to call the broadcast API directly.

---

## 26. Final MVP Flow

### Admin

```text
Admin Dashboard
      ↓
Message Templates
      ↓
Create Template
      ↓
Save
      ↓
Existing Group Chat
      ↓
Template Icon
      ↓
Select Template
      ↓
Preview
      ↓
Send
```

### Backend

```text
POST /groups/{group_id}/template
             |
             v
       Validate Admin
             |
             v
        Get Template
             |
             v
       Get Group Users
             |
       +-----+-----+
       |           |
       v           v
   In-App       WhatsApp
   Messages       API
       |           |
       v           v
  User Chat    Real WhatsApp
```

---

## 27. Implementation Phases

### Phase 1 — Inspect Existing Code

Find and reuse:

- user model
- group model
- group member model
- conversation model
- message model
- chat service
- WebSocket broadcaster
- FastAPI router structure
- React/Vite routing
- admin authorization
- any existing template model
- any existing WhatsApp code

Do not change anything yet.

### Phase 2 — Message Template Database

Create or extend:

```text
message_templates
```

Fields:

```text
id
name
message
whatsapp_template_name
whatsapp_template_language
created_by
created_at
updated_at
```

Create the Alembic migration only if the table does not already exist.

### Phase 3 — Template Backend API

Implement the template CRUD endpoints using existing FastAPI conventions.

### Phase 4 — Template Admin UI

Implement:

- template list
- create template
- edit template
- delete template if appropriate

### Phase 5 — Template Button in Existing Group Chat

Add the Template icon/button to the existing group chat.

Clicking it opens the template selector.

### Phase 6 — Template Selection

Admin selects a template.

Show the template in the existing composer/preview.

Admin clicks Send.

### Phase 7 — Group Template Send API

Implement:

```text
POST /api/groups/{group_id}/template
```

Backend:

1. Validate admin.
2. Validate group.
3. Validate template.
4. Get group members.
5. Create in-app messages.
6. Send WhatsApp template to eligible users.
7. Return summary.

### Phase 8 — WhatsApp Service

Implement the backend WhatsApp service and Meta Cloud API call.

Configure the required environment variables.

Test with one WhatsApp test number first.

### Phase 9 — WebSocket Push

Use the existing chat broadcaster so the new in-app template appears in connected user chat screens.

### Phase 10 — Testing

Use:

```text
1 admin
2 test users
1 test group
1 application template
1 approved WhatsApp template
```

Test:

```text
Admin creates template
        ↓
Admin opens group chat
        ↓
Admin clicks Template
        ↓
Admin selects template
        ↓
Admin clicks Send
        ↓
User 1 sees template in app
        ↓
User 2 sees template in app
        ↓
User 1 receives WhatsApp template
        ↓
User 2 receives WhatsApp template
```

Also test:

- user without WhatsApp number
- user not eligible for WhatsApp
- invalid WhatsApp number
- invalid template
- duplicate Send click
- unauthorized API call

---

## 28. Definition of Done

- [ ] Admin can create a message template.
- [ ] Admin can see all created templates.
- [ ] Admin can edit a template.
- [ ] Admin can open the existing group chat.
- [ ] Admin can click the Template icon.
- [ ] Admin can see available templates.
- [ ] Admin can select a template.
- [ ] Selected template appears in the composer/preview.
- [ ] Admin can click Send.
- [ ] The template is created as an in-app admin message for every group member.
- [ ] Users can see the template in their existing application chat screen.
- [ ] Existing WebSocket functionality is used for realtime updates.
- [ ] The backend sends the approved WhatsApp template to eligible group members.
- [ ] Users receive the template on their real WhatsApp.
- [ ] Users without a valid/eligible WhatsApp account are skipped without breaking the send.
- [ ] WhatsApp credentials remain server-side.
- [ ] Only admins can create/send templates.
- [ ] Existing chat and group functionality continues working.
- [ ] No Next.js/Supabase Realtime/new chat system is introduced.

---

## 29. Important Instructions for Claude

Before coding:

1. Inspect the current project.
2. Confirm the actual React + Vite + FastAPI architecture.
3. Find and reuse the existing group chat.
4. Find and reuse the existing user chat/message system.
5. Find and reuse the existing WebSocket broadcaster.
6. Find the existing group/member database models.
7. Find the existing admin authorization.
8. Check whether a template/message-template model already exists.
9. Check whether WhatsApp-related models/services already exist before creating duplicates.
10. Follow the existing project naming and folder conventions.

While coding:

1. Keep the feature simple.
2. Do not rebuild existing chat.
3. Do not rebuild groups.
4. Do not introduce Next.js.
5. Do not introduce Supabase Realtime.
6. Do not introduce Supabase Edge Functions.
7. Do not create a new WebSocket system.
8. Do not implement incoming WhatsApp messages.
9. Do not implement WhatsApp webhooks in this phase.
10. Do not implement WhatsApp admin replies in this phase.
11. Do not implement campaigns.
12. Do not implement scheduling.
13. Do not implement analytics.
14. Do not implement product deep links yet.
15. Do not implement WhatsApp media messages yet.
16. Keep WhatsApp credentials server-side.
17. Use the current Meta WhatsApp Cloud API documentation when implementing the API call.
18. Do not hard-code old Meta API versions or pricing.
19. Use SQLAlchemy + Alembic for database changes.
20. Use the existing FastAPI API structure.
21. Use the existing React/Vite UI components and styling.
22. Make the smallest changes necessary.

After implementation:

- Run backend tests.
- Run frontend tests/type checks if available.
- Run the Alembic migration.
- Test with two WhatsApp test users.
- Confirm both users receive the WhatsApp template.
- Confirm both users see the same template in the application.
- Confirm existing chat functionality still works.

---

## 30. Final Architecture

Keep the entire feature this simple:

```text
                    ADMIN
                      |
                      v
              Existing Group Chat
                      |
                Template Icon
                      |
                      v
              Select Template
                      |
                      v
                    Send
                      |
             +--------+--------+
             |                 |
             v                 v
       Existing Chat       FastAPI WhatsApp
          System               Service
             |                 |
             v                 v
       All Group Users    Meta WhatsApp API
             |                 |
             v                 v
       User App Chat      User Real WhatsApp
```

This is the **only feature to implement in this phase**.

Once this simple flow is stable, additional WhatsApp functionality can be added in a separate implementation phase.
