"""
Non-CRUD API stubs: lookups (Member 5), reports (Members 3–4), route manifest.

Parameterized INSERT / UPDATE / DELETE live in ``app.routes.crud`` (M2-1b).
"""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from app.db.connection import execute_select
from app.responses import json_not_implemented

bp = Blueprint("api_placeholder", __name__, url_prefix="/api")


# --- Lookup stubs (Member 5) ---
@bp.get("/farms")
def get_farms():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT FarmID, FarmName, Location
        FROM Farms
        ORDER BY FarmName
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/restaurants")
def get_restaurants():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT RestaurantID, RestaurantName, City, DeliveryAddress
        FROM Restaurants
        ORDER BY RestaurantName
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/drivers")
def get_drivers_list():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT DriverID, FirstName, LastName, Phone
        FROM Drivers
        ORDER BY LastName, FirstName
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/crop-types")
def get_crop_types():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT CropTypeID, CropTypeName
        FROM CropTypes
        ORDER BY CropTypeName
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


# --- Reports stubs (Members 3 & 4) ---
@bp.get("/reports/<report_slug>")
def get_report_placeholder(report_slug: str):
    return json_not_implemented(
        endpoint=f"GET /api/reports/{report_slug}",
        assigned_hint="Members 3–4",
        method="GET",
    )


@bp.get("/meta/routes")
def api_meta():
    """Developer manifest: URLs that exist on the backend (implementations pending)."""
    from flask import jsonify

    return jsonify(
        {
            "status": "ok",
            "description": (
                "CRUD routes under /api (harvest-batches, drivers, restaurants, trips, orders) "
                "are implemented with parameterized SQL in the crud blueprint. "
                "Lookups and report slugs below may still return 501 until Members 5 and 3–4 ship handlers."
            ),
            "routes": [
                {"method": "GET", "path": "/health"},
                {"method": "GET", "path": "/ready"},
                {"method": "GET", "path": "/api/meta/routes"},
                {"method": "POST", "path": "/api/harvest-batches"},
                {"method": "POST", "path": "/api/drivers"},
                {"method": "PUT", "pattern": "/api/restaurants/{id}/delivery-window"},
                {"method": "PUT", "pattern": "/api/trips/{id}/route"},
                {"method": "DELETE", "pattern": "/api/orders/{id}"},
                {"method": "DELETE", "pattern": "/api/harvest-batches/{id}"},
                {"method": "GET", "path": "/api/farms"},
                {"method": "GET", "path": "/api/restaurants"},
                {"method": "GET", "path": "/api/drivers"},
                {"method": "GET", "path": "/api/crop-types"},
                {"method": "GET", "pattern": "/api/reports/{slug}"},
            ],
        }
    )
