# AK Textiles — Screen-by-Screen Description (for UI Redesign)

AK Textiles is a mobile-first (React + TypeScript + Vite, Tailwind CSS) private
broadcast + one-to-one chat app for a textile distribution business. It behaves
like a lightweight, purpose-built WhatsApp clone. There are three roles:
**Admin** (business owner), **Staff** (work inside a shared Group chat),
and **Customer/User** (has a private 1:1 chat with Admin, sees only their own
group's prices).

Current visual language: mostly white/light backgrounds, a blue accent
(`#2563eb`), soft rounded cards (`rounded-xl`/`rounded-2xl`), WhatsApp-style
chat bubbles, a purple/violet gradient login screen, and full dark-mode
support via CSS variables (`--wa-*`, `--chat-*`). Layout is a single-column
mobile app shell (`h-dvh` full height, sticky header, scrollable body, often a
bottom nav or bottom input bar).

Use this doc as the raw material to paste into an AI design tool — describe
what each screen does today, so the redesign can reimagine layout, spacing,
color system, typography, and component style while keeping the same
functionality and information hierarchy.

---

## 1. Auth / Onboarding

### Splash Screen (`components/common/SplashScreen.tsx`)
- First screen users see when the app loads (not shown again once logged in — auto-skips to loading state if a token exists).
- Full-screen image-based intro (`splash-1.png`) with a pink/magenta gradient "Get Started" pill button (bottom, with arrow icon).
- Tapping "Get Started" cross-fades to a second full-screen image (`splash-2.png`) with a custom 12-spoke radial loading spinner and "Loading…" text, then auto-advances after 2s.
- Purely a branding/onboarding moment — no user input besides the one button.

### Login (`pages/Login.tsx`)
- Entry point for all roles. White background with soft violet circular line-art decorations in the corners.
- Centered logo + "A.K Textiles" wordmark, small diamond/line divider, "Welcome back" heading, subtitle.
- Card-style form: a **10-digit phone number entered as 10 separate single-digit boxes** (auto-advances focus, supports paste), then a password field with show/hide eye icon toggle.
- "Remember me" checkbox + "Forgot password?" link (not yet functional).
- Primary CTA: full-width gradient purple button "Sign in securely".
- Footer note: "Don't have access yet? Contact your distributor administrator." — there is no self-serve signup; accounts are admin-provisioned.
- Error text renders inline above the submit button on failed login.

### Role Redirect (`pages/RoleRedirect.tsx`)
- Invisible routing screen — checks current user, sends Admins to `/admin/chats` and everyone else to `/chat`. No UI of its own (renders `LoadingScreen` while resolving).

---

## 2. Admin — Home Shells & Navigation

### Admin Chats Home (`pages/AdminChatsHome.tsx`)
- Admin's default landing screen. Gradient light-blue background (`#eaf0ff → white`).
- Sticky header (`AdminHomeHeader`) with admin name, menu icon (opens Account panel), profile avatar (opens Profile screen), and a search bar filtering by customer name.
- Scrollable list of 1:1 conversations as rounded white cards (`ChatListItem`), live-updated via WebSocket (new message bumps to top, updates unread badge).
- Empty state: message-circle icon + friendly copy.
- Floating action button (bottom-right, circular blue) — "Start new chat" — opens `StartChatPanel` to pick an existing customer to begin chatting with.
- Bottom tab bar (`BottomNav`) for switching between Admin's Chats / Groups / Broadcast / Products sections (inferred from other screens).

### Admin Dashboard / Groups Home (`pages/AdminDashboard.tsx`)
- Same header/gradient/search shell as Chats Home, but lists **Groups** (staff group chats) instead of conversations, via `GroupChatListItem`.
- "Your Groups" section label + overflow menu (⋮) opening `GroupManagementPanel` (create/delete groups).
- Empty state CTA: "Create Group" pill button.

### Admin Broadcast Home (`pages/AdminBroadcastHome.tsx`)
- Same shell again, lists **Broadcast Audiences** (named recipient lists) as white rounded rows with a radio-tower icon, name, recipient count, and last-updated timestamp.
- Overflow menu opens `BroadcastManagementPanel`. Empty state explains the broadcast concept and offers "Create Broadcast".
- Row tap → `BroadcastAudienceInfo` (per-audience info/detail screen); presumably a "+" elsewhere leads to `BroadcastComposer` (create flow).

### Admin Profile Screen (`components/admin/AdminProfileScreen.tsx`) — modal/overlay
- Full-screen overlay (not a route) opened from any admin home header.
- Blue gradient hero card with back button, large circular avatar (logo) overlapping the card boundary, admin name, phone/email, "Active" + role pills.
- `DetailsCard` block: Full Name, Email, Phone, Role.
- Settings-style rows: Theme (with toggle), Account, Privacy, Notifications, Storage and Data (chevron rows, mostly stubbed for now).
- Destructive "Logout" button (red) at the bottom, with a confirmation modal dialog.

---

## 3. Admin — Products

### Products List (`pages/Products.tsx`)
- WhatsApp-style header bar (`--wa-header` dark green/teal by convention) titled "Products" with a "+ Create Product" pill button.
- Search bar row + disabled/stub "Filter" button.
- 2-column responsive grid of `ProductCard`s (image + name/price presumably).
- Empty state: simple centered text.

### Product Detail (`pages/ProductDetail.tsx`)
- Header with back button + "Product" title.
- White card: square hero image with a horizontal thumbnail strip to switch between up to 4 product images.
- Info card: product name, optional description, then a **2×2 pricing grid** showing India / Dubai / South Africa / Local prices (this is the core "group pricing" feature of the app).
- Three equal-width action buttons: **Send** (to `BroadcastConfirm` flow), **Edit**, **Delete** (color-coded blue/blue/red).

### Create Product (`pages/CreateProduct.tsx`)
- Header + `ProductForm` (name, description, 4 regional prices — component not read in full but referenced consistently).
- After first save, switches to an `ImageUploadGrid` step ("Now add up to 4 images") with a "Done" button — two-step creation flow (data first, then images).

### Edit Product (`pages/EditProduct.tsx`)
- Same header pattern; shows `ImageUploadGrid` above the pre-filled `ProductForm`, single "Save Changes" submit (single-step, unlike Create).

---

## 4. Admin — Broadcasts

### Broadcast Composer — New Broadcast (`pages/BroadcastComposer.tsx`)
- Header "New Broadcast" with back arrow.
- Form: broadcast Name input, a "Recipients" button that opens `BroadcastRecipientPicker` (choose whole Groups and/or individual Users), selected recipients shown as removable chips.
- Helper copy explaining that a broadcast is NOT a group — it fans out as individual private messages.
- Sticky bottom "Create Broadcast" button showing live recipient count.

### Broadcast Confirm / Send Product (`pages/BroadcastConfirm.tsx`)
- Reached from Product Detail's "Send" action — this is product-specific broadcasting (distinct from the named-audience broadcast above).
- Header "Send Product"; product name + instruction text.
- Checklist of Groups, each row showing group name, customer count, and resolved price (or "No price set"), selectable via checkbox, highlighted green when checked.
- Two CTAs: "Send (N)" for selected groups, or "Send to Everyone".
- Success state: full-screen centered check-circle icon, "Product sent successfully", sent count, "Done" button back to Products.

### Broadcast Audience Info (`pages/BroadcastAudienceInfo.tsx`)
- Same "hero card" pattern as other info screens: blue gradient header, back button, large icon avatar (radio-tower), audience name, recipient count, status pills ("Active"/"Empty", "Broadcast Audience").
- Two pill action buttons: Search, Add Member.
- Inline search bar (toggle).
- Expandable/collapsible sections in a white rounded card: **Delivery Stats** (2×2 stat grid: Broadcasts Sent, Delivered %, Read %, Failed) and **View Members** (avatar rows with remove/X button per member).
- "Add Member" opens `MultiAddMembersPanel` — pick from existing customers or create new customer accounts inline (name/phone/password), shows if a candidate is already in another audience.

### Broadcast Detail / message thread (`pages/BroadcastDetail.tsx`)
- One specific broadcast send-job's status page. Header "Broadcast message".
- The broadcast text rendered as a chat-bubble-style block.
- 2×2 stat cards: Recipients, Delivery (sent/total + %), Read (read/sent + %), Failed (highlighted red if >0).
- Conditional banners/actions: "Sending…" note + "Cancel broadcast" button while in-flight; "Retry failed" button when failures exist.
- Per-recipient list: avatar, name, failure reason (if any), status label (Pending/Sent/Failed/Cancelled) + "· Read" suffix — auto-polls every 2.5s while sending.

### Broadcast Message Info (`pages/BroadcastMessageInfo.tsx`)
- Uses the shared `MessageInfoScreen` (see Shared Components) to show a single broadcast message's bubble plus "Read by" / "Not read by" recipient lists with read timestamps — mirrors WhatsApp's "message info" screen but for a broadcast.

---

## 5. Admin — Groups (Staff Group Management)

### Groups List (`pages/Groups.tsx`)
- WA-style header "Groups" with a disabled "Create Group" button (marked "coming soon" for custom groups — the 4 pricing groups are presumably fixed/seeded).
- Search bar, then `GroupList` of existing groups.

### Group Detail — admin management view (`pages/GroupDetail.tsx`)
- Header: back, group name + member count, edit icon, overflow menu.
- White card summary: group icon, name, Active/Inactive badge, member count.
- "Members" section header with "+ Add Staff" link; list of `CustomerRow`s with remove action.
- Bottom sticky "+ Add Staff" button; opens `MultiAddMembersPanel` scoped to Staff role.
- (Note: naming is slightly overloaded — "Members" here are Staff assigned to the group, distinct from the Group's Customers.)

### Group Chat Info — info/profile panel for a group chat (`pages/GroupChatInfo.tsx`)
- Same hero-card pattern: gradient header, large group icon, name, member count, status pills ("Active/Inactive", "Group Chat").
- Two action pills: Search, Add Member (+ inline search bar).
- `DetailsCard`: Group Name, Members count, Unread count, optional Description.
- Expandable rows: **Media, Links & Docs** (3-column image grid of all images shared in the group) and **View Members** (avatar rows, remove button).
- "Add Member" via `MultiAddMembersPanel` (Staff role).

### Group Message Info (`pages/GroupMessageInfo.tsx`)
- Same shared `MessageInfoScreen` component as broadcasts — shows one group message's bubble (text/image/document/product variants) and per-member "Read by"/"Not read by" lists.

---

## 6. Admin — 1:1 Chat

### Admin Chat thread (`pages/AdminChat.tsx`)
- The actual chat screen for an admin talking to one customer. Standard chat page shell: header (customer name, online/last-seen subtitle, tap to open `CustomerChatInfo`), scrollable `MessageList`, bottom `MessageInput`.
- **Selection mode**: long-press a message to multi-select; header swaps to an X (cancel) + count + Reply/Forward/Delete icon buttons.
- Reply preview bar and staged-image preview bar appear above the input when composing.
- Attachment sheet: Document, Camera, Gallery (Product picker exists in code but is currently disabled).
- Supports sending text, multiple images (with optimistic "pending" bubbles), and documents; live updates via WebSocket for new messages, read receipts, presence (online/last-seen), and soft-deletes.
- `ForwardPicker` modal to forward selected messages to Groups.

### Customer Chat Info (`pages/CustomerChatInfo.tsx`)
- Hero card (gradient blue, back button) with large avatar, customer name, phone, "Customer" status pill.
- `DetailsCard`: Name, Phone, Customer Since (joined date).
- Expandable "Media, Links & Docs" section (image grid) — same pattern as group info screens.

---

## 7. Staff & Customer (non-admin) Flows

### User Chat router (`pages/UserChat.tsx`)
- Not a visible screen — decides whether the logged-in non-admin user sees `StaffGroupChat` (if assigned to a Group) or `CustomerChat` (if not). Purely routing logic.

### Customer Chat — customer's home screen (`pages/CustomerChat.tsx`)
- A customer's only screen: private 1:1 chat with "AK Textiles"/Admin. Header shows brand icon + "AK Textiles" title, overflow menu → `UserProfile`.
- Same message list / input / attachment pattern as Admin Chat, but scoped to "my conversation" endpoints; selection mode supports Reply + Delete (no Forward, since customers can't forward to groups).
- Receives broadcast messages indistinguishably from direct admin messages (an intentional design choice — broadcasts are private, not a group).

### Staff Group Chat (`pages/StaffGroupChat.tsx`)
- Home screen for Staff members: a real multi-member group chat (every member sees every other member's messages — unlike the broadcast model).
- Header shows group icon + name, overflow menu.
- Extra feature vs. other chat screens: **image sharing** to device (share/download selected images via Web Share API) with a toast notification, alongside the standard select/reply/delete pattern.
- If the group itself is deleted by an admin while a staff member is inside it, they're force-logged-out back to Login.

### Group Chat — full staff/group chat thread with editing (`pages/GroupChat.tsx`)
- The richest chat screen: adds message **editing** (`EditingMessageBar`), a **Product Composer** for sending structured product cards into the group, plus the standard Reply/Forward/Delete/attachments seen elsewhere, and a `SelectionMenu` for bulk actions.
- Appears to be the canonical/shared group chat implementation (StaffGroupChat may be a simplified variant or an older/alternate version — worth clarifying with the codebase owner during redesign).

### User Profile (`pages/UserProfile.tsx`)
- Non-admin profile screen (Staff/Customer). Simple back header, large avatar, name "(You)", phone/email.
- Sectioned rows (each separated by a thick 8px gutter): Theme toggle row, Media grid (all images user has sent/received), Logout button (red).

### Coming Soon (`pages/ComingSoon.tsx`)
- Generic placeholder screen (header + back button + construction icon + "Coming Soon" message) used for features not yet built — a reusable stub, title passed as a prop.

### WhatsApp Send / integration test tool (`pages/WhatsAppSend.tsx`)
- Looks like an internal/admin testing utility for an external WhatsApp Business API integration (send text/image/carousel messages by phone number, upload images, pick carousel card count 3-10, view template/carousel approval status).
- Note: per project memory, AK Textiles' core chat is its OWN homegrown system, NOT WhatsApp Business API — this screen is a separate, secondary integration/tool, not the main chat experience. Flag this to the redesign AI so it doesn't get conflated with the primary chat UI.

---

## 8. Shared / Common Components

### Loading Screen (`components/common/LoadingScreen.tsx`)
- Minimal centered loading indicator, used as a fallback across nearly every async screen.

### Message Info Screen (`components/chat/MessageInfoScreen.tsx`)
- Reusable full-screen overlay: shows one message bubble (right-aligned, faux chat-pattern background) plus two lists — "Read by" (green check-check icon, avatar + relative read time) and "Not read by" (grey single-check icon, avatar only). Powers both Group Message Info and Broadcast Message Info.

### Reply Preview Bar / Forward Preview Bar (`components/chat/ReplyPreviewBar.tsx`, `ForwardPreviewBar.tsx`)
- Small bars that appear above the message input: one shows the message being replied to (with cancel), the other shows staged images queued to send (with per-image remove).

### Image Viewer Modal (`components/chat/ImageViewerModal.tsx`)
- Full-screen image lightbox/preview, presumably triggered by tapping any image bubble or media-grid thumbnail across the app.

---

## Redesign considerations to flag to the AI tool

- **Repeated patterns worth turning into a strong, consistent design system**: the "hero gradient card" info screen (used for Broadcast Audience Info, Group Chat Info, Customer Chat Info — all near-identical structurally), the chat page shell (header + message list + input, reused ~5 times), and the `DetailsCard`/stat-grid components.
- **Two competing color systems currently coexist**: a blue (`#2563eb`) gradient system for admin "home"/info screens vs. a `--wa-*` (WhatsApp-teal-style) CSS variable system for Products/Groups list screens vs. a violet/pink gradient on Login/Splash. A redesign should likely unify these into one cohesive palette.
- **Role-specific entry points** (Admin vs. Staff vs. Customer) land on different home screens — worth deciding whether the redesign keeps three distinct home experiences or unifies more of the shell.
- Dark mode is already implemented throughout via Tailwind arbitrary values / CSS variables — the redesign should preserve or improve on this, not drop it.
- Mobile-first, single-column, `h-dvh` full-height shells — this is a phone-oriented PWA-like app, not a responsive desktop-first layout.
