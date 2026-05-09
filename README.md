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
