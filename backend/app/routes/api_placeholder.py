"""
Non-CRUD API stubs: lookups (Member 5), reports (Members 3–4), route manifest.

Parameterized INSERT / UPDATE / DELETE live in ``app.routes.crud`` (M2-1b).
"""

from __future__ import annotations

from flask import Blueprint

from app.responses import json_not_implemented

bp = Blueprint("api_placeholder", __name__, url_prefix="/api")


# --- Lookup stubs (Member 5) ---
@bp.get("/farms")
def get_farms():
    return json_not_implemented(endpoint="GET /api/farms", assigned_hint="Member 5", method="GET")


@bp.get("/restaurants")
def get_restaurants():
    return json_not_implemented(
        endpoint="GET /api/restaurants", assigned_hint="Member 5", method="GET"
    )


@bp.get("/drivers")
def get_drivers_list():
    return json_not_implemented(endpoint="GET /api/drivers", assigned_hint="Member 5", method="GET")


@bp.get("/crop-types")
def get_crop_types():
    return json_not_implemented(
        endpoint="GET /api/crop-types", assigned_hint="Member 5", method="GET"
    )


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
