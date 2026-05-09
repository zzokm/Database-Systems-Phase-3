"""
Probe MS SQL using the same env vars as the Flask app (root `.env`).

Run from the VS Code task "Backend: Test SQL connection", which uses
`backend/.venv` and passes this script to Python.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Repo root = Phase 3 (parent of `.vscode/`)
_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND_ROOT = _REPO_ROOT / "backend"

if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))


def _load_root_env() -> None:
    from dotenv import load_dotenv

    env_path = _REPO_ROOT / ".env"
    if not env_path.is_file():
        print(
            f"FAILED: {env_path} not found. Copy `.env.example` to `.env`.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    load_dotenv(env_path)


_load_root_env()


def main() -> int:
    try:
        from app.config import AppConfig
        from app.db.connection import get_connection
    except ImportError as e:
        print("FAILED: could not import backend app.", file=sys.stderr)
        print('Run task "Backend: Setup (venv + requirements)" first.', file=sys.stderr)
        print(str(e), file=sys.stderr)
        return 3

    try:
        cfg = AppConfig.from_env()
    except RuntimeError as e:
        print("FAILED:", e, file=sys.stderr)
        print("Ensure DB_* and BACKEND_PORT are set in your root `.env`.", file=sys.stderr)
        return 2

    print(f"DRIVER={cfg.db_driver!r} SERVER={cfg.db_host}:{cfg.db_port} DATABASE={cfg.db_name}")
    print("Connecting...")
    try:
        with get_connection(cfg) as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1 AS ok")
            row = cur.fetchone()
        print(f"SUCCESS: SELECT 1 -> {tuple(row)!r}")
    except Exception as e:
        print("FAILED:", e, file=sys.stderr)
        return 4
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
