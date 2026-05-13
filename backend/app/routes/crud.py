from __future__ import annotations
 
from datetime import date, timedelta

from flask import Blueprint, current_app, jsonify, request

from app.db.connection import execute_insert_returning_int, execute_select, execute_write
from app.db.sql_preview import sql_for_display
from app.db.sql_files import SQL

bp = Blueprint("crud", __name__, url_prefix="/api")


def _require_fields(body: dict, *fields: str):
    """Return a (jsonify tuple) error if any field is missing, else None."""
    for field in fields:
        if field not in body:
            return jsonify(
                {
                    "status": "error",
                    "code": "MISSING_FIELD",
                    "field": field,
                    "message": f"Missing required field: '{field}'",
                }
            ), 400
    return None


def _error(
    message: str,
    *,
    code: str | None = None,
    field: str | None = None,
    http: int = 400,
    sql_executed: list[str] | None = None,
):
    payload: dict = {"status": "error", "message": message}
    if code:
        payload["code"] = code
    if field:
        payload["field"] = field
    if sql_executed is not None:
        payload["sql_executed"] = sql_executed
    return jsonify(payload), http


def _ok(data: dict, http: int = 200, *, sql_executed: list[str] | None = None):
    out = dict(data)
    if sql_executed is not None:
        out["sql_executed"] = sql_executed
    return jsonify(out), http
 
 
# --- Lookup endpoints (Member 5) ---
@bp.get("/farms")
def get_farms():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["farms"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/restaurants")
def get_restaurants():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["restaurants"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.get("/trips")
def get_trips():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["trips"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.get("/orders")
def get_orders_list():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["orders_list"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.get("/orders/<order_id>")
def get_order_detail(order_id: str):
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["order_detail"]
    rows = execute_select(cfg, sql, [order_id])
    if not rows:
        return _error(
            f"No order found with ID {order_id}.",
            code="NOT_FOUND",
            http=404,
            sql_executed=[sql_for_display(sql, [order_id])],
        )
    return _ok(
        {"status": "ok", "row": rows[0]},
        sql_executed=[sql_for_display(sql, [order_id])],
    )


@bp.get("/harvest-batches")
def get_harvest_batches_list():
    cfg = current_app.config["APP_CONFIG"]
    only_available = request.args.get("available", "").lower() in ("1", "true", "yes")
    sql = SQL.read["harvest_batches_list"].strip()
    if only_available:
        sql = f"{sql}\nWHERE hb.IsAvailable = 1"
    sql = f"{sql}\nORDER BY hb.HarvestDate DESC, hb.BatchID DESC"
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/drivers")
def get_drivers_list():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["drivers"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/crop-types")
def get_crop_types():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.read["crop_types"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


# --- Report endpoints (Members 3 & 4): analytical inquiries ---


@bp.get("/reports/top-crop")
def get_report_top_crop():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_123["top_crop"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.get("/reports/inactive-farms")
def get_report_inactive_farms():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_123["inactive_farms"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.get("/reports/top-driver")
def get_report_top_driver():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_123["top_driver"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])


@bp.post("/harvest-batches")
def post_harvest_batch():
    body = request.get_json(silent=True) or {}
    err = _require_fields(
        body, "FarmID", "CropTypeID", "HarvestDate", "AvailableQuantityKG", "PricePerKG"
    )
    if err:
        return err

    try:
        farm_id = int(body["FarmID"])
        crop_type_id = int(body["CropTypeID"])
    except (TypeError, ValueError):
        return _error(
            "FarmID and CropTypeID must be integers.",
            field="FarmID",
            code="INVALID_INT",
        )

    harvest_date_raw = str(body["HarvestDate"]).strip()
    quantity_kg = body["AvailableQuantityKG"]
    price_per_kg = body["PricePerKG"]
    is_available = bool(body.get("IsAvailable", True))

    try:
        hd = date.fromisoformat(harvest_date_raw[:10])
    except ValueError:
        return _error(
            "HarvestDate must be a valid date (YYYY-MM-DD).",
            field="HarvestDate",
            code="INVALID_DATE",
        )

    if hd > date.today() + timedelta(days=365):
        return _error(
            "HarvestDate is too far in the future.",
            field="HarvestDate",
            code="INVALID_DATE",
        )

    try:
        q = float(quantity_kg)
        p = float(price_per_kg)
    except (TypeError, ValueError):
        return _error(
            "AvailableQuantityKG and PricePerKG must be numbers.",
            code="INVALID_NUMBER",
        )

    if q <= 0 or p <= 0:
        return _error(
            "AvailableQuantityKG and PricePerKG must be greater than zero.",
            code="CHECK_VIOLATION",
        )

    cfg = current_app.config["APP_CONFIG"]

    sql_farm = SQL.read["farm_exists"]
    farm_ok = execute_select(cfg, sql_farm, [farm_id])
    if not farm_ok:
        return _error(
            f"No farm exists with FarmID {farm_id}.",
            field="FarmID",
            code="UNKNOWN_FARM",
            sql_executed=[sql_for_display(sql_farm, [farm_id])],
        )

    sql_crop = SQL.read["crop_exists"]
    crop_ok = execute_select(cfg, sql_crop, [crop_type_id])
    if not crop_ok:
        return _error(
            f"No crop type exists with CropTypeID {crop_type_id}.",
            field="CropTypeID",
            code="UNKNOWN_CROP_TYPE",
            sql_executed=[
                sql_for_display(sql_farm, [farm_id]),
                sql_for_display(sql_crop, [crop_type_id]),
            ],
        )

    sql = SQL.insert["insert_harvest_batch"]
    insert_params = [
        farm_id,
        crop_type_id,
        harvest_date_raw[:10],
        q,
        p,
        1 if is_available else 0,
    ]
    try:
        result = execute_insert_returning_int(
            cfg,
            sql,
            insert_params,
        )
    except Exception as ex:  # noqa: BLE001
        return _error(
            str(ex),
            code="DATABASE_ERROR",
            sql_executed=[
                sql_for_display(sql_farm, [farm_id]),
                sql_for_display(sql_crop, [crop_type_id]),
                sql_for_display(sql, insert_params),
            ],
        )

    bid = result.get("inserted_id")
    return _ok(
        {
            "status": "ok",
            "message": "Harvest batch added successfully.",
            "rows_affected": result["rows_affected"],
            "BatchID": bid,
        },
        201,
        sql_executed=[
            sql_for_display(sql_farm, [farm_id]),
            sql_for_display(sql_crop, [crop_type_id]),
            sql_for_display(sql, insert_params),
        ],
    )


@bp.post("/drivers")
def post_driver():
    body = request.get_json(silent=True) or {}
    err = _require_fields(body, "FirstName", "LastName", "Phone")
    if err:
        return err

    first_name = body["FirstName"].strip()
    last_name = body["LastName"].strip()
    phone = body["Phone"].strip()
    if not first_name or not last_name or not phone:
        return _error(
            "FirstName, LastName, and Phone cannot be empty.",
            code="EMPTY_FIELD",
        )

    max_name, max_phone = 50, 20
    if len(first_name) > max_name or len(last_name) > max_name:
        return _error(
            "First and last name must be at most 50 characters.",
            code="FIELD_TOO_LONG",
        )
    if len(phone) > max_phone:
        return _error(
            "Phone must be at most 20 characters.",
            field="Phone",
            code="FIELD_TOO_LONG",
        )

    cfg = current_app.config["APP_CONFIG"]
    sql_dup = SQL.read["driver_duplicate_check"]
    dup = execute_select(
        cfg,
        sql_dup,
        [phone, first_name, last_name],
    )
    if dup:
        return _error(
            "A driver with this phone number or the same first and last name already exists.",
            code="DUPLICATE_DRIVER",
            http=409,
            sql_executed=[sql_for_display(sql_dup, [phone, first_name, last_name])],
        )

    sql = SQL.insert["insert_driver"]
    driver_params = [first_name, last_name, phone]
    try:
        result = execute_insert_returning_int(cfg, sql, driver_params)
    except Exception as ex:  # noqa: BLE001
        return _error(
            str(ex),
            code="DATABASE_ERROR",
            sql_executed=[
                sql_for_display(sql_dup, [phone, first_name, last_name]),
                sql_for_display(sql, driver_params),
            ],
        )

    return _ok(
        {
            "status": "ok",
            "message": "Driver registered successfully.",
            "rows_affected": result["rows_affected"],
            "DriverID": result.get("inserted_id"),
        },
        201,
        sql_executed=[
            sql_for_display(sql_dup, [phone, first_name, last_name]),
            sql_for_display(sql, driver_params),
        ],
    )
 
#FIRST UPDATE statement: update the PreferredDeliveryWindow for a specific restaurant in the Restaurants table
@bp.put("/restaurants/<restaurant_id>/delivery-window")
def put_restaurant_window(restaurant_id: str):
    body = request.get_json(silent=True) or {}
 
    err = _require_fields(body, "PreferredDeliveryWindow")
    if err:
        return err
 
    delivery_window = body["PreferredDeliveryWindow"].strip()
    if not delivery_window:
        return _error("PreferredDeliveryWindow cannot be empty.", field="PreferredDeliveryWindow")

    sql = SQL.update["update_restaurant_delivery_window"]
    cfg = current_app.config["APP_CONFIG"]
    rw_params = [delivery_window, restaurant_id]
    result = execute_write(cfg, sql, rw_params)

    if result["rows_affected"] == 0:
        return _error(
            f"No restaurant found with ID {restaurant_id}.",
            code="NOT_FOUND",
            field="RestaurantID",
            http=404,
            sql_executed=[sql_for_display(sql, rw_params)],
        )

    return _ok(
        {
            "status": "ok",
            "message": f"Delivery window updated for restaurant {restaurant_id}.",
            "rows_affected": result["rows_affected"],
        },
        sql_executed=[sql_for_display(sql, rw_params)],
    )
 
#SECOND UPDATE statement: update the route and TotalDistanceKM for a specific trip in the Trips table
@bp.put("/trips/<trip_id>/route")
#trip id from URL
def put_trip_route(trip_id: str):
    body = request.get_json(silent=True) or {}
 
    err = _require_fields(body, "TotalDistanceKM")
    if err:
        return err
    
    total_distance = body["TotalDistanceKM"]
    #validate that TotalDistanceKM is a positive number not string or neg number
    if not isinstance(total_distance, (int, float)) or total_distance < 0:
        return _error(
            "TotalDistanceKM must be a non-negative number.",
            field="TotalDistanceKM",
            code="INVALID_NUMBER",
        )

    sql = SQL.update["update_trip_distance"]

    cfg = current_app.config["APP_CONFIG"]
    trip_params = [total_distance, trip_id]
    result = execute_write(cfg, sql, trip_params)

    if result["rows_affected"] == 0:
        return _error(
            f"No trip found with ID {trip_id}.",
            code="NOT_FOUND",
            field="TripID",
            http=404,
            sql_executed=[sql_for_display(sql, trip_params)],
        )

    return _ok(
        {
            "status": "ok",
            "message": f"Trip {trip_id} distance updated successfully.",
            "rows_affected": result["rows_affected"],
        },
        sql_executed=[sql_for_display(sql, trip_params)],
    )
 
#FIRST DELETE statement: delete a specific order from Orders (TripOrders first; no CASCADE from Orders)
@bp.delete("/orders/<order_id>")
#order id from URL
def delete_order(order_id: str):
    cfg = current_app.config["APP_CONFIG"]

    sql_trip_orders = SQL.delete["delete_trip_orders_by_order"]
    execute_write(cfg, sql_trip_orders, [order_id])

    sql_order = SQL.delete["delete_order_by_id"]
    result = execute_write(cfg, sql_order, [order_id])
    oid_param = [order_id]

    if result["rows_affected"] == 0:
        return _error(
            f"No order found with ID {order_id}.",
            code="NOT_FOUND",
            field="OrderID",
            http=404,
            sql_executed=[
                sql_for_display(sql_trip_orders, oid_param),
                sql_for_display(sql_order, oid_param),
            ],
        )

    return _ok(
        {
            "status": "ok",
            "message": f"Order {order_id} cancelled successfully.",
            "rows_affected": result["rows_affected"],
        },
        sql_executed=[
            sql_for_display(sql_trip_orders, oid_param),
            sql_for_display(sql_order, oid_param),
        ],
    )
 
 
#SECOND DELETE statement: delete a specific harvest batch from the HarvestBatches table based on the provided batch_id, but only if it is still available (IsAvailable = 1)
@bp.delete("/harvest-batches/<batch_id>")
def delete_harvest_batch(batch_id: str):
    #get database connection settings
    cfg = current_app.config["APP_CONFIG"]

    # WHERE has two conditions: BatchID AND IsAvailable check
    sql = SQL.delete["delete_harvest_batch_when_available"]
    batch_param = [batch_id]
    result = execute_write(cfg, sql, batch_param)

    if result["rows_affected"] == 0:
        return _error(
            (
                f"Batch {batch_id} was not removed. "
                "It either does not exist or is not available for deletion (IsAvailable = 0)."
            ),
            code="NOT_FOUND",
            field="BatchID",
            http=404,
            sql_executed=[sql_for_display(sql, batch_param)],
        )

    return _ok(
        {
            "status": "ok",
            "message": f"Harvest batch {batch_id} removed successfully.",
            "rows_affected": result["rows_affected"],
        },
        sql_executed=[sql_for_display(sql, batch_param)],
    )
 
 
@bp.get("/reports/inactive-restaurants")
def get_report_inactive_restaurants():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_456["inactive_restaurants"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/reports/batches-by-restaurant")
def get_report_batches_by_restaurant():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_456["batches_by_restaurant"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/reports/farm-revenue")
def get_report_farm_revenue():
    cfg = current_app.config["APP_CONFIG"]
    sql = SQL.reports_456["farm_revenue"]
    rows = execute_select(cfg, sql)
    return _ok({"status": "ok", "rows": rows}, sql_executed=[sql_for_display(sql)])
 
 
@bp.get("/meta/routes")
def api_meta():
    return jsonify(
        {
            "status": "ok",
            "description": (
                "Registered backend routes for the Flask API. "
                "Use these slugs to verify your report endpoints."
            ),
            "routes": [
                {"method": "GET", "path": "/api/meta/routes"},
                {"method": "GET", "path": "/api/farms"},
                {"method": "GET", "path": "/api/restaurants"},
                {"method": "GET", "path": "/api/drivers"},
                {"method": "GET", "path": "/api/crop-types"},
                {"method": "GET", "path": "/api/reports/top-crop"},
                {"method": "GET", "path": "/api/reports/inactive-farms"},
                {"method": "GET", "path": "/api/reports/top-driver"},
                {"method": "GET", "path": "/api/trips"},
                {"method": "GET", "path": "/api/orders"},
                {"method": "GET", "pattern": "/api/orders/{id}"},
                {"method": "GET", "path": "/api/harvest-batches"},
                {"method": "GET", "path": "/api/harvest-batches?available=1"},
                {"method": "POST", "path": "/api/harvest-batches"},
                {"method": "POST", "path": "/api/drivers"},
                {"method": "PUT", "pattern": "/api/restaurants/{id}/delivery-window"},
                {"method": "PUT", "pattern": "/api/trips/{id}/route"},
                {"method": "DELETE", "pattern": "/api/orders/{id}"},
                {"method": "DELETE", "pattern": "/api/harvest-batches/{id}"},
                {"method": "GET", "path": "/api/reports/inactive-restaurants"},
                {"method": "GET", "path": "/api/reports/batches-by-restaurant"},
                {"method": "GET", "path": "/api/reports/farm-revenue"},
            ],
        }
    ), 200