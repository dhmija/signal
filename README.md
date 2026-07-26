<div align="center">

# Signal

**A full-featured, open-source Signal Desktop clone — real-time messaging, group chats, read receipts, and a pixel-accurate dark UI.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?logo=python)](https://python.org)

[**Live Demo**](https://signal.vercel.app) · [**Report a Bug**](https://github.com/dhmija/signal/issues) · [**Request a Feature**](https://github.com/dhmija/signal/issues)

</div>

---

## Overview

Signal is a full-stack messenger application that closely replicates the Signal Desktop experience — the conversation list, message bubbles, read receipts, typing indicators, group management, and the privacy-focused dark UI that Signal is known for.

The backend is a clean FastAPI service with WebSocket support for real-time delivery. The frontend is a feature-based Next.js application with TanStack Query managing server state and Zustand managing client state. Everything persists in SQLite — ready to swap to PostgreSQL with a single connection string change.

---

## Features

### Messaging
- **Real-time 1:1 messaging** over WebSockets with instant delivery
- **Group conversations** — create groups, add/remove members, admin controls
- **Read receipts** — single ✓ (sent), double ✓✓ (delivered), teal ✓✓ (read)
- **Typing indicators** — animated dots while the other party is typing
- **Optimistic UI** — messages appear instantly, reconcile with server in background
- **Quoted replies** — tap any message to reply with context
- **Emoji reactions** — react to any message with ❤️ 👍 😂 😮 😢 🙏
- **Disappearing messages** — per-conversation timer, server-enforced expiry
- **File & image attachments** — drag-and-drop upload with inline preview

### Conversations
- Conversation list sorted by most recent activity
- Unread count badges and last-message preview
- Search across conversations and contacts
- Add contacts, start direct or group conversations
- Online / last-seen indicators

### User Experience
- Dark mode (default) and light mode with no flash-of-wrong-theme
- Responsive layout — full sidebar on desktop, drawer on mobile
- Keyboard shortcuts (`Ctrl+K` search, `Escape` close, `↑` edit last message)
- Notification toasts for incoming messages when the window is not focused
- Settings panel — Profile, Privacy, Notifications, Appearance

---

## Screenshots

> Screenshots will be added once the full UI is complete.

| Conversations | Group Chat | Registration |
|---|---|---|
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## Tech Stack

### Frontend

| Tool | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) (App Router) | Framework, routing, SSR |
| [React 19](https://react.dev) | UI library |
| [Tailwind CSS v4](https://tailwindcss.com) | Primary styling system |
| [shadcn/ui](https://ui.shadcn.com) | Dialog, Dropdown, Sheet, ScrollArea, Popover, ContextMenu |
| [Zustand v5](https://zustand-demo.pmnd.rs) | Auth store, UI state, WebSocket state |
| [TanStack Query v5](https://tanstack.com/query) | Server state, caching, background refetch |
| [React Hook Form](https://react-hook-form.com) + [Zod v4](https://zod.dev) | Forms and validation |
| [Framer Motion](https://www.framer.com/motion/) | Transitions, message animations, toasts |
| [Lucide React](https://lucide.dev) | Icons |

### Backend

| Tool | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com) | HTTP + WebSocket API |
| [SQLAlchemy 2.x](https://www.sqlalchemy.org) | ORM (sync) |
| [Alembic](https://alembic.sqlalchemy.org) | Database migrations |
| [SQLite](https://sqlite.org) | Database (swappable to PostgreSQL) |
| [python-jose](https://github.com/mpdavis/python-jose) | JWT encoding/decoding |
| [passlib\[bcrypt\]](https://passlib.readthedocs.io) | Password hashing |
| [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) | Environment-based configuration |

---

## Architecture

```
signal/
├── backend/
│   ├── main.py                  # App factory, CORS, lifespan
│   ├── database.py              # SQLAlchemy engine and session
│   ├── core/
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── security.py          # JWT utilities, password hashing
│   │   └── deps.py              # FastAPI dependency providers
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── services/                # Business logic (routers delegate here)
│   ├── routers/                 # Thin HTTP layer
│   ├── websocket/
│   │   ├── manager.py           # Connection registry (user_id → socket)
│   │   ├── events.py            # Typed event constants and payload shapes
│   │   └── handlers.py          # Per-event business logic
│   ├── seed.py                  # Realistic seed data
│   └── alembic/                 # Database migrations
│
└── frontend/
    └── src/
        ├── app/                 # Next.js App Router pages and layouts
        │   ├── (auth)/          # Login, register — centered layout
        │   └── (app)/           # App shell — sidebar + chat panel
        ├── features/            # Feature-scoped code
        │   ├── auth/            # Login, register forms and hooks
        │   ├── conversations/   # Sidebar, conversation list
        │   ├── messages/        # Chat panel, bubbles, input, reactions
        │   ├── contacts/        # Contact search and management
        │   ├── groups/          # Group creation and member management
        │   └── settings/        # Profile, privacy, appearance panels
        ├── providers/           # QueryProvider, AuthProvider, SocketProvider
        ├── store/               # Zustand stores (auth, ui, socket)
        ├── services/            # Typed fetch wrapper (api.ts)
        ├── types/               # Shared TypeScript types
        ├── lib/                 # cn(), formatRelativeTime(), constants
        └── styles/
            └── globals.css      # Tailwind v4 + Signal design system (oklch)
```

### Data Flow

```
Browser ──REST──► FastAPI routers ──► Services ──► SQLAlchemy ──► SQLite
       ◄──JSON──                                                  
       
Browser ──WS──► WebSocket endpoint ──► handlers.py ──► manager.py ──► broadcast to participants
```

Routers are intentionally thin — they validate input via Pydantic and delegate all logic to service functions. This keeps routers testable in isolation and makes the business rules easy to find.

---

## Database Schema

```sql
users               -- Accounts, profile, online status
contacts            -- Bidirectional contact relationships
conversations       -- Covers both direct (1:1) and group
conversation_members -- Many-to-many with role (member | admin)
messages            -- All messages, with optional reply_to_id
message_status      -- Per-user delivery/read status
attachments         -- Files linked to messages
reactions           -- Emoji reactions linked to messages
```

Full schema with column definitions in [`backend/alembic/versions/`](backend/alembic/versions/).

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm (`npm install -g pnpm`)

### 1. Clone

```bash
git clone https://github.com/dhmija/signal.git
cd signal
```

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the environment template
cp .env.example .env
# Edit .env and set SECRET_KEY to a random 32-byte hex string:
# python -c "import secrets; print(secrets.token_hex(32))"

# Start the server (creates the database automatically in development)
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Copy the environment template
cp .env.example .env.local

# Start the dev server
pnpm dev
```

Open `http://localhost:3000`.

### 4. Seed Data (optional)

```bash
cd backend
python seed.py
```

This creates 8 users, 8 conversations, and ~120 messages so the app is immediately usable without manual setup.

> **Default OTP for registration:** `123456`  
> Phone verification is mocked — any account uses this code.

---

## Environment Variables

### Backend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./signal.db` | SQLAlchemy connection string |
| `SECRET_KEY` | _(required in production)_ | JWT signing key — generate with `secrets.token_hex(32)` |
| `ENVIRONMENT` | `development` | Set to anything else to disable auto `create_all` |
| `ALLOWED_ORIGINS` | `["http://localhost:3000"]` | CORS allowed origins (JSON array) |
| `JWT_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account, returns JWT |
| `POST` | `/auth/login` | — | Authenticate, returns JWT |
| `GET` | `/auth/me` | ✓ | Current user profile |
| `GET` | `/contacts` | ✓ | List contacts |
| `POST` | `/contacts` | ✓ | Add a contact by username |
| `DELETE` | `/contacts/{id}` | ✓ | Remove a contact |
| `GET` | `/conversations` | ✓ | List conversations |
| `POST` | `/conversations` | ✓ | Create direct or group conversation |
| `GET` | `/conversations/{id}/messages` | ✓ | Paginated message history |
| `POST` | `/messages` | ✓ | Send a message |
| `PATCH` | `/messages/{id}/reactions` | ✓ | Add or remove a reaction |
| `GET` | `/users/search` | ✓ | Search users by username |
| `WS` | `/ws/{user_id}` | token | WebSocket connection |

Full OpenAPI spec at `/docs` or `/redoc` when the server is running.

### WebSocket Events

All WebSocket messages follow `{ "type": string, "payload": object }`.

| Type | Direction | Description |
|---|---|---|
| `new_message` | Server → Client | New message in any conversation |
| `message_status` | Server → Client | Delivery or read receipt update |
| `typing_start` | Client → Server | User started typing |
| `typing_stop` | Client → Server | User stopped typing |
| `typing` | Server → Client | Another user's typing state |
| `reaction` | Server → Client | Reaction added or removed |
| `member_added` | Server → Client | New member joined a group |
| `member_removed` | Server → Client | Member left or was removed |

---

## Deployment

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel

# Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

Or connect the GitHub repository to Vercel directly and set the root directory to `frontend`.

### Backend — Railway

1. Create a new project on [railway.app](https://railway.app)
2. Connect this repository, set the root directory to `backend`
3. Add a `Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Set environment variables:
   - `SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ENVIRONMENT` — `production`
   - `ALLOWED_ORIGINS` — `["https://your-frontend.vercel.app"]`
   - `DATABASE_URL` — use Railway's PostgreSQL plugin and swap `sqlite` to `postgresql+psycopg2`

### Switching to PostgreSQL

The only required change is `DATABASE_URL` in `.env`. Remove the `connect_args` in `database.py` (that argument is SQLite-specific) and install `psycopg2-binary`:

```bash
pip install psycopg2-binary
```

Then run migrations:

```bash
alembic upgrade head
```

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

```bash
# Fork and clone
git clone https://github.com/your-username/signal.git

# Create a branch
git checkout -b feat/your-feature

# Make changes, then open a PR against main
```

**Code conventions:**

- Backend: run `ruff check .` before committing
- Frontend: `pnpm lint` and `pnpm build` must pass — no `any`, no `eslint-disable`
- Comments explain *why*, not *what*

---

## License

MIT — see [LICENSE](LICENSE) for details.
