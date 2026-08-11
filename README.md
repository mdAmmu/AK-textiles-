# AK Textiles

A private WhatsApp-style broadcast + one-to-one chat application for product distribution.

Admin creates products with **4 group prices** (Dubai / South Africa / India / Local) and broadcasts
them — the backend fans each broadcast out into **private, per-customer messages** with the price
resolved server-side from that customer's group. Customers only ever see a normal 1:1 chat with
"Admin" — they never see other customers, groups, or prices that aren't their own.

See [`implementation.md`](./implementation.md) for the full original design/architecture doc this
app was built from.

---

## Tech stack

| Layer          | Tech                                              |
|-----------------|----------------------------------------------------|
| Frontend        | React + TypeScript (Vite)                          |
| Backend         | FastAPI (Python)                                    |
| Database        | PostgreSQL (hosted on Supabase)                     |
| Realtime        | WebSockets (FastAPI native)                          |
| Auth            | Clerk (Google sign-in for now, phone OTP planned)    |
| Image storage   | Supabase Storage (public bucket `product-images`)    |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+ (project was built/tested on 3.14)
- A **Supabase** project (free tier is fine) — for Postgres + Storage
- A **Clerk** application (free tier is fine) — for auth

---

## 1. Clone and get API keys

You'll need three sets of credentials before anything runs:

### Supabase
1. Go to https://supabase.com → sign in → your project (or create one)
2. **Project Settings → Database** → copy the **Connection string** (URI). You'll turn
   `postgresql://...` into `postgresql+psycopg://...` (see `backend/.env.example`)
3. **Project Settings → API** → copy the **Project URL**, **anon public key**, and **service_role key**

### Clerk
1. Go to https://clerk.com → your application → **API Keys**
2. Copy the **Publishable key** (`pk_...`) and **Secret key** (`sk_...`)
3. Under **Configure → SSO Connections**, make sure **Google** is enabled (this app currently signs
   in via Google only — phone OTP is a planned future step, see `implementation.md`)

---

## 2. Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend\.env` (copy `backend\.env.example` and fill in your real values):

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

CORS_ORIGINS=["http://localhost:5173"]
```

Run the database migrations (creates all tables in your Supabase Postgres):

```powershell
alembic upgrade head
```

Seed the 4 default groups (one-time — skip if they already exist):

```powershell
python -c "
from app.core.database import SessionLocal
from app.models.group import Group

db = SessionLocal()
for n in ['Dubai', 'South Africa', 'India', 'Local']:
    if not db.query(Group).filter(Group.name == n).first():
        db.add(Group(name=n))
db.commit()
db.close()
print('Groups seeded')
"
```

Run the backend:

```powershell
uvicorn app.main:app --reload
```

- API root: http://localhost:8000
- Interactive API docs (Swagger UI): http://localhost:8000/docs — good for testing endpoints directly

---

## 3. Frontend setup

```powershell
cd frontend
npm install
```

Create `frontend\.env` (copy `frontend\.env.example` and fill in your real values):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(Use the **same** Clerk publishable key as the backend's `CLERK_PUBLISHABLE_KEY`.)

Run the frontend:

```powershell
npm run dev
```

Open http://localhost:5173

---

## 4. First-time login: making yourself Admin

Every new Google sign-in becomes a plain `USER` with no group. To use the admin dashboard, you need
to manually promote your own account to `ADMIN` once, in the database:

1. Sign in once at http://localhost:5173 with the Google account you want to be admin
2. Run this from `backend/` (with the venv active):
   ```powershell
   python -c "
   from app.core.database import SessionLocal
   from app.models.user import User, UserRole

   db = SessionLocal()
   u = db.query(User).filter(User.email == 'YOUR_EMAIL@gmail.com').first()
   u.role = UserRole.ADMIN
   db.commit()
   print(u.name, '->', u.role)
   db.close()
   "
   ```
3. Refresh the app — you should now land on `/admin` instead of `/chat`

To test the **customer side**, sign in with a *different* Google account in an incognito window —
it'll default to `USER` and land on `/chat`. Use `/admin/groups` to assign that test customer to a
group so broadcasts/prices work for them.

---

## 5. Running both together

You need **two terminals** running at once:

```powershell
# Terminal 1 — backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

Then open http://localhost:5173.

⚠️ **Only run one backend instance at a time.** Running two `uvicorn` processes bound to the same
port causes confusing bugs (stale code answering requests, WebSocket duplication). If something
seems inconsistent after a code change, check for duplicates:

```powershell
Get-CimInstance Win32_Process -Filter "name='python.exe'" | Select-Object ProcessId, CommandLine
```

and stop extras with `Stop-Process -Id <id> -Force`.

---

## 6. Testing on your phone (same WiFi)

1. Find your computer's LAN IP:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' }
   ```
2. Update `frontend\.env`: `VITE_API_BASE_URL=http://YOUR_LAN_IP:8000`
3. Update `backend\.env`: add `"http://YOUR_LAN_IP:5173"` to `CORS_ORIGINS`
4. Restart both servers, but bind them to all interfaces:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   npm run dev -- --host 0.0.0.0
   ```
5. On your phone (same WiFi network), open `http://YOUR_LAN_IP:5173`

Note: if your WiFi network changes, your LAN IP changes too — repeat steps 1–3.

---

## Project structure

```
backend/
  app/
    api/            # REST endpoints (auth, users, groups, products, chats)
    core/           # config, database session, Clerk token verification, Supabase client
    models/         # SQLAlchemy models (users, groups, products, conversations, messages)
    schemas/        # Pydantic request/response schemas
    services/       # business logic (chat, broadcast)
    websocket/      # WebSocket connection manager + /ws/chat endpoint
    main.py         # FastAPI app entrypoint
  alembic/          # database migrations

frontend/
  src/
    components/
      chat/         # shared chat UI (bubbles, product cards, message input, chat header)
      admin/         # admin-only UI (product cards, group cards, chat list, nav)
      common/         # Avatar, LoadingScreen, ProtectedRoute
    pages/          # one file per route (Login, UserChat, AdminDashboard, Products, Groups, ...)
    services/       # API client wrappers (auth, chat, products, groups, broadcast, socket)
    hooks/          # useCurrentUser, useChatSocket
    types/          # shared TypeScript types
```

---

## How broadcasting works (the core feature)

1. Admin creates a product with 4 group prices and up to 4 images (`/admin/products/new`)
2. Admin taps **Send** on a product → sees a preview of how many customers are in each group and
   at what price (`/admin/products/:id/send`)
3. On confirm, the backend (`broadcast_service.py`) loops through each group, finds its customers,
   and creates a **private** product message in each customer's own conversation — with the price
   resolved server-side from their group (never trusted from the client)
4. Each customer only ever sees their own conversation with "Admin" — they never know the other
   groups or customers exist

---

## Current status

All 9 of the 10 planned phases are implemented (see `implementation.md` section 33 for the original
roadmap): auth, groups/users, 1:1 chat, WebSocket realtime, product management, product messages in
chat, the broadcast engine, and WhatsApp-style polish (read receipts, unread badges, search). Phase
10 (Docker, HTTPS, production database, monitoring, deployment) has not been started yet — this app
is currently only set up for local development.
