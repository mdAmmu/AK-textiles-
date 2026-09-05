# WhatsApp Business API — Complete Guide (AK Textiles)

A simple, plain-language reference for the WhatsApp Business API — built from all the questions we discussed. Use this to explain the API, message formats, the 24-hour rule, pricing, and the Carousel Template feature to other developers or the client.

> **Correction note:** Meta changed its pricing model on **July 1, 2025** — from *per-conversation* billing to **per-message** billing. This doc uses the current (per-message) model only.

---

## 1. What is the WhatsApp Business API?

It is Meta's official way for a business to send/receive WhatsApp messages **programmatically** (from an app/server) instead of a person typing on a phone. We use **Meta's Cloud API directly** (no third-party reseller/BSP), which is the cheapest, most direct option.

---

## 2. There Are Only 2 Ways to Send a Message

This is the most common confusion, so let's be precise: **Marketing / Utility / Authentication are NOT a 3rd message type** — they are sub-categories *inside* Templates.

```
WhatsApp messages
├── Session / Freeform  → FREE, only works inside the 24-hour window
└── Template             → PAID, works anytime (even cold, to anyone)
    ├── Marketing        → ≈ ₹1.02 / message
    ├── Utility          → ≈ ₹0.14 / message
    └── Authentication   → ≈ ₹0.14 / message
```

| Type | Use case | Cost (India) |
|---|---|---|
| **Session (Freeform)** | Replying to a customer who messaged you in the last 24h | Free |
| **Template — Marketing** | Cold outreach: promotions, new arrivals, offers, "today's product" pushes | ≈ ₹1.02/message |
| **Template — Utility** | Order status, shipping updates, appointment reminders, payment confirmations — tied to something the customer already engaged with | ≈ ₹0.14/message |
| **Template — Authentication** | OTP / login codes only — nothing else allowed | ≈ ₹0.14/message |

There is no hidden 4th category or cheaper tier.

---

## 3. Current Meta Pricing (India, per-message, post July 2025)

| Category | Meta base rate | + 18% GST | ≈ Final rate |
|---|---|---|---|
| Marketing | ₹0.8631 | + GST | **≈ ₹1.02** |
| Utility | ₹0.1150 | + GST | **≈ ₹0.14** |
| Authentication | ₹0.1150 | + GST | **≈ ₹0.14** |
| Freeform (inside 24h window) | — | — | **₹0 (Free)** |

**Important:** Meta doesn't let you just *label* a message as Utility to save money. Their reviewers read the actual content:
- ✅ Utility: order confirmations, shipping updates, "your item is back in stock" (tied to a real prior interaction)
- ❌ Not Utility: "check out today's product", promotions, general showcases — this is **Marketing**, no matter how short or plain the message is

Mislabeling risks rejection, silent re-categorization (you still pay the higher rate), or damage to your account's quality rating.

---

## 4. The 24-Hour Window Rule (explained simply)

Think of it like a support desk: once a customer messages you, WhatsApp opens a **24-hour "you may reply freely" window** for that specific customer. Inside it, you can send anything (text, images, whatever) for free. Once it closes, you're back to needing an approved template.

**Example with a clock:**
- Customer messages you at **10:00 AM** ("Is this jacket available?")
- Your free-reply window is open until **10:00 AM the next day**
- You can reply anytime in that window — text, 5 images, whatever — all free
- At **10:05 AM the next day**, the window is closed. A freeform message now gets **blocked** by WhatsApp (not charged — just rejected).
- If they message you again at 2:00 PM, a **brand-new 24-hour window** opens from that moment.

Key rules to remember:
- The window is **per-customer**, and always resets based on **when they last messaged you** — not when you last messaged them.
- **Only the customer sending you a message opens/reopens the window.** Just them *reading* your message does nothing.
- The window only limits **sending**. You can always **see/receive** any message a customer sends you, at any time — there's no window on receiving.
- This rule applies **always**, in test mode or production — it's a permanent anti-spam rule, not a testing restriction. (What test mode *does* restrict separately: you can only message numbers manually added to your "allowed test recipients" list until your app goes live.)

---

## 5. "Does This Cost Me Anything?" — Real Scenarios

| Scenario | Result | Cost |
|---|---|---|
| Customer messaged you within 24h, you reply with text/images | Delivered | **Free** |
| Customer hasn't messaged you in 24h+ (or never), you try to freeform-message them | **Blocked by WhatsApp** — never reaches them, no bill | **Free (it just fails)** |
| You send 3 images + 1 text to a customer inside their window | All delivered | **Free**, regardless of how many separate messages |
| Customer replies "I want 2 bundles" (opens a window), you reply "ok booked" | Delivered | **Free** |
| You proactively message a customer who never talked to you (cold, daily product push) | Needs an **approved Template** | **Paid** — ≈₹1.02 (Marketing) per message |
| You personally chat from your normal personal WhatsApp number (not the Business API number) | Unrelated to any of this | **Free**, no rules apply |
| You chat via Meta's WhatsApp Manager on the Business API number | Same rule as always | Free inside window / blocked outside |
| Your app has its own internal chat (not going through WhatsApp at all) | 100% internal, no Meta involved | **Always Free**, no 24h rule |
| Your app's chat calls the WhatsApp API behind the scenes | Same 24h rule applies | Free inside window / blocked outside |
| A brand-new customer messages you first, out of nowhere | Always accepted by Meta | **Free** to receive (but you only *see* it in your own app if a **webhook** is built — otherwise it lands in Meta's WhatsApp Manager only) |
| Building an in-app chat list to view/reply without opening WhatsApp | Feature itself costs nothing extra | Receiving is always free; sending replies follows the same 24h rule as always |

**Golden rule:** You are never silently billed. A message either (a) sends for free inside the 24h window, (b) gets blocked/rejected for free if outside the window and not a template, or (c) is a template and costs the rate in the table above.

---

## 6. Our Actual Business Case: Daily Proactive Product Push

Our real flow is: **we message the customer first**, daily, with product photos — before they've messaged us. This is **cold, business-initiated messaging** = Marketing category, and it **requires an approved Template** (freeform won't reach them).

Walkthrough:
1. **We send today's product photo to a customer who hasn't messaged recently** → fails with freeform. Needs a Marketing Template. **≈₹1.02/message**.
2. **Customer replies** "I want 2 bundles of it" → opens a 24h window. Free to receive.
3. **We reply** "ok booked" → inside their window → **Free**.

So: *the message that starts the conversation each day costs money and needs a template. Everything after the customer replies is free, as long as replies stay inside 24-hour gaps.*

---

## 7. Can a Template Hold 3 Images + Text + Link in ONE Message?

**No.** This is a **WhatsApp platform rule**, not a freeform-only limitation — it applies to both freeform and template messages:

> A single WhatsApp message (template or freeform) can have **at most 1 media item** in its header — one image, OR one video, OR one document. Never multiple, in a normal template.

What a *template* adds over freeform: it can combine 1 image + text + a real clickable **button** (not just a plain link) in one bubble.

**So a normal (non-carousel) template setup for "3 images + description" needs 3 separate template messages:**

| Approach | Messages needed | Cost per customer (Marketing) |
|---|---|---|
| 3 separate template messages (1 image each) | 3 | 3 × ₹1.02 ≈ **₹3.06** |
| Scaled to 100 customers/day | 300 messages | ≈ **₹306/day** (~₹9,180/month) |

This is expensive — which is exactly why the **Carousel Template** exists.

---

## 8. Product Messages vs. Carousel Templates

There are two related-but-different "multi-product" features. Don't confuse them.

### A. Product Messages (from a Catalog) — session-only, free
You upload products once to **Meta Commerce Manager** (name, price, photo, stock). Then instead of manually attaching images, you send a message that pulls live from the catalog.

**Example:** Customer asks "Is the Sweet Berfi available?" → you send a Product Message → they see a tappable card: photo, "Sweet Berfi — ₹190/box", in stock. If you update the price later, it updates everywhere automatically.

**Cost: Free** — but only works **inside the 24-hour window**, same as any freeform message. Does **not** solve cold outreach.

### B. Carousel Templates — the real cost fix ⭐
A **template** (needs one-time Meta approval, works even cold/outside the 24h window) showing **up to 10 scrollable product cards in a single message**.

> **The entire carousel is billed as ONE message, no matter how many cards it has.**

**Example matching our case:** Instead of 3 separate image messages (₹1.02 × 3 = ₹3.06), we build **one carousel template with 3 cards** — photo 1, photo 2, photo 3, each with its own caption/button — sent as **one API call**.

**Cost: ≈ ₹1.02 total** for all 3 photos together — a real **3x savings**.

### Comparison Table

| | Product Messages | Carousel Templates |
|---|---|---|
| Works outside 24h window (cold outreach)? | ❌ No | ✅ Yes |
| Cost | Free | ≈₹1.02 for up to 10 cards, billed as ONE message |
| Needs Meta approval? | No | Yes, one-time per template shape |
| Needs a Commerce Manager catalog? | Yes | No — a media-card carousel just needs images you upload directly |
| Live price/stock updates automatically? | ✅ Yes | ❌ No — text is fixed at send time |
| Best for | Replying to an engaged customer browsing products | Our daily/proactive multi-photo push to customers |

---

## 9. Carousel Template — Deep Dive (Our Chosen Feature)

### What it looks like
```
[ Body text: "Check out our new arrivals, {{1}}!" ]

 ┌─────────┐  ┌─────────┐  ┌─────────┐   ← customer swipes left/right
 │  IMAGE  │  │  IMAGE  │  │  IMAGE  │
 │ Photo 1 │  │ Photo 2 │  │ Photo 3 │
 │ Caption │  │ Caption │  │ Caption │
 │ [Button]│  │ [Button]│  │ [Button]│
 └─────────┘  └─────────┘  └─────────┘
       (all delivered + billed as ONE message)
```

### Features
1. **Multiple images, swipeable, in ONE message** — up to 10 photo cards, like a mini gallery in one chat bubble instead of separate stacked messages.
2. **Works cold** — reaches anyone, anytime, since it's a template (unlike freeform which needs an open 24h window).
3. **Billed as ONE message** regardless of card count (2 cards or 10 cards — same price).
4. **Reusable forever after one approval** — approve the shape once ("3 image cards + description"), then reuse it daily with new photos/text, no repeat review.
5. **Button per card** — each card can carry its own clickable button (e.g. "View Product").

### Rules & Hard Limits

| Limit | Value |
|---|---|
| Cards per carousel | 2 to 10 |
| Media per card | Exactly 1 (image OR video — not both, not mixed within one carousel) |
| Buttons per card | Up to 2 |
| Header text/formatting | Not allowed — image/video only, no styled text |
| Body variables | Must have real surrounding wording (can't be a lone `{{1}}`) |
| Card count per send | **Must exactly match the approved template's card count** — see below |

### Drawbacks (the real costs beyond money)
1. **One-time approval wait is unavoidable** — hours, sometimes 24–48h, before you can send even once.
2. **Structure is frozen once approved** — an approved "3 cards, 1 button each" template can't be tweaked (e.g. to 5 cards) without submitting a brand-new template and waiting again.
3. **No live pricing/stock** — unlike Product Messages, everything is static text you type; price changes must be updated manually each send.
4. **Rejection risk** — Meta can reject wording that looks spammy/misleading or mismatches the declared category.
5. **All cards must be structurally identical** — can't give card 1 a button and skip it on card 3, or vary the layout per card.
6. **Only reaches people already on WhatsApp** with that number — obvious, but worth stating.

### Exact Card Count Rule (important!)
An approved template's shape is **locked**. If you approved a **3-card** carousel, every send must supply **exactly 3 images** — no more, no fewer. Sending only 2 images against a 3-card template **fails immediately** (rejected by our own backend before it even reaches Meta — we validate `len(image_urls) == 3`).

**Two ways to handle products with fewer photos:**
- Reuse one image twice (e.g. same photo as card 1 and card 3, different angle for card 2) — no new approval needed.
- **Build a separate template for each card count** (e.g. a 2-card template *and* a 3-card template) — one more one-time approval, then reusable forever. *(This is what we implemented — the app lets you pick a 2-photo or 3-photo carousel and it uses the matching approved template.)*

### Does an approved template stay error-free forever?
Mostly yes for structure, but a send can still fail if:
- The image URL is broken/inaccessible at send time
- The recipient's number is invalid or not on WhatsApp
- Meta pauses/restricts a template if your account's quality rating drops (e.g. frequent blocks/reports)
- You send the wrong number of images (see above)

### How Many Different Carousel Templates Can We Have?
**As many as we want, in parallel** — no "one at a time" restriction. We can submit a 2-card, 3-card, and 5-card carousel all at once; Meta reviews each independently. The only ceiling is Meta's generous overall daily template-creation limit per business account (far beyond what we need).

**Practical approach:** create a few fixed-size templates once (2-card, 3-card, maybe 5-card) and pick whichever matches how many product photos we have that day — each is reusable forever after its one-time approval.

---

## 10. Cost Comparison — Our Exact Use Case (3 Product Photos + Description)

| Method | Messages sent | Cost per customer | 100 customers/day | 100 customers/month |
|---|---|---|---|---|
| Freeform (only works if customer messaged us in last 24h) | 4 (3 img + 1 text) | **Free** | Free (only reaches active chatters) | Free |
| 3 separate Marketing Templates (cold outreach) | 3 | ≈ ₹3.06 | ≈ ₹306/day | ≈ ₹9,180/month |
| **1 Carousel Template (3 cards)** ⭐ | 1 | **≈ ₹1.02** | **≈ ₹102/day** | **≈ ₹3,060/month** |

**The Carousel Template cuts cost roughly 3x** compared to sending the same 3 photos as separate templates — same reach, same content, same "cold" capability, much cheaper.

---

## 11. Ways to Reduce Cost Further

There's no way to get freeform-level cost (₹0) with template-level reach (cold, anytime) — that combination doesn't exist by design; it's exactly what the template system prevents (spam). But there are legitimate ways to cut real cost:

1. **Use Utility where it genuinely applies** (~7x cheaper: ₹0.14 vs ₹1.02) — only for genuinely transactional messages (order status, stock alerts tied to a prior interaction), never for promotional pushes.
2. **Get customers to message you first** — the biggest real lever. Once a customer messages you, every reply within 24h is free (images, product details, everything). A WhatsApp "click-to-chat" link on Instagram/website/packaging, or a QR code in-store, turns regular customers into a permanently free channel — no templates needed for them, ever.
3. **Use Carousel Templates for multi-image pushes** (this doc's main recommendation) — bundles multiple photos into one billed message instead of paying per image.
4. **WhatsApp Channels** — Meta's true free broadcast feature (unlimited followers, ₹0 cost), but one-way (no replies), no personalization, and no public API — must be posted manually from the WhatsApp Business app, not automatable from our application.
5. **WhatsApp Business App Broadcast Lists** — free, but capped at 256 contacts, requires each customer to have saved our number, and must be sent manually — not triggerable from our backend.

---

## 12. Webhooks — Seeing Customer Replies In-App

**Important gap to know about:** Meta always accepts and never blocks/charges for incoming customer messages. But whether **our own application** shows us that reply depends on a **webhook**, which is a separate feature (not yet built). Without it, replies are visible only in Meta's own **WhatsApp Manager** website, not inside our app. Building an in-app chat list to see/reply without opening WhatsApp is possible and adds no extra WhatsApp fee — it only changes *where* we see/reply, not what we're charged.

---

## 13. Quick Summary for Explaining to Others

- **2 message types exist:** Freeform (free, 24h window only) and Template (paid, works anytime — Marketing/Utility/Authentication are sub-categories of Template, not separate types).
- **Freeform is free** but only reaches customers who messaged us in the last 24 hours; otherwise it's blocked (never silently billed).
- **Our business model is cold outreach** (we message first, daily) → this requires **Templates**, which cost money.
- **One image per message is a hard platform rule** — true for both freeform and normal templates.
- **Carousel Templates break that limit** — up to 10 images in one message, billed as ONE message regardless of card count. This is our chosen solution: ~3x cheaper than sending images as separate templates.
- **Carousel card count is locked per template** — we maintain separate approved templates per card count (e.g. 2-card and 3-card) to match how many product photos we have.
- **Utility category can't be used to cheat pricing** — Meta enforces category by actual content, not by label.
- Real cost-saving levers: get customers to message first (free lane), use Utility only where genuinely transactional, and use Carousel Templates for multi-image cold pushes.
