from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any

from app.config import AppConfig


def build_connection_string(cfg: AppConfig) -> str:
    # TrustServerCertificate is commonly needed in dev; keep behavior explicit via connection string.
    # If your hosted MSSQL requires encryption/CA validation, adjust accordingly.
    enc = "yes" if cfg.mssql_encrypt else "no"
    trust = "yes" if cfg.mssql_trust_server_certificate else "no"
    return (
        "DRIVER={%s};SERVER=%s,%d;DATABASE=%s;UID=%s;PWD=%s;"
        "Encrypt=%s;TrustServerCertificate=%s;"
    ) % (
        cfg.db_driver,
        cfg.db_host,
        cfg.db_port,
        cfg.db_name,
        cfg.db_user,
        cfg.db_password,
        enc,
        trust,
    )


def get_connection(cfg: AppConfig):
    import pyodbc  # local import so the app can start even if driver isn't installed yet

    conn_str = build_connection_string(cfg)
    # autocommit off: endpoints can commit explicitly for write operations
    return pyodbc.connect(conn_str, autocommit=False, timeout=10)


def rows_to_dicts(cursor, rows: Sequence[Sequence[Any]]) -> list[dict[str, Any]]:
    cols = [c[0] for c in cursor.description] if cursor.description else []
    return [dict(zip(cols, r)) for r in rows]


def execute_select(
    cfg: AppConfig,
    sql: str,
    params: Sequence[Any] | None = None,
) -> list[dict[str, Any]]:
    with get_connection(cfg) as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        rows = cur.fetchall()
        return rows_to_dicts(cur, rows)


def execute_write(
    cfg: AppConfig,
    sql: str,
    params: Sequence[Any] | None = None,
) -> dict[str, Any]:
    """
    Executes INSERT/UPDATE/DELETE. Returns `{ rows_affected: int }`.
    """
    with get_connection(cfg) as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        rows_affected = cur.rowcount
        conn.commit()
        return {"rows_affected": rows_affected}


def execute_insert_returning_int(
    cfg: AppConfig,
    sql: str,
    params: Sequence[Any] | None = None,
) -> dict[str, Any]:
    """
    INSERT that returns one row via OUTPUT (e.g. OUTPUT INSERTED.BatchID).
    Returns `{ rows_affected: int, inserted_id: int | None }`.
    """
    with get_connection(cfg) as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        row = cur.fetchone()
        conn.commit()
        inserted_id = int(row[0]) if row and row[0] is not None else None
        return {"rows_affected": 1 if inserted_id is not None else 0, "inserted_id": inserted_id}


def execute_many(
    cfg: AppConfig,
    sql: str,
    params_seq: Iterable[Sequence[Any]],
) -> dict[str, Any]:
    with get_connection(cfg) as conn:
        cur = conn.cursor()
        cur.executemany(sql, list(params_seq))
        rows_affected = cur.rowcount
        conn.commit()
        return {"rows_affected": rows_affected}

