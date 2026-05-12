# WORK_ALLOCATION: Regional Farm-to-Table Distribution (Phase 3)

**Course:** Introduction to Database (IS211-SIS211) · Spring 2026  
**Institution:** Cairo University - Faculty of Computers and Artificial Intelligence

This file is **checkbox-only** per person. For **full narrative, deliverables, and file paths**, use **[`TASK_DETAILS.md`](TASK_DETAILS.md)** (numbered tasks **M1-1** … **M6-5**).

---

## Everyone - shared prerequisites & coordination

- [x] **Onboarding:** [`SETUP_AND_RUN.md`](SETUP_AND_RUN.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`.env.example`](../.env.example).
- [x] **Backend route manifest** while Flask runs: `GET /api/meta/routes` (stubs return **501** until implemented).
- [ ] **Local machine ready:** pull `main`, copy **`.env`**, [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server), `backend` venv + `pip install -r requirements.txt`, `frontend` `npm install`.
- [ ] **Shared MS SQL** reachable for everyone who authors SQL.
- [ ] **Agreed:** branch naming, `/api/reports/...` **slug list** (Members 3–4 + Member 6), CRUD **JSON shapes** (Members 2 + 6).

---

## Member 1 - Database designer (physical ERD + DDL)

- [ ] **M1-1** Physical ERD finalized and exported (matches tables in `db/schema.sql`).
- [ ] **M1-2** Authoritative DDL in **`db/schema.sql`** (`CREATE TABLE`, keys, FKs).
- [ ] **M1-3** Review / approve mock-data & “last month” inquiry coverage plan (with Member 5).

---

## Member 2 - Backend CRUD & data-access engineer

- [x] **M2-1a** Stub HTTP routes exist for six CRUD operations (501 until SQL) - see [`TASK_DETAILS.md`](TASK_DETAILS.md) **M2-1** table.
- [ ] **M2-1b** Replace stubs with **parameterized** `INSERT` / `UPDATE` / `DELETE` (≥2 distinct tables each op type, `WHERE` on updates/deletes).
- [ ] **M2-2** Reusable helpers, validation, and consistent HTTP error JSON (beyond bare `execute_select` / `execute_write`).
- [ ] **M2-3** Lock request/response JSON with Member 6 for **`frontend/src/app/crud/page.tsx`**.

---

## Member 3 - Backend analytics engineer (Inquiries 1–3)

- [ ] **M3-1** Final **`JOIN`** SQL for inquiries **1 · 2 · 3**, tested against MSSQL + seed data.
- [ ] **M3-2** Three **`GET`** report endpoints exposing that SQL as JSON (**stable slugs**; update **`/api/meta/routes`** list).

*(Inquiry definitions: **`TASK_DETAILS.md`** § Member 3.)*

---

## Member 4 - Backend analytics & security engineer (Inquiries 4–6 + SQLi assist)

- [ ] **M4-1** Final **`JOIN`** SQL for inquiries **4 · 5 · 6**, tested against MSSQL + seed data.
- [ ] **M4-2** Three **`GET`** report endpoints (**stable slugs**; **`/api/meta/routes`**).
- [ ] **M4-3** SQL injection / parameterization review across **Member 2** (and peers') dynamic SQL paths.

*(Inquiry definitions: **`TASK_DETAILS.md`** § Member 4.)*

---

## Member 5 - Data population & documentation assembly

- [ ] **M5-1** Assemble **`Documentation PDF`** (Phase 1 + Phase 2 conceptual + Phase 3 physical ERD narrative).
- [ ] **M5-2** Comprehensive mock **`INSERT`** data (meets **`/api`** + six inquiries; **`db/schema.sql`** or TA-approved seed layout).
- [ ] **M5-3** Implement lookup **`GET`** APIs (**`/api/farms`**, **`/restaurants`**, **`/drivers`**, **`/crop-types`**) as **`SELECT`** JSON for dropdowns (**GET** list vs Member 2 **`POST /api/drivers`**).

---

## Member 6 - Full-stack lead & DevOps

- [x] **M6-1** Backend foundation on repo (**Flask**, `pyodbc`, Compose, env, VS Code tasks, [`SETUP_AND_RUN.md`](SETUP_AND_RUN.md) §12).
- [x] **M6-2a** Frontend shell (**Next.js** App Router, layout, `/crud`, `/reports` scaffolds, shadcn-style UI).
- [ ] **M6-2b** Polish UX/accessibility and align pages with final API contracts.
- [ ] **M6-3** Wire **`frontend/src/app/reports/page.tsx`** to Member 3 & 4 **`GET`** endpoints (real data, not permanent mocks).
- [ ] **M6-3b** Wire **`frontend/src/app/crud/page.tsx`** to Member 2 endpoints (remove reliance on 501 where possible).
- [ ] **M6-4** Deployment / hosting path documented and demo-ready (`README.md` + Compose or host instructions).
- [ ] **M6-5** Final **`ProjectID-TA-Title-Phase 3`** ZIP: code + **`schema.sql`** + **PDF**, per TA rules.

---

## Course-wide outcomes (TA minimum bar)

Track here for visibility; detail lives in [`TASK_DETAILS.md`](TASK_DETAILS.md) “Course requirement traceability”.

- [ ] At least **2** working **`INSERT`** APIs (**2+ tables**).
- [ ] At least **2** working **`UPDATE`** APIs (**2+ tables**, `WHERE`).
- [ ] At least **2** working **`DELETE`** APIs (**2+ tables**, `WHERE`).
- [ ] Working **single-table** lookup **`SELECT`** APIs (Member 5).
- [ ] All **six** analytic inquiries exposed as working **`JOIN`** report APIs (Members 3 & 4).
- [ ] **Live GUI** demonstrates CRUD + reports (**Member 6** + backend owners).
- [ ] **Submission** PDF + ZIP rules satisfied (**Member 5** + **Member 6**).
