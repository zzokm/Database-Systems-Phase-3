"""Human-readable SQL strings for API ``sql_executed`` (display only, never executed)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Sequence


def _sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if value == int(value) and abs(value) < 1e15:
            return str(int(value))
        return repr(value)
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, datetime):
        return "N'" + value.strftime("%Y-%m-%d %H:%M:%S").replace("'", "''") + "'"
    if isinstance(value, date):
        return "N'" + value.isoformat().replace("'", "''") + "'"
    if isinstance(value, str):
        return "N'" + value.replace("'", "''") + "'"
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return "N'" + str(value).replace("'", "''") + "'"


def sql_for_display(sql: str, params: Sequence[Any] | None = None) -> str:
    """
    Expand ODBC ``?`` placeholders into T-SQL-style literals for logging / JSON.

    The real execution path remains parameterized (``execute_*``); this output
    is only so clients can copy-paste a representative statement.
    """
    seq = tuple(params) if params is not None else ()
    if "?" not in sql:
        if seq:
            return (
                sql
                + "\n/* note: params were passed to the driver but this text has no ? placeholders: "
                + repr(list(seq))
                + " */"
            )
        return sql

    out: list[str] = []
    it = iter(seq)
    for ch in sql:
        if ch == "?":
            try:
                out.append(_sql_literal(next(it)))
            except StopIteration:
                out.append("? /*missing bound value*/")
        else:
            out.append(ch)
    rest = list(it)
    if rest:
        out.append("\n/* unused bound values: ")
        out.append(repr(rest))
        out.append(" */")
    return "".join(out)
