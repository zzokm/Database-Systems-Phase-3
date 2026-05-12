# ARCHITECTURE

## 1. Summary

This repository hosts the web stack for the **Regional Farm-to-Table Distribution** Phase 3 project.

- **Backend:** Python (**Flask**) REST API executing **parameterized raw SQL** via **`pyodbc`** - **no ORM**.
- **Frontend:** **Next.js** (App Router), **React**, **TypeScript**, **Tailwind CSS**, UI primitives aligned with **shadcn/ui** conventions (`frontend/components.json`, `frontend/src/components/ui`).
- **Database:** **MS SQL Server** hosted **externally** - **not** defined as a Compose service.

## 2. Runtime Components

### 2.1 Backend (`backend/`)

Flask exposes:

- **`GET /health`** - liveness (no database).
- **`GET /ready`** - lightweight `SELECT 1` probe (requires DB reachable).
- **`GET /api/meta/routes`** - manifest of registered URLs (useful while CRUD/report handlers are still stubs).
- **`/api/...` CRUD, lookups, and `/api/reports/<slug>` routes** - registered with **HTTP 501** placeholders until Members 2–5 attach SQL.

WSGI entry for containers: `gunicorn --factory app.main:create_app`.

### 2.2 Frontend (`frontend/`)

Single Next.js app calling the REST API using `NEXT_PUBLIC_API_BASE_URL`.

Notable routes (App Router):

- **`/crud`** - forms for INSERT/UPDATE/DELETE flows (wire-up pending finalized APIs).
- **`/reports`** - dashboard shell for the six inquiries (data wiring pending).

### 2.3 Docker Compose

`docker-compose.yml` builds/runs **backend + frontend** only.

- Image ports default map host `5000` → Flask and host `3000` → Next.js listening on container port `3000`.
- SQL connectivity still depends on **reachable external** `DB_HOST`.

## 3. Configuration

Root **`.env`** feeds both services when using Compose. Key variables:

| Variable | Purpose |
|----------|---------|
| `BACKEND_PORT` / `BACKEND_EXPOSED_PORT` | Flask listen + published port |
| `FRONTEND_EXPOSED_PORT` | Published Next.js port (maps to internal `3000`) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DRIVER` | SQL auth + ODBC driver name |
| `MSSQL_ENCRYPT`, `MSSQL_TRUST_SERVER_CERTIFICATE` | ODBC boolean flags (`true`/`false`) |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-visible API base URL |

See `.env.example` for a ready template.

## 4. Repository Layout

```text
docs/                  WORK_ALLOCATION, TASK_DETAILS, SETUP_AND_RUN, ARCHITECTURE
db/schema.sql          DDL + (eventually) seed data
backend/               Flask package (`app/`), Dockerfile
frontend/              Next.js app + Dockerfile
docker-compose.yml     dev composition (no DB container)
```

## 5. Ownership Snapshot

Per-member checklists: **`docs/WORK_ALLOCATION.md`**. Task narratives + file touch map: **`docs/TASK_DETAILS.md`**. At a high level:

- **Member 6 (this repo bootstrap):** backend foundation, frontend shell, Docker wiring.
- **Members 2–5:** replace API stubs with real SQL (CRUD, lookups, six analytical reports), mock data, documentation PDF assembly.
