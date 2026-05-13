# Task details, deliverables & file touch map

**Course:** Introduction to Database (IS211-SIS211) · Spring 2026  
**Institution:** Cairo University - Faculty of Computers and Artificial Intelligence

This document expands **every member task** from the Phase 3 master plan: numbered IDs, narrative, **deliverables**, and **typical repo files**. For checkboxes-only progress tracking, see [`WORK_ALLOCATION.md`](WORK_ALLOCATION.md).

> **Implementation note:** The official brief may cite “Django” or “Vanilla HTML/CSS/JS”. **This repository uses Flask + Next.js + TypeScript + shadcn/ui** for the Phase 3 app. Interpret “backend foundation” / “frontend” tasks against that stack unless your TA instructs otherwise.

---

<a id="toc"></a>

## Table of contents

**Sections**

- [Repository structure (ASCII)](#repo-structure)
- [Numbered tasks by member](#tasks-by-member)
- [Course requirement traceability](#syllabus-traceability)
- [Reference: API route manifest](#api-route-manifest)

**Member 1 - Database designer**

- [M1-1 - Physical ERD design](#m1-1)
- [M1-2 - Author `schema.sql` DDL](#m1-2)
- [M1-3 - Review mock-data / inquiry coverage](#m1-3)

**Member 2 - Backend CRUD & data-access**

- [M2-1 - INSERT / UPDATE / DELETE APIs](#m2-1)
- [M2-2 - Data-layer ergonomics](#m2-2)
- [M2-3 - Align JSON with UI](#m2-3)

**Member 3 - Analytics (inquiries 1–3)**

- [M3-1 - SQL for inquiries 1–3](#m3-1)
- [M3-2 - HTTP endpoints 1–3](#m3-2)

**Member 4 - Analytics (inquiries 4–6) & security**

- [M4-1 - SQL for inquiries 4–6](#m4-1)
- [M4-2 - HTTP endpoints 4–6](#m4-2)
- [M4-3 - SQL injection review](#m4-3)

**Member 5 - Data population & documentation**

- [M5-1 - Documentation PDF](#m5-1)
- [M5-2 - Mock `INSERT` data](#m5-2)
- [M5-3 - Lookup list APIs](#m5-3)

**Member 6 - Full-stack & DevOps**

- [M6-1 - Backend foundation](#m6-1)
- [M6-2 - Frontend application](#m6-2)
- [M6-3 - Wire reporting UI](#m6-3)
- [M6-4 - Deployment rehearsal](#m6-4)
- [M6-5 - Final ZIP](#m6-5)

---

<a id="repo-structure"></a>

## Repository structure (ASCII)

Convention: paths relative to repo root (**`Phase 3/`**). Files you will **edit** depending on role are annotated with `# → Member N`.

```text
Phase 3/
├── .env.example
├── docker-compose.yml
├── README.md
├── db/
│   └── schema.sql                           # → M1, M5 (DDL + INSERT seed data)
├── docs/
│   ├── ARCHITECTURE.md                     # → anyone (architecture truth)
│   ├── SETUP_AND_RUN.md                     # → M6 (+ anyone onboarding)
│   ├── WORK_ALLOCATION.md                   # → everyone (checkbox status)
│   └── TASK_DETAILS.md                      # ← this file
├── .vscode/
│   ├── tasks.json
│   └── scripts/
│       └── test_sql_connection.py           # SQL connectivity probe (dev)
├── backend/
│   ├── Dockerfile                           # → M6 (deployment tuning)
│   ├── requirements.txt                     # → M2–M4 (+ M6 lock versions if needed)
│   ├── run_dev.py                           # Flask dev entry
│   └── app/
│       ├── __init__.py
│       ├── main.py                          # Flask factory, CORS, errors → M6
│       ├── config.py                        # env → typically M6; DB-only keys rarely M2
│       ├── responses.py                     # JSON helpers → M2, M6
│       ├── db/
│       │   ├── __init__.py
│       │   └── connection.py               # pyodbc helpers → M2 (+ M6 connection tweaks)
│       ├── routes/
│       │   ├── __init__.py                  # blueprint registration → M2, M5, M3–M4
│       │   ├── health.py                   # GET /health, /ready → M6
│       │   └── crud.py                     # CRUD, lookups, reports, GET /api/meta/routes
│       └── sql/                             # optional: raw .sql snippets per feature
│           └── README.md
└── frontend/
    ├── Dockerfile                           # → M6
    ├── package.json                         # deps → M6
    ├── next.config.ts                       # env / API proxy notes → M6
    ├── components.json                      # shadcn registry
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                   # chrome → M6
    │   │   ├── page.tsx                     # home → M6
    │   │   ├── globals.css
    │   │   ├── crud/
    │   │   │   └── page.tsx               # CRUD UI → Member 6 (wire to M2 endpoints)
    │   │   └── reports/
    │   │       └── page.tsx                # dashboards → Member 6 (wire to M3–M4)
    │   ├── components/
    │   │   ├── site-header.tsx
    │   │   ├── … (ui primitives)
    │   │   └── …
    │   └── lib/
    │       └── utils.ts
    └── public/
```

Submission assets **outside Git** but required by syllabus: **ZIP** (exact folder name TA specifies), **`Documentation PDF`** (Phases 1–3 diagrams + prose), **`schema.sql`** copy inside ZIP matching `db/schema.sql`.

---

<a id="tasks-by-member"></a>

## Numbered tasks by member

### Member 1 - Database designer (physical ERD + DDL)

---

<a id="m1-1"></a>

#### Task **M1-1** - Physical ERD design

Design the Phase 3 **physical ER model**: resolve M:N with bridge tables (`OrderDetails`-style junctions where applicable), list keys, FKs, appropriate SQL Server types, and indexing notes for recurring filters.

**Deliverables**

1. Exported **physical ERD diagram** files (PNG/PDF or tooling export) aligned with **`db/schema.sql`**.
2. Short change log note (in team chat/docs) listing tables touched when schema evolves.

**Primary files**

- Exported diagram files (recommended: **`docs/assets/`** or team drive; reference paths in **`docs/TASK_DETAILS.md`** / **`WORK_ALLOCATION.md`** if embedded in repo).
- Cross-check: **`db/schema.sql`** must match diagram.

---

<a id="m1-2"></a>

#### Task **M1-2** - Author `schema.sql` DDL (`CREATE TABLE` + FKs)

Write or maintain authoritative **`CREATE TABLE`** statements for all entities supporting profiles, batches, orders, logistics, inquiries.

**Deliverables**

1. Valid **MS SQL** DDL runnable on the team server.
2. Tables cover: farms/profiles/crops, batches & inventory linkage, restaurants & windows, orders & line-items, trips/drivers/routes linkage as required by syllabus queries.

**Primary files**

- **`db/schema.sql`**

---

<a id="m1-3"></a>

#### Task **M1-3** - Review mock-data / inquiry coverage plan

Approve (or revise) Member 5’s **INSERT seed plan**: ensure edge cases (“farm with zero batches”, “restaurant silent last month”, etc.) and **six “last calendar month”** analytical queries yield meaningful non-empty grids where intended.

**Deliverables**

1. Signed-off checklist mapping **each analytic inquiry → expected sample outcomes**.
2. Flags for empty-result cases that must remain valid by design.

**Primary files**

- **`db/schema.sql`** (constraints affect feasibility)
- Optional: reviewer notes in **`docs/`** (`docs/QUERY_COVERAGE_PLAN.md` if you create one).

---

### Member 2 - Backend CRUD & data-access engineer

---

<a id="m2-1"></a>

#### Task **M2-1** - INSERT / UPDATE / DELETE API implementations (six endpoints)

Expose **six** Flask routes executing **parameterized raw SQL** (≥2 INSERT, ≥2 UPDATE, ≥2 DELETE on **distinct tables**, `WHERE` on deletes/updates). Implement them in **`backend/app/routes/crud.py`** (no separate placeholder blueprint).

Suggested mapping (adapt to schema):

| Op | Stub route (implement here) |
|----|----------------------------|
| INSERT | **`POST /api/harvest-batches`** |
| INSERT | **`POST /api/drivers`** |
| UPDATE | **`PUT /api/restaurants/<restaurant_id>/delivery-window`** |
| UPDATE | **`PUT /api/trips/<trip_id>/route`** |
| DELETE | **`DELETE /api/orders/<order_id>`** |
| DELETE | **`DELETE /api/harvest-batches/<batch_id>`** |

**Deliverables**

1. **200**/appropriate **4xx** JSON using shared helpers (**`responses.py`**).
2. No string-concat SQL for user-controlled values (**parameterized queries** only).

**Primary files**

- **`backend/app/routes/crud.py`** (and **`routes/__init__.py`** blueprint registration order).
- **`backend/app/db/connection.py`** (**`execute_write`**, **`execute_select`** reuse).
- Optional new modules **`backend/app/routes/crud/*.py`** if you split **`crud.py`** for readability.

---

<a id="m2-2"></a>

#### Task **M2-2** - Reusable “data layer” ergonomics (+ validation/errors)

Formalize reusable helpers: optional transaction wrapper, standardized validation errors (**400**), not-found (**404**), DB error masking (**503**/message policy team agrees).

**Deliverables**

1. Small documented pattern for endpoints (docstring README or **`backend/app/sql/README.md`** appendix).
2. Consistent payload validation (minimal: required fields/types).

**Primary files**

- **`backend/app/responses.py`**
- **`backend/app/db/connection.py`** (optional new helpers beside **`execute_*`**)
- Any new **`backend/app/validation*.py`** (if introduced)

---

<a id="m2-3"></a>

#### Task **M2-3** - Align HTTP JSON contracts with UI

Ensure request/response shapes match **`frontend/src/app/crud/page.tsx`** form fields and downstream tables (coordinate with Member 6).

**Deliverables**

1. Example JSON payloads in comments or **`docs/API_CRUD_SAMPLES.md`** (optional).
2. Updated **`GET /api/meta/routes`** manifest when routes move (keep in **`crud.py`** or the module that owns **`/api/meta/routes`**).

**Primary files**

- **`backend/app/routes/...`** handlers
- **`frontend/src/app/crud/page.tsx`** (consumer)
- Possibly **`frontend/src/lib/...`** API client utilities

---

### Member 3 - Backend analytics engineer (Inquiries **1 · 2 · 3**)

---

<a id="m3-1"></a>

#### Task **M3-1** - SQL for inquiries 1–3 tested in MSSQL

Formulate **`JOIN`**-heavy **`SELECT`** statements answering:

1. **Crop type with maximum orders** placed by restaurants.  
2. **Farms** with **no** harvest batches listed or sold **during last calendar month**.  
3. **Driver** with **highest number of trips** completed **last calendar month**.

**Deliverables**

1. `.sql` test scripts or runnable batches with expected sample output documented.
2. Agreement on **`last_month`** semantics (calendar month UTC vs Cairo local vs DB server time; choose one).

**Primary files**

- Optional: **`backend/app/sql/report_inquiry_{1,2,3}.sql`** or team SQL scratch folder outside repo  
- Executes against **`db/schema.sql`** + Member 5 data

---

<a id="m3-2"></a>

#### Task **M3-2** - HTTP endpoints for inquiries 1–3

Expose **three stable** JSON endpoints via Flask (recommended dedicated slugs, e.g. **`GET /api/reports/max-orders-by-crop`**, **`GET /api/reports/farms-no-activity-last-month`**, **`GET /api/reports/driver-most-trips-last-month`** - finalize with frontend).

**Deliverables**

1. **200** JSON tables/arrays usable by dashboards.
2. Update **`GET /api/meta/routes`** output to list canonical slugs (modify **`backend/app/routes/crud.py`** or a dedicated **`reports_*.py`** blueprint if you split routes).

**Primary files**

- **`backend/app/routes/crud.py`** or a new **`reports_*.py`** blueprint
- **`backend/app/routes/__init__.py`** (registration)
- Possibly **`responses.py`** for paginated/tabular payloads

---

### Member 4 - Backend analytics & security engineer (Inquiries **4 · 5 · 6** + SQLi assist)

---

<a id="m4-1"></a>

#### Task **M4-1** - SQL for inquiries 4–6 tested in MSSQL

Write & verify **`JOIN`** queries for:

4. Restaurants with **no** produce orders **last calendar month**.  
5. **Harvest batches** delivered to **each** restaurant **last month** (grain: per restaurant × batch rows).  
6. **Each farm**: name **+ total revenue** from sold batches.

**Deliverables**

1. Executable scripts + rationale for joins/aggregates.
2. Verified against Member 5’s seed totals.

**Primary files**

- Optional: **`backend/app/sql/report_inquiry_{4,5,6}.sql`**
- Depends on **`db/schema.sql`** + seed data semantics

---

<a id="m4-2"></a>

#### Task **M4-2** - HTTP endpoints for inquiries 4–6

Three endpoints returning JSON (agree slug names + contract with **`frontend/src/app/reports/page.tsx`**).

**Deliverables**

Stable **`GET`** paths + documented response schema.

**Primary files**

- **`backend/app/routes/…`** (+ **`__init__.py`**)
- Extend **`GET /api/meta/routes`** doc block

---

<a id="m4-3"></a>

#### Task **M4-3** - SQL injection review (assist Member 2)

Audit **every** dynamically built query path: parameterized placeholders, whitelist for sort columns, guarded dynamic table names discouraged.

**Deliverables**

1. Brief review checklist passed to Member 2 (issues filed or comments in PR).
2. Confirmation before final demo.

**Primary files**

- Entire **`backend/app/routes/**`**, any **`backend/app/db/**`**, ad-hoc SQL strings elsewhere

---

### Member 5 - Data population & documentation assembly

---

<a id="m5-1"></a>

#### Task **M5-1** - Documentation assembly (diagram exports + formatted PDF narrative)

Gather **Phase 1 requirements**, **Phase 2 conceptual ERD**, **Phase 3 physical ERD**, formatted per TA rubric → **Documentation PDF**.

**Deliverables**

1. Submission-ready **PDF**.
2. Source exports stored where team agrees (referenced from ZIP readme).

**Primary files**

- Usually **outside** repo or under **`docs/assets/`**

---

<a id="m5-2"></a>

#### Task **M5-2** - Mock data `INSERT` statements in **`schema.sql`**

Author comprehensive **`INSERT`** sets so UI + inquiries run with realistic volumes; satisfies “last month” windows.

**Deliverables**

1. Seeds committed to **`db/schema.sql`** or separate **`db/seeds/*.sql`** (if CI split, but ZIP must satisfy “one schema.sql rule”; confirm TA).

**Primary files**

- **`db/schema.sql`**

---

<a id="m5-3"></a>

#### Task **M5-3** - Lookup list APIs (**GET** singleton-table reads)

Expose **`SELECT`** dropdown feeds:

- **`GET /api/farms`**
- **`GET /api/restaurants`**
- **`GET /api/drivers`** (distinct from Member 2’s **`POST /api/drivers`** register)
- **`GET /api/crop-types`**

**Deliverables**

1. **200** JSON arrays (**401/500** conventions consistent).

**Primary files**

- **`backend/app/routes/crud.py`** (add or replace handlers for these paths)  
- Possibly extract **`backend/app/routes/lookups.py`**

---

### Member 6 - Full-stack lead & DevOps (foundation + frontend + submission)

---

<a id="m6-1"></a>

#### Task **M6-1** - Backend foundation (already shipped on `main`; extend only if needed)

Flask skeleton, MSSQL **`pyodbc`** connection, Compose, **`docs/SETUP_AND_RUN.md`**, VS Code probe tasks.

**Deliverables**

- Maintained infra as scope grows (ports, **`docker-compose.yml`**, **`.env.example`**).

**Primary files**

- **`backend/`** bootstrap files: **`Dockerfile`**, **`app/main.py`**, **`app/config.py`**, **`requirements.txt`**
- **`docker-compose.yml`**, **`.env.example`**
- **`.vscode/tasks.json`**, **`.vscode/scripts/test_sql_connection.py`**

*(Mark complete in **`WORK_ALLOCATION.md`** unless you add new infra.)*

---

<a id="m6-2"></a>

#### Task **M6-2** - Frontend application (structure + UX)

Own Next.js UX: **`/crud`**, **`/reports`**, shared layout/nav, polish theming/accessibility baseline.

**Deliverables**

1. Responsive pages using existing component library (**`frontend/src/components/ui`**).
2. Environment-driven API base URL (**`NEXT_PUBLIC_API_BASE_URL`**).

**Primary files**

- **`frontend/src/app/**`** (pages, **`layout.tsx`**, **`globals.css`**)
- **`frontend/src/components/**`**
- **`frontend/next.config.ts`**, **`package.json`**

---

<a id="m6-3"></a>

#### Task **M6-3** - Wire reporting dashboards to Member 3 & 4 APIs

Populate **`reports/page.tsx`** data tables/charts from **`GET`** report endpoints (**no mocked data** final).

**Deliverables**

1. Error/empty-state handling (**501**/`fetch` failures gracefully during dev).

**Primary files**

- **`frontend/src/app/reports/page.tsx`**
- Optional **`frontend/src/lib/api*.ts`** client wrappers

---

<a id="m6-4"></a>

#### Task **M6-4** - Deployment / hosting rehearsal

Demonstrate reproducible compose or hosting story TA can grade (README section + runnable command).

**Deliverables**

1. **`README.md`** subsection “Demo URL / how TA runs Compose”.
2. Ensure backend reaches external SQL from hosted network.

**Primary files**

- **`docker-compose.yml`**, **`README.md`**, **`docs/SETUP_AND_RUN.md`**

---

<a id="m6-5"></a>

#### Task **M6-5** - Final ZIP assembly (`ProjectID-TA-Title-Phase 3`)

One team member submits Google Classroom ZIP with **`Software Application Code`**, **`Documentation PDF`**, **`schema.sql`**.

**Deliverables**

ZIP matching naming rules containing:

1. **`backend/`** + **`frontend/`** + **`db/schema.sql`** + **`docs`** as required  
2. **PDF**

**Primary files**

- Root packaging checklist (**`SUBMISSION_README.txt`** optional)

---

<a id="syllabus-traceability"></a>

## Course requirement traceability (syllabus checklist)

These are TA-facing minimums (not owned by only one checkbox line in **`WORK_ALLOCATION.md`**) but map here:

| Syllabus rule | Implemented by tasks |
|----------------|----------------------|
| ≥2 **`INSERT`** (distinct tables), API-visible | **M2-1** |
| ≥2 **`UPDATE`** (`WHERE`), API-visible | **M2-1** |
| ≥2 **`DELETE`** (`WHERE`), API-visible | **M2-1** |
| Single-table **`SELECT`** for UI dropdowns | **M5-3** |
| Multi-table **`JOIN`** analytics (six queries) | **M3-1**, **M3-2**, **M4-1**, **M4-2** |
| **No ORM** | enforced across **M2**, **M3**, **M4**, **M5-3** |
| GUI demo | **M6-2**, **M6-3** |
| Hosted MS SQL schema + seed DDL | **M1**, **M5**, **ZIP** (**M6-5**) |

---

<a id="api-route-manifest"></a>

## Reference to API route manifest

Whenever routes are added or moved, verify with **`GET /api/meta/routes`** against a running Flask app, and update the route manifest in **`crud.py`** (or wherever **`/api/meta/routes`** is defined) accordingly.
