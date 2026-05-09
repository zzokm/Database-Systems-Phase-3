"""Shared JSON helpers for API responses."""

from __future__ import annotations

from typing import Any

from flask import jsonify


def json_ok(payload: dict[str, Any] | None = None, *, status: int = 200):
    body = {"status": "ok"}
    if payload:
        body.update(payload)
    return jsonify(body), status


def json_error(message: str, *, code: str = "error", status: int = 400, extra: dict | None = None):
    body = {"status": code, "message": message}
    if extra:
        body.update(extra)
    return jsonify(body), status


def json_not_implemented(
    *,
    endpoint: str,
    assigned_hint: str,
    method: str,
    status: int = 501,
):
    """Standard response for placeholders until Members 2–5 implement routes."""
    return (
        jsonify(
            {
                "status": "not_implemented",
                "http": status,
                "method": method,
                "endpoint": endpoint,
                "assigned_hint": assigned_hint,
                "message": (
                    "Route is registered but SQL/business logic is not implemented yet. "
                    "See WORK_ALLOCATION.md for ownership."
                ),
            }
        ),
        status,
    )
