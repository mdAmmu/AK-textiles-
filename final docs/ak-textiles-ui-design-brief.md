# AK Textiles — UI/UX Design Brief

> Design brief for generating a professional UI in Google Stitch. Describes the product, every screen, its data, states, and components as currently implemented, so the generated design matches real app structure and can be handed back to engineering directly.

---

## 1. What this app is

AK Textiles is a **private, WhatsApp-style broadcast + chat application for B2B product distribution** (fabrics/textiles). It replaces sending product catalogs and prices over WhatsApp with a purpose-built app that has one critical property:

> **Customers are organized into pricing groups (Dubai, South Africa, India, Local). When the admin broadcasts a product to a group, each customer sees it as an ordinary private chat message from "Admin" — with only their own group's price. Customers never see other customers, other groups, or other groups' prices.**

Two roles, two very different experiences:

- **Admin** — manages products (with 4 group-specific prices + up to 4 images), manages groups and customers, and chats with each group broadcast-style (like being the owner of several WhatsApp groups, one per pricing tier).
- **Customer (USER)** — a read-mostly participant in their own group's chat feed. They see everything admin sends to their group (text, images, products with their group's price) and can view/share media, but cannot send messages (broadcast is one-directional; only admins post into group chats).

Design personality: **clean, modern WhatsApp-like messaging UI**, trustworthy/professional B2B feel (not playful/consumer), mobile-first (PWA, installable on Android/iOS), light + dark mode both required.

---

## 2. Brand & tone

- App name: **AK Textiles**. Logo mark used today: an "AK" monogram badge.
- Tagline used on login: *"Quality Fabrics. Trusted by Generations."*
- Tone: professional textile trading business, not a flashy consumer app. Think WhatsApp Business crossed with a clean B2B ordering tool.
- Currency: ₹ (Indian Rupees) shown as "₹{price} / piece".
- Must support **light and dark themes** with a user-facing toggle (Sun/Moon switch) — not just OS-driven.
- Must feel like a native mobile app: bottom-anchored composer/nav, safe-area aware, installable as a PWA with install prompts on Android and iOS.

---

## 3. Roles & permissions

| Capability | Admin | Customer (USER) |
|---|---|---|
| View group chat feed | ✅ (all groups) | ✅ (own group only) |
| Send text/image/product into group chat | ✅ | ❌ (read-only, banner: "Only admins can send messages") |
| Create/edit/delete products | ✅ | ❌ |
| Broadcast product to group(s) | ✅ | ❌ |
| Create/delete groups, add/remove customers | ✅ | ❌ |
| See other customers or other groups | ✅ | ❌ never |
| Share/download media from chat | ✅ | ✅ (own group's media) |
| Toggle dark mode | ✅ | ✅ |

---

## 4. Information architecture / navigation

**Admin** (bottom nav, 2 tabs):
- **Chats** (`/admin`) — dashboard, list of group chats — this is the home screen
- **Groups** (`/admin/groups`) — customer/group management
- Products is reached from within these flows (not a separate bottom-nav tab in the current build, but should be treated as a primary section)

**Customer**: no nav bar at all — a single full-screen chat with their group, plus a profile screen.

**Routes:**

| Path | Screen | Role |
|---|---|---|
| `/login` | Login / Register (toggle) | public |
| `/redirect` | Role-based redirect (loading only) | any |
| `/admin` | Admin Dashboard (group chat list) | Admin |
| `/admin/groups` | Groups list | Admin |
| `/admin/groups/:id` | Group Detail (members) | Admin |
| `/admin/groups/:id/chat` | Group Chat (broadcast chat) | Admin |
| `/admin/groups/:id/chat/info` | Group Chat Info | Admin |
| `/admin/products` | Products list | Admin |
| `/admin/products/new` | Create Product (2-step) | Admin |
| `/admin/products/:id` | Product Detail | Admin |
| `/admin/products/:id/edit` | Edit Product | Admin |
| `/admin/products/:id/send` | Broadcast Confirm | Admin |
| `/admin/chats/:conversationId` | 1:1 Admin Chat (secondary/legacy path) | Admin |
| `/chat` | Customer group chat feed | User |
| `/chat/profile` | Customer profile | User |

---

## 5. Core data model (for realistic sample content)

- **User**: name, phone (+91), email (optional), role (ADMIN/USER), group.
- **Group**: name (Dubai / South Africa / India / Local — plus admins can create custom ones), description, customer_count, last_message_at, unread_count.
- **Product**: name, description, up to 4 images, 4 prices (dubai_price, south_africa_price, india_price, local_price).
- **Message**: type = TEXT | PRODUCT | IMAGE; belongs to a group (broadcast) or a 1:1 conversation; product messages carry a *snapshot* of product name/image/description/price at send time (so price history stays accurate even if the product's price changes later); supports edited/deleted state, grouped multi-image sends, read receipts.

Sample data to use in mockups: product names like "Cotton Voile 60\"", "Premium Silk Blend", "Georgette Print"; prices in the ₹80–₹500 range varying slightly per group; group names Dubai / South Africa / India / Local; customer names as realistic Indian/Gulf trader names.

---

## 6. Screens — detailed specs

For each screen: purpose, layout, key elements, states (loading/empty/error), and role.

### 6.1 Login / Register — `/login` (public)
Single screen, toggles between Login and Register mode.
- Branded header: "AK" monogram badge, "AK Textiles" wordmark, tagline.
- **Login mode**: Phone field (+91 prefix, phone icon), Password field (show/hide eye toggle), "Remember me" checkbox, "Forgot password?" link (decorative), primary CTA "Log In" with arrow icon, error banner on failed auth, link to switch to Register.
- **Register mode**: adds a Name field above phone.
- Submit shows a loading/disabled "Please wait..." state.
- Should read as trustworthy/secure (this is a business tool with real pricing data).

### 6.2 Splash & loading
- Full-screen branded splash (~2s) on app cold start.
- A generic centered loading spinner/state (`LoadingScreen`) is the default "data not ready yet" state used on nearly every screen below — design one reusable loading pattern.

### 6.3 Admin Dashboard — `/admin` (home)
This is the WhatsApp-style "chats list" screen, but each row is a **group**, not an individual person.
- Header: hamburger/menu icon (opens Account panel), page identity, avatar (opens Profile).
- Greeting: "Hello, {FirstName} 👋 — Good to see you again!"
- Search bar (search groups by name) + filter icon.
- "Your Groups" section: list of group rows — each shows a group icon/avatar, group name, "{n} members" or last message preview, timestamp of last activity, and an unread-count badge.
- Empty state: "No groups yet."
- Tapping a group row → Group Chat.

### 6.4 Admin — Account panel (slide-over/modal)
Triggered from Dashboard menu icon.
- Admin identity (avatar, name, contact).
- "Add Group" inline form (name + optional description).
- List of all groups with delete action (confirm dialog warns that removing a group logs out its members).
- Logout action (confirm dialog).

### 6.5 Admin — Profile screen (slide-over/modal)
Triggered from Dashboard avatar.
- Large avatar (branded), name, contact, short bio line.
- Dark-mode toggle row (Sun/Moon switch).
- Secondary static rows: Account, Privacy, Notifications, Storage and Data (present for structure/future use — can be styled as a simple settings list).

### 6.6 Groups list — `/admin/groups`
- Header "Groups" + "Create Group" button (present but currently disabled/tooltip "coming soon" — design it as a normal enabled primary action, since it represents a real near-term feature).
- Search bar.
- Grid/list of Group Cards: icon (distinct icon per group — e.g. building for Dubai, landmark for India, home for Local, mountain/other for South Africa — default people icon for custom groups), name, Active/Inactive status badge, customer count, chevron.

### 6.7 Group Detail (members) — `/admin/groups/:id`
- Header: back, group name + customer count, edit icon, more-options icon.
- Hero block: large group icon, name, status pill, customer count.
- "Members" section with "Add Customer" action (top and bottom).
- Member rows: avatar, name, phone/email, "Remove" button.
- Empty state: "No customers yet."
- **Add Customer modal**: search existing unassigned users to add to the group, OR create-and-assign a brand new customer (name, phone, password) inline.

### 6.8 Group Chat (broadcast chat) — `/admin/groups/:id/chat`
The most important admin screen — a full WhatsApp-style chat thread, admin-authored only.
- **Normal header**: back, tappable group identity (icon + name + member count → Group Chat Info), more-options icon.
- **Selection-mode header** (after long-pressing a message): cancel (X), selected count, Forward icon, Edit icon (only enabled when exactly one text message is selected), Delete icon.
- **Message feed**: date divider ("Today"), right-aligned admin bubbles. Message kinds:
  - Text bubble (with edited tag if applicable, timestamp, read-state ticks)
  - Image bubble — single image or a grid bubble (1–4 visible tiles, "+N" overlay when more) for multi-image sends, tappable to open a full-screen swipeable image viewer
  - Product bubble — product image, name, description, "₹{price} / piece"
  - Deleted-message placeholder ("You deleted this message", ban icon)
  - Long-press any message to enter selection mode (multi-select for delete/forward; single text message also allows edit)
- **Composer**: emoji icon (decorative), auto-growing text field, camera icon (stage multiple images with captions before sending), send button (icon swaps between mic/send based on content).
- **Editing bar**: appears above composer when editing an existing text message.
- **Forward preview bar**: shows staged images queued to forward/send, each removable.
- **Forward picker modal**: search + checkbox list of target groups, "Forward (N)" button.
- **Group Product Composer modal**: quick-create a product (currently image-only flow — up to 4 images) and send it straight into this group's chat, bypassing the full product/broadcast flow.

### 6.9 Group Chat Info — `/admin/groups/:id/chat/info`
WhatsApp-style "group info" screen.
- Hero: back, large group icon, group name, member count.
- Quick-action row: Audio, Video (decorative), Search (inline search toggle), Add Member.
- Expandable "View Members" list (avatar, name, contact) and a "Media, Links & Docs" row (chevron, placeholder for future).

### 6.10 Products list — `/admin/products`
- Header "Products" + "Create Product" link.
- Search + filter (decorative filter for now, but design as a real control).
- Grid of Product Cards: product image, name, "Send" button (jumps straight to Broadcast Confirm).
- Empty: "No products yet."

### 6.11 Create Product — `/admin/products/new` (2-step)
- **Step 1 — Details**: Product Name, Description (textarea), and the signature **4-row price grid**: Dubai / South Africa / India / Local, each a labeled numeric ₹ input. Submit creates the product.
- **Step 2 — Images**: 4-slot image upload grid (empty slots show an upload icon/placeholder; fills sequentially; disabled once all 4 are filled or during upload). "Done" returns to Products list.
- This 2-step flow (and the 4-price grid specifically) is the single most distinctive UI pattern in the app — design it carefully, it should feel fast and clear for a non-technical admin uploading catalogs regularly.

### 6.12 Edit Product — `/admin/products/:id/edit`
- Same image grid (pre-filled) above the same form (pre-filled), "Save Changes" CTA.

### 6.13 Product Detail — `/admin/products/:id`
- Header: back, "Product".
- Image gallery: large main image + thumbnail strip to switch active image ("No image" placeholder state if none uploaded).
- Info card: name, description, a clean **4-column price grid** (India / Dubai / South Africa / Local, showing "₹—" or "-" if unset).
- Actions: **Send** (primary, → Broadcast Confirm), Edit, Delete (destructive, confirm before navigating away).

### 6.14 Broadcast Confirm ("Send Product") — `/admin/products/:id/send`
This is the emotional payoff screen of the whole app — it should feel confident and clear, this is a business-critical action.
- Header: back, "Send Product".
- Product name + short hint text.
- Checkbox list of groups, each row showing: group name, customer count, and the resolved price for that group ("No price set" if missing) — togglable per group.
- Two actions: **Send (N)** — only checked groups (disabled if none selected) — and **Send to Everyone** (disabled if zero total customers).
- Sending state: buttons read "Sending...".
- **Success state** replaces the screen entirely: large checkmark, "Product sent successfully", "{total_sent} customers received the product.", "Done" → back to Products.

### 6.15 1:1 Admin Chat — `/admin/chats/:conversationId` (secondary path)
Standard two-party chat UI (header with customer name + "Online" status, message list, composer). Composer has extra icons: Package icon (open Product Picker to send a product into this 1:1 chat) and Camera icon (single image). Design consistent with the Group Chat bubble styles above, just addressed to one person instead of a group.

### 6.16 Customer Chat feed — `/chat` (Customer home)
The customer's entire app experience lives here — keep it extremely simple and calm.
- **Normal header**: group icon + group name, "More options" → Profile.
- **Selection-mode header** (long-press a message): cancel, count, Share (image messages only — native share sheet, or download fallback), Delete (own-device delete of the message from their view).
- Message feed: identical bubble system to Group Chat (text/image/product/deleted), but all messages are admin-authored and left-aligned as "received."
- **No text composer.** Instead, a fixed bottom bar reads: **"Only admins can send messages"** — this absence-of-input is intentional and should look deliberate/calm, not broken.
- Toast messages for share errors/unsupported actions.
- If their group is deleted by admin, they are force-logged-out back to `/login` (handle gracefully, e.g. a brief notice before redirect).

### 6.17 Customer Profile — `/chat/profile`
- Header: back.
- Hero: avatar, "{Name} (You)", phone/email.
- Dark-mode toggle row.
- **Media gallery**: grid of every image ever shared in their group chat, with count badge ("No media shared yet." empty state).
- Logout button (destructive/red, bottom of screen).

---

## 7. Shared components to design as a system

Design these once as reusable primitives — they appear across nearly every screen:

- **Avatar** — circular; photo if available, else colored initials (soft pastel palette, deterministic per user).
- **Message bubble family** — text bubble, image bubble (single), image grid bubble (2–4 up, "+N" overlay), product bubble (image + name + description + price), deleted-message bubble, date divider, read-receipt ticks (single = sent, double = read), "Edited" tag.
- **Group icon** — a small icon system for distinguishing groups at a glance (building/landmark/home/mountain/people), plus a larger "hero" variant for detail/info headers.
- **Composer bar** — emoji + growing text field + optional leading action icon(s) (camera/product) + trailing send/mic button.
- **Empty states** — friendly, illustrative (not just gray text) for: no groups, no customers, no products, no messages, no media.
- **Loading state** — one consistent pattern for "data not ready yet," used almost everywhere.
- **Modals/slide-overs** — bottom-sheet style for pickers (Forward Picker, Product Picker, Add Customer, Group Product Composer) and a full-screen slide-over style for Account/Profile panels.
- **Confirm dialogs** — for destructive actions (delete group, delete product, delete message, logout) — should clearly state consequence (e.g. "Members will be logged out").
- **Toast/inline notifications** — lightweight, bottom-anchored.
- **PWA install banner** — top-of-app banner with Install button (Android/Chrome native prompt) and an iOS-specific "Add to Home Screen" instructional modal (Share icon → steps). Dismissible, should not feel intrusive.
- **Bottom nav (admin only)** — 2 tabs, Chats / Groups.

---

## 8. States checklist per screen

For every list/data screen above, design three states explicitly: **loading**, **empty**, **populated** — plus **error** where a network action can fail (login, sending a message/product, broadcast). Broadcasting and sending are business-critical actions; their loading/success/failure states deserve the most polish (see 6.14).

---

## 9. What NOT to design

- No shopping cart, checkout, payments, or order-tracking UI (out of scope / not built).
- No group chat *between* customers — customers only ever see "Admin," never other members.
- No customer-side compose/send UI — customers are read + react (share/delete-locally) only.
- Avoid a generic "social app" feel — this is a B2B ordering/catalog tool wearing a chat UI, not a social network.

---

## 10. Deliverable expectations

Please produce, at minimum, high-fidelity screens (light + dark variants) for:
1. Login
2. Admin Dashboard (group chat list)
3. Group Chat (broadcast chat, normal + selection-mode header)
4. Group Detail (members)
5. Products list
6. Create Product (both steps: details + images)
7. Product Detail
8. Broadcast Confirm (input state + success state)
9. Customer Chat feed (with the "Only admins can send" bottom bar)
10. Customer Profile (with media grid)

Plus the shared component sheet from section 7 (avatars, bubbles, composer, empty states, modals) as a mini design system, so the rest of the screens in section 6 can be assembled consistently by engineering.
