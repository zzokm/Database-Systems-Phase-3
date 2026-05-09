# Regional Farm-to-Table Distribution (Phase 3)

## Stack

- **Backend:** Python / Flask — MS SQL Server via **`pyodbc`** (**no ORM**).
- **Frontend:** **Next.js** (App Router), **React**, **TypeScript**, **Tailwind CSS**, **shadcn/ui-style** components (`frontend/components.json`).
- **Database:** MS SQL Server hosted **outside** Docker Compose.

## Documentation

- [`docs/SETUP_AND_RUN.md`](docs/SETUP_AND_RUN.md) — install Node/npm, Python, ODBC driver, `.env`, run servers, Compose.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — runtime layout and env vars.
- [`docs/WORK_ALLOCATION.md`](docs/WORK_ALLOCATION.md) — per-member checklist (status only).
- [`docs/TASK_DETAILS.md`](docs/TASK_DETAILS.md) — numbered tasks (M1-1 … M6-5), deliverables, file map, repo ASCII tree.

## Quick pointers

| Goal | Location / command |
|------|---------------------|
| Local onboarding | `docs/SETUP_AND_RUN.md` |
| Flask entry (dev) | `backend/run_dev.py` (`python run_dev.py` from `backend/` after `pip install -r requirements.txt`) |
| Frontend dev server | `cd frontend && npm install && npm run dev` |
| Frontend lint | `cd frontend && npm run lint` |

## Docker Compose & hosted URLs

Compose substitutes **`"${FRONTEND_EXPOSED_PORT}:3000"`** from **`.env` next to `docker-compose.yml`**, not from `.env.prod`. If Dokploy only has `.env.prod` on disk, Compose may fall back to **3000:3000**, so **`https://…:7865`** looks dead while the app is on host port **3000**. Either **`cp .env.prod .env`** before `docker compose up`, or inject the variables in Dokploy’s environment.

Ingress / reverse proxies should forward to **container port 3000**.

Rebuild the **frontend** image after changing **`NEXT_PUBLIC_API_BASE_URL`** (value is inlined at build time).

