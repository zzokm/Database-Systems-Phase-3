"""Load tagged SQL from ``db/*.sql`` (repo root) for API responses and parity with SSMS scripts."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path


def _repo_db_dir() -> Path:
    """Resolve the folder that contains ``READ.sql`` and sibling scripts.

    Layouts supported:

    - Local repo: ``…/<repo>/backend/app/db/sql_files.py`` → ``<repo>/db``.
    - Docker (WORKDIR ``/app``): ``/app/app/db/sql_files.py`` → ``/app/db``.
    - Override: set env ``FARM_DB_SQL_DIR`` to the directory that holds the ``*.sql`` files.
    """
    here = Path(__file__).resolve()
    candidates: list[Path] = []
    override = os.environ.get("FARM_DB_SQL_DIR", "").strip()
    if override:
        candidates.append(Path(override))
    # Monorepo checkout: …/backend/app/db/sql_files.py → …/db
    if len(here.parents) >= 4:
        candidates.append(here.parents[3] / "db")
    # Container: /app/app/db/sql_files.py → /app/db
    if len(here.parents) >= 3:
        candidates.append(here.parents[2] / "db")

    for c in candidates:
        if (c / "READ.sql").is_file():
            return c

    tried = ", ".join(str(c) for c in candidates) or "(none)"
    raise FileNotFoundError(
        "Could not find db/READ.sql for the SQL catalog. "
        f"Tried: {tried}. Set FARM_DB_SQL_DIR or ensure db/*.sql are deployed beside the app."
    )


def load_tagged_sql_file(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    parts = re.split(r"(?m)^-- @name:\s*(\S+)\s*$", text)
    out: dict[str, str] = {}
    i = 1
    while i + 1 < len(parts):
        name = parts[i]
        body = parts[i + 1].strip().rstrip(";").strip()
        if body:
            out[name] = body
        i += 2
    return out


@dataclass(frozen=True)
class SqlCatalog:
    read: dict[str, str]
    insert: dict[str, str]
    update: dict[str, str]
    delete: dict[str, str]
    reports_123: dict[str, str]
    reports_456: dict[str, str]


def load_sql_catalog() -> SqlCatalog:
    root = _repo_db_dir()
    return SqlCatalog(
        read=load_tagged_sql_file(root / "READ.sql"),
        insert=load_tagged_sql_file(root / "INSERT.sql"),
        update=load_tagged_sql_file(root / "UPDATE.sql"),
        delete=load_tagged_sql_file(root / "DELETE.sql"),
        reports_123=load_tagged_sql_file(root / "123INQUIRIES.sql"),
        reports_456=load_tagged_sql_file(root / "456INQUIRIES.sql"),
    )


SQL = load_sql_catalog()
