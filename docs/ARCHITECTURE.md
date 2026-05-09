# ARCHITECTURE

## 1. Summary
This repository contains a simple web application for the "Regional Farm-to-Table Distribution" project.

- **Backend**: Python (Flask) REST API
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: **MS SQL Server (externally hosted)** — not created inside Docker Compose
- **Data access rule**: **Raw SQL only** (no ORM)

## 2. Runtime Components

### 2.1 Backend service (`backend/`)
- Flask app exposes endpoints for:
  - CRUD operations (INSERT/UPDATE/DELETE) required by the course
  - Reporting endpoints for the 6 analytical inquiries (JOIN queries)
  - Lookup/list endpoints for dropdowns (farms, restaurants, drivers, crop types, ...)
- Connects to **external** MS SQL Server using `pyodbc` and parameterized queries.

### 2.2 Frontend service (`frontend/`)
- Static site (HTML/CSS/JS).
- Uses `fetch()` to call the Flask API.
- Pages:
  - CRUD forms page(s)
  - Reporting dashboard page(s) for the 6 inquiries

## 3. Docker & Deployment Approach

### 3.1 Docker Compose
Docker Compose is used to run **only the application services** (backend + frontend).

- MS SQL Server is **not** a compose service.
- The backend receives DB connection details via environment variables.

### 3.2 Environment variables (backend)
The backend reads DB configuration from environment variables (example in `backend/.env.example`):

- `DB_HOST`
- `DB_PORT` (usually `1433`)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DRIVER` (example: `ODBC Driver 18 for SQL Server`)

### 3.3 Ports (default)
- Frontend: `8080` (container) → `8080` (host)
- Backend API: `5000` (container) → `5000` (host)

## 4. Repository Layout (high-level)

```text
docs/                  project docs (Phase 3 + architecture)
db/                    SQL schema script (schema.sql)
backend/               Flask API skeleton + dependencies + Dockerfile
frontend/              static UI skeleton + Dockerfile
docker-compose.yml     local/dev orchestration (no DB service)
```

## 5. Ownership Mapping (team)
- **Member 6**: repo setup, project skeleton, Docker, frontend, backend foundation
- **Members 2–4**: API endpoints + raw SQL (CRUD + inquiries) built on top of the foundation
- **Member 1**: physical design + DDL direction
- **Member 5**: documentation PDF + mock data inserts + lookup endpoints

