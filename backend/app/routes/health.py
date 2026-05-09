from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from app.db.connection import execute_select

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/ready")
def ready():
    cfg = current_app.config["APP_CONFIG"]
    # lightweight DB check
    rows = execute_select(cfg, "SELECT 1 AS ok")
    return jsonify({"status": "ok", "db": rows[0] if rows else {"ok": 1}})

