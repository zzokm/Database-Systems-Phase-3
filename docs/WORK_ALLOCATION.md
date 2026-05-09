# WORK_ALLOCATION: Regional Farm-to-Table Distribution (Phase 3)

**Course:** Introduction to Database (IS211-SIS211) · Spring 2026  
**Institution:** Cairo University — Faculty of Computers and Artificial Intelligence

Checklists below track **repository progress**. Unchecked items are still open for the team.

---

## 1. Project scope & data (course narrative)

- [x] **Domain captured in documentation:** farms with crop specialties, harvest batches with quantity and dates, restaurants with addresses and delivery windows, orders referencing batches, drivers and trips with routes and distances, freshness-tracking intent.
- [x] **`schema.sql` present in repo** (`db/schema.sql`).
- [ ] **Mock data density** satisfies all “last month” analytical inquiries with non-empty sensible results (`schema.sql`).
- [ ] **Phase 3 physical ERD** exported and bundled in the submission PDF alongside Phase 1 and Phase 2.
- [ ] **Submission zip** satisfies classroom naming/format rules (single uploader).

---

## 2. Mandatory SQL & API operations (minimum bar)

Raw SQL via **parameterized queries** (no ORM). Counts refer to shipped application behavior.

- [ ] At least **2 INSERT** endpoints on **≥2 tables** (e.g., harvest batch, driver).
- [ ] At least **2 UPDATE** endpoints on **≥2 tables** (`WHERE`-qualified).
- [ ] At least **2 DELETE** endpoints on **≥2 tables** (`WHERE`-qualified).
- [ ] **Single-table SELECT** lookups exposed for the UI (farms, restaurants, drivers, crop types, …).
- [ ] **`JOIN`-heavy SELECT** for all **six analytical inquiries** (see §3).

Foundation status today: matching **HTTP routes exist** returning **501** + `not_implemented` until Members 2–5 wire SQL (`GET /api/meta/routes` lists them).

---

## 3. The six analytical inquiries (complex joins)

Endpoints are stubbed today at `GET /api/reports/<report_slug>`; replace with stable slugs Members 3–4 agree on.

- [ ] Inquiry 1: crop type with **maximum orders** placed by restaurants.
- [ ] Inquiry 2: farms with **no harvest batches listed or sold** in the **last calendar month**.
- [ ] Inquiry 3: driver with **most completed trips** last month.
- [ ] Inquiry 4: restaurants **with no orders** last month.
- [ ] Inquiry 5: harvest batches **delivered to each restaurant** last month.
- [ ] Inquiry 6: **per farm:** name + **total revenue** from sold batches.

---

## 4. Academic & technical constraints

- [x] **DBMS requirement:** targets **MS SQL Server** (hosted **outside** this repo’s Compose file).
- [x] **No ORM** in backend data access (`pyodbc` + raw SQL helpers only).
- [x] **Backend foundation:** Flask app factory, env-driven config, shared JSON helpers, health checks, CORS for local dev, route registration with consistent 501 placeholders.
- [x] **Connection string controls:** `MSSQL_ENCRYPT`, `MSSQL_TRUST_SERVER_CERTIFICATE` (optional env; default secure-dev friendly).
- [x] **`/ready` probe** attempts `SELECT 1` (requires reachable DB credentials).
- [ ] **Automated backend tests** — excluded from this Phase 3 repo scope for now.

---

## 5. Intended tech stack (as implemented / planned)

- [x] **Database:** MS SQL Server (**external host**).
- [x] **Backend:** Python 3.12+, **Flask**, **pyodbc**, **Gunicorn** (container).
- [x] **Frontend:** **Next.js** (App Router), **React**, **TypeScript**, **Tailwind CSS**, **shadcn/ui-style** primitives under `frontend/src/components/ui` (+ `components.json`).
- [x] **Dev orchestration:** `docker-compose.yml` for backend + frontend (no DB container).
- [ ] **Hosted deployment** packaged for TA demo (defer to deployment owner).

Legacy course wording mentioned “Vanilla HTML/CSS/JS”; this repository **standardizes on Next.js + React + shadcn/ui** as above.

---

## 6. Repository layout completeness

- [x] `backend/` Flask application package (`app/`).
- [x] `frontend/` Next.js UI (CRUD + Reports pages scaffolded).
- [x] `db/schema.sql`.
- [x] `docs/ARCHITECTURE.md`, **`docs/WORK_ALLOCATION.md`**, **`docs/SETUP_AND_RUN.md`** (local onboarding).
- [x] Root `.env.example` + Compose-friendly env naming.

---

## 7. Team ownership (six members)

### Member 1 — Database designer (physical ERD + DDL)

- [ ] Physical ERD finalized and exported.
- [x] DDL file maintained (`db/schema.sql`).
- [ ] Review mock data coverage for analytical edge cases.

### Member 2 — Backend CRUD & data-access utilities

- [ ] Implement the six CRUD-facing routes (replace 501 stubs) with **parameterized SQL** + validation + consistent responses.
- [ ] Shared helpers for_execute patterns (beyond current `execute_select` / `execute_write`).
- [ ] Coordinate HTTP shapes with frontend forms.

Current stubbed routes: `POST /api/harvest-batches`, `POST /api/drivers`, `PUT /api/restaurants/<id>/delivery-window`, `PUT /api/trips/<id>/route`, `DELETE /api/orders/<id>`, `DELETE /api/harvest-batches/<id>`.

### Members 3 & 4 — Backend analytics (+ security assist)

- [ ] Deliver **six production report endpoints or slugs**, each wrapping tested `JOIN` SQL.
- [ ] Assist Member 2 on injection hygiene review for **all** dynamic SQL snippets.

### Member 5 — Data population & documentation assembly

- [ ] Comprehensive `INSERT` mock data (`schema.sql` or agreed SQL seed files).
- [ ] Produce/compile **documentation PDF** (Phase 1 + Phase 2 + Phase 3 ERD exports).
- [ ] Implement dropdown/list APIs: `GET /api/farms`, `/api/restaurants`, `/api/drivers`, `/api/crop-types` (**GET** list vs **POST /api/drivers register** stays separate methods on same path — allowed).

### Member 6 — Full-stack integration & submission packaging

- [x] **Backend bootstrap** in this repo (foundation).
- [x] Frontend shell (routing, layout, dashboards scaffold).
- [ ] Wire forms/tables from UI to finalized APIs instead of stubs.
- [ ] Reporting UI bound to Members 3–4 endpoints.
- [ ] Deployment / final zip + verification pass.

---

## 8. How to orient new contributors quickly

- [x] **Local setup:** read `docs/SETUP_AND_RUN.md` (Windows CMD/PowerShell first-class).
- [x] **Architecture snapshot:** read `docs/ARCHITECTURE.md`.
- [x] **Discover registered URLs:** call `GET /api/meta/routes` once the Flask server runs.
