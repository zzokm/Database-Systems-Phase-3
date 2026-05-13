"""
Registered API routes with correct URLs and HTTP methods.

Business logic / raw SQL is implemented by Members 2 (CRUD + utilities), 3–4 (reports), 5 (lookups).
This module returns HTTP 501 + JSON until those handlers replace the stubs.
"""

from __future__ import annotations

from flask import Blueprint
from app.responses import json_not_implemented
from flask import current_app, jsonify  
from app.db.connection import execute_select
bp = Blueprint("api_placeholder", __name__, url_prefix="/api")


# --- CRUD stubs (Member 2) ---
@bp.post("/harvest-batches")
def post_harvest_batch():
    return json_not_implemented(
        endpoint="POST /api/harvest-batches",
        assigned_hint="Member 2 (CRUD INSERT #1)",
        method="POST",
    )


@bp.post("/drivers")
def post_driver():
    return json_not_implemented(
        endpoint="POST /api/drivers",
        assigned_hint="Member 2 (CRUD INSERT #2)",
        method="POST",
    )


@bp.put("/restaurants/<restaurant_id>/delivery-window")
def put_restaurant_window(restaurant_id: str):
    return json_not_implemented(
        endpoint=f"PUT /api/restaurants/{restaurant_id}/delivery-window",
        assigned_hint="Member 2 (CRUD UPDATE #1)",
        method="PUT",
    )


@bp.put("/trips/<trip_id>/route")
def put_trip_route(trip_id: str):
    return json_not_implemented(
        endpoint=f"PUT /api/trips/{trip_id}/route",
        assigned_hint="Member 2 (CRUD UPDATE #2)",
        method="PUT",
    )


@bp.delete("/orders/<order_id>")
def delete_order(order_id: str):
    return json_not_implemented(
        endpoint=f"DELETE /api/orders/{order_id}",
        assigned_hint="Member 2 (CRUD DELETE #1)",
        method="DELETE",
    )


@bp.delete("/harvest-batches/<batch_id>")
def delete_harvest_batch(batch_id: str):
    return json_not_implemented(
        endpoint=f"DELETE /api/harvest-batches/{batch_id}",
        assigned_hint="Member 2 (CRUD DELETE #2)",
        method="DELETE",
    )


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
# --- Reports stubs (Members 3 & 4) ---

# MEMBER 3: Inquiries 1, 2, 3
@bp.get("/reports/top-crop")
def get_report_top_crop():
    from flask import current_app, jsonify
    from app.db.connection import execute_select
    
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT TOP 1
            ct.CropTypeName,
            COUNT(od.OrderDetailID) AS OrderCount
        FROM CropTypes ct
        JOIN HarvestBatches hb ON ct.CropTypeID = hb.CropTypeID
        JOIN OrderDetails od ON hb.BatchID = od.BatchID
        GROUP BY ct.CropTypeName
        ORDER BY OrderCount DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/reports/inactive-farms")
def get_report_inactive_farms():
    from flask import current_app, jsonify
    from app.db.connection import execute_select
    
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT DISTINCT
            f.FarmID,
            f.FarmName
        FROM Farms f
        LEFT JOIN HarvestBatches hb 
            ON f.FarmID = hb.FarmID
            AND hb.HarvestDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        LEFT JOIN OrderDetails od
            ON hb.BatchID = od.BatchID
        WHERE hb.BatchID IS NULL
           OR od.OrderDetailID IS NULL
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/reports/top-driver")
def get_report_top_driver():
    from flask import current_app, jsonify
    from app.db.connection import execute_select
    
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT TOP 1
            d.DriverID,
            d.FirstName + ' ' + d.LastName AS DriverName,
            COUNT(t.TripID) AS TripCount
        FROM Drivers d
        JOIN Trips t 
            ON d.DriverID = t.DriverID
        WHERE t.TripDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        GROUP BY d.DriverID, d.FirstName, d.LastName
        ORDER BY TripCount DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200
# @bp.get("/reports/inactive-restaurants")
# def get_report_inactive_restaurants():
#     pass


@bp.get("/meta/routes")
def api_meta():
    """Developer manifest: URLs that exist on the backend (implementations pending)."""
    from flask import jsonify

    return jsonify(
        {
            "status": "ok",
            "description": (
                "All listed routes exist. "
                '501 responses return `"not_implemented"` until handlers are completed.'
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
