# Local setup & run guide (Windows: CMD or PowerShell)

Assume you are cloning this repository **from scratch**. Commands use either **CMD** (`cmd.exe`) or **PowerShell**. Adjust paths if your repo lives somewhere else.

Replace `YOUR\PATH\Phase 3` with your actual checkout directory (this project path contains spaces, so quoting matters).

---

## 1. Install current Node.js and npm

Node.js installers ship with **npm**.

1. Browse to [Node.js downloads](https://nodejs.org/).
2. Download the **Current** (latest) Windows **64-bit** installer.
3. Run the installer:
   - enable **npm** installation (checked by default);
   - optionally enable **Automatically install tools** only if prompted and you agree.
4. **Close and reopen** your terminal so `PATH` updates.

Verify:

```bat
where node && node -v
where npm && npm -v
```

(Optional) Upgrade npm to the newest release:

```powershell
npm install -g npm@latest
```

---

## 2. Install Python 3

1. Install **Python 3.12 or newer** from [Python.org downloads](https://www.python.org/downloads/windows/).
2. In the installer, check **Add python.exe to PATH**.
3. Reopen your terminal.

Verify:

```bat
python --version && py --version 2>nul
```

Pick whichever command invokes Python 3.12+ reliably on your PC (examples below use `python`).

---

## 3. Install the Microsoft ODBC driver for SQL Server (backend requirement)

Because the Flask API uses **`pyodbc`**, install **Microsoft ODBC Driver 18 for SQL Server** (recommended name for `.env`).

1. Follow Microsoft’s current guide: install **Microsoft ODBC Driver 18 for SQL Server** from the vendor’s ODBC download page (`https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server`).
2. After installation, reopen your terminal.

**Note:** the database server itself runs **outside** Docker for this course; Compose only launches `backend` + `frontend`.

---

## 4. Get the repo and create `.env`

```powershell
cd "d:\YOUR\PATH\Phase 3"
copy .env.example .env
notepad .env
```

Minimum fields to edit for backend startup:

```text
DB_HOST=<your sql host>
DB_PORT=1433
DB_NAME=<database name>
DB_USER=<login>
DB_PASSWORD=<password>
DB_DRIVER=ODBC Driver 18 for SQL Server
BACKEND_PORT=5000
BACKEND_EXPOSED_PORT=5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
FRONTEND_EXPOSED_PORT=3000
```

Optional TLS/Dev toggles (`true`/`false`):

```text
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

Frontend uses **`NEXT_PUBLIC_API_BASE_URL`** in the browser, so pick the hostname/port your OS can reach (`localhost` is typical).

---

## 5. Backend: virtual environment & dependencies

```powershell
cd "d:\YOUR\PATH\Phase 3\backend"
python -m venv .venv
```

Activate the virtual environment:

**PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

**CMD**

```bat
.\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## 6. Frontend: npm dependencies

```powershell
cd "d:\YOUR\PATH\Phase 3\frontend"
npm install
```

This project declares **Node `>=20.9.0`** in `frontend/package.json`.

---

## 7. Optional checks

### Frontend lint (`eslint`)

```powershell
cd "d:\YOUR\PATH\Phase 3\frontend"
npm run lint
```

There is **no automated backend test suite** in this repo for Phase 3 (by team choice).

---

## 8. Starting the Flask API (development)

Ensure `backend/.venv` **is activated** and your **`Phase 3/.env`** is filled.

### Option A (recommended): bundled dev runner

```powershell
cd "d:\YOUR\PATH\Phase 3\backend"
python run_dev.py
```

Uses `BACKEND_PORT`/`FLASK_DEBUG` from `.env`.

### Option B: Flask CLI (application factory)

```powershell
cd "d:\YOUR\PATH\Phase 3\backend"
set FLASK_APP=app.main:create_app
set FLASK_DEBUG=1
flask run --host 0.0.0.0 --port 5000
```

(PowerShell uses `$env:FLASK_APP="app.main:create_app"` instead of `set`.)

### Quick manual checks

- `GET http://localhost:5000/health` → JSON `{"status":"ok"}` (no DB required).
- `GET http://localhost:5000/ready` → JSON with DB echo if credentials reach SQL Server.
- `GET http://localhost:5000/api/meta/routes` → manifest of registered routes.

---

## 9. Starting the Next.js frontend (development)

```powershell
cd "d:\YOUR\PATH\Phase 3\frontend"
npm run dev
```

Default dev URL: `http://localhost:3000` (unless your shell reports another port).

Keep **two terminals** open: one for `python run_dev.py`, one for `npm run dev`.

---

## 10. Production-like run via Docker Compose

From the repository root (requires Docker Desktop):

```powershell
cd "d:\YOUR\PATH\Phase 3"
docker compose up --build
```

Ports follow `.env` (`BACKEND_EXPOSED_PORT`, `FRONTEND_EXPOSED_PORT`). The backend container still needs **network reachability** to your external SQL Server.

---

## 11. Typical troubleshooting

- **`ModuleNotFoundError: app` when running Flask:** always `cd backend` before `python run_dev.py`.
- **`pyodbc` cannot find driver:** driver name in `.env` must match **ODBC Data Source Administrator (64-bit)** → “Drivers” tab exactly (spaces included).
- **Frontend cannot reach API:** align `NEXT_PUBLIC_API_BASE_URL` with `BACKEND_EXPOSED_PORT`, and ensure Flask is bound to `0.0.0.0` if calling from another device.

For architecture context, see `docs/ARCHITECTURE.md`; for milestones, see `docs/WORK_ALLOCATION.md`.

---

## 12. VS Code tasks (optional)

If you open the repo folder in VS Code, use **Terminal → Run Task…** (`Ctrl+Shift+B` selects the configured build/default group where applicable):

| Task | What it does |
|------|----------------|
| **Frontend: Setup (npm install)** | Installs frontend dependencies |
| **Backend: Setup (venv + requirements)** | Creates `backend/.venv` if missing, then `pip install -r backend/requirements.txt` |
| **Full stack: Setup** | Runs both setup tasks **in parallel** |
| **Backend: Run dev (Flask)** | `backend/run_dev.py` using the venv |
| **Frontend: Run dev (Next.js)** | `npm run dev` on port **3000** |
| **Full stack: Run dev** | Starts backend + frontend **in parallel** (long-running) |
| **Backend: Test SQL connection** | Runs `.vscode/scripts/test_sql_connection.py` (needs root `.env` + ODBC Driver) |
| **Backend: Setup + Test SQL connection** | Sequential: setup then SQL probe |
