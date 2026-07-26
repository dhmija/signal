# Signal Clone

A production-quality Signal Desktop clone built as a fullstack SDE take-home assignment.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (Dialog, Dropdown, Sheet, ScrollArea, Popover, ContextMenu) |
| State | Zustand v5 (auth + UI), TanStack Query v5 (server state) |
| Forms | React Hook Form + Zod v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | FastAPI, SQLAlchemy 2.x, Alembic, SQLite |
| Auth | JWT (HS256) via python-jose, bcrypt via passlib |
| Real-time | WebSockets (Phase 3) |

## Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\pip.exe install -r requirements.txt

# macOS/Linux
.venv/bin/pip install -r requirements.txt

# Start (creates the database automatically in development)
.venv/Scripts/uvicorn.exe main:app --reload --port 8000
```

Copy `.env.example` to `.env` and set `SECRET_KEY` to a random 32-byte hex string for production.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**OTP for registration is always `123456`** (mocked — no real SMS).

## Architecture

```
signal/
├── backend/
│   ├── core/          # config, JWT, password hashing, dependency injection
│   ├── models/        # SQLAlchemy ORM models
│   ├── schemas/       # Pydantic request/response shapes
│   ├── services/      # Business logic (routers delegate here)
│   ├── routers/       # Thin HTTP layer
│   ├── websocket/     # Connection manager, event types, handlers (Phase 3)
│   ├── alembic/       # Database migrations
│   ├── seed.py        # Realistic seed data (Phase 2)
│   └── main.py        # App factory
└── frontend/
    ├── src/
    │   ├── app/           # Next.js App Router pages and layouts
    │   ├── features/      # Feature-scoped components, hooks, schemas
    │   │   ├── auth/
    │   │   ├── conversations/
    │   │   ├── messages/
    │   │   ├── contacts/
    │   │   ├── groups/
    │   │   └── settings/
    │   ├── providers/     # QueryProvider, AuthProvider, SocketProvider
    │   ├── store/         # Zustand stores (auth, ui, socket)
    │   ├── services/      # api.ts fetch wrapper
    │   ├── types/         # Shared TypeScript types
    │   └── lib/           # utils, constants
    └── src/styles/        # globals.css — Tailwind v4 + Signal design system
```

## Database Schema

See [implementation plan](docs/schema.md) for the full ERD. Phase 1 creates:

```sql
users (id, username UNIQUE, display_name, avatar_url, about, hashed_password, is_online, last_seen, created_at)
```

Future phases add: contacts, conversations, conversation_members, messages, message_status, attachments, reactions.

## API

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account + return JWT |
| POST | `/auth/login` | Authenticate + return JWT |
| GET | `/auth/me` | Return current user (Bearer required) |
| GET | `/health` | Health check |

Full API docs available at `http://localhost:8000/docs` when the backend is running.

## Assumptions

- OTP verification is mocked (`123456`). The validation is server-side so swapping to a real SMS provider requires changing `services/auth.py` only.
- Avatars use [DiceBear](https://dicebear.com/) generated from the username when none is provided.
- JWT tokens are stored in `localStorage`. For production use, httpOnly cookies are preferred.
- E2E encryption is not implemented. The spec explicitly allows this.
