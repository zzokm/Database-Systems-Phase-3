from __future__ import annotations
 
from datetime import date, timedelta

from flask import Blueprint, current_app, jsonify, request

from app.db.connection import execute_insert_returning_int, execute_select, execute_write

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


def _error(message: str, *, code: str | None = None, field: str | None = None, http: int = 400):
    payload: dict = {"status": "error", "message": message}
    if code:
        payload["code"] = code
    if field:
        payload["field"] = field
    return jsonify(payload), http
 
 
# --- Lookup endpoints (Member 5) ---
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
        SELECT
            RestaurantID,
            RestaurantName,
            City,
            DeliveryAddress,
            PostalCode,
            PreferredDeliveryWindow,
            ContactPhone
        FROM Restaurants
        ORDER BY RestaurantName
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/trips")
def get_trips():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            t.TripID,
            t.DriverID,
            t.TripDate,
            t.TotalDistanceKM,
            d.FirstName + N' ' + d.LastName AS DriverName
        FROM Trips AS t
        INNER JOIN Drivers AS d ON d.DriverID = t.DriverID
        ORDER BY t.TripDate DESC, t.TripID DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/orders")
def get_orders_list():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            o.OrderID,
            o.RestaurantID,
            r.RestaurantName,
            o.OrderDate,
            o.Status
        FROM Orders AS o
        INNER JOIN Restaurants AS r ON r.RestaurantID = o.RestaurantID
        ORDER BY o.OrderDate DESC, o.OrderID DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200


@bp.get("/orders/<order_id>")
def get_order_detail(order_id: str):
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            o.OrderID,
            o.RestaurantID,
            r.RestaurantName,
            r.City,
            o.OrderDate,
            o.Status
        FROM Orders AS o
        INNER JOIN Restaurants AS r ON r.RestaurantID = o.RestaurantID
        WHERE o.OrderID = ?
    """
    rows = execute_select(cfg, sql, [order_id])
    if not rows:
        return _error(f"No order found with ID {order_id}.", code="NOT_FOUND", http=404)
    return jsonify({"status": "ok", "row": rows[0]}), 200


@bp.get("/harvest-batches")
def get_harvest_batches_list():
    cfg = current_app.config["APP_CONFIG"]
    only_available = request.args.get("available", "").lower() in ("1", "true", "yes")
    sql = """
        SELECT
            hb.BatchID,
            hb.FarmID,
            f.FarmName,
            hb.CropTypeID,
            ct.CropTypeName,
            hb.HarvestDate,
            hb.AvailableQuantityKG,
            hb.PricePerKG,
            hb.IsAvailable
        FROM HarvestBatches AS hb
        INNER JOIN Farms AS f ON f.FarmID = hb.FarmID
        INNER JOIN CropTypes AS ct ON ct.CropTypeID = hb.CropTypeID
    """
    if only_available:
        sql += " WHERE hb.IsAvailable = 1"
    sql += " ORDER BY hb.HarvestDate DESC, hb.BatchID DESC"
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


# --- Report endpoints (Members 3 & 4): analytical inquiries ---


@bp.get("/reports/top-crop")
def get_report_top_crop():
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

    farm_ok = execute_select(cfg, "SELECT 1 AS x FROM Farms WHERE FarmID = ?", [farm_id])
    if not farm_ok:
        return _error(
            f"No farm exists with FarmID {farm_id}.",
            field="FarmID",
            code="UNKNOWN_FARM",
        )

    crop_ok = execute_select(
        cfg, "SELECT 1 AS x FROM CropTypes WHERE CropTypeID = ?", [crop_type_id]
    )
    if not crop_ok:
        return _error(
            f"No crop type exists with CropTypeID {crop_type_id}.",
            field="CropTypeID",
            code="UNKNOWN_CROP_TYPE",
        )

    sql = """
        INSERT INTO HarvestBatches
            (FarmID, CropTypeID, HarvestDate, AvailableQuantityKG, PricePerKG, IsAvailable)
        OUTPUT INSERTED.BatchID
        VALUES
            (?, ?, ?, ?, ?, ?)
    """
    try:
        result = execute_insert_returning_int(
            cfg,
            sql,
            [
                farm_id,
                crop_type_id,
                harvest_date_raw[:10],
                q,
                p,
                1 if is_available else 0,
            ],
        )
    except Exception as ex:  # noqa: BLE001
        return _error(str(ex), code="DATABASE_ERROR")

    bid = result.get("inserted_id")
    return jsonify(
        {
            "status": "ok",
            "message": "Harvest batch added successfully.",
            "rows_affected": result["rows_affected"],
            "BatchID": bid,
        }
    ), 201


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
    dup = execute_select(
        cfg,
        """
        SELECT DriverID FROM Drivers
        WHERE (LTRIM(RTRIM(ISNULL(Phone, N''))) = ?)
           OR (FirstName = ? AND LastName = ?)
        """,
        [phone, first_name, last_name],
    )
    if dup:
        return _error(
            "A driver with this phone number or the same first and last name already exists.",
            code="DUPLICATE_DRIVER",
            http=409,
        )

    sql = """
        INSERT INTO Drivers (FirstName, LastName, Phone)
        OUTPUT INSERTED.DriverID
        VALUES (?, ?, ?)
    """
    try:
        result = execute_insert_returning_int(cfg, sql, [first_name, last_name, phone])
    except Exception as ex:  # noqa: BLE001
        return _error(str(ex), code="DATABASE_ERROR")

    return jsonify(
        {
            "status": "ok",
            "message": "Driver registered successfully.",
            "rows_affected": result["rows_affected"],
            "DriverID": result.get("inserted_id"),
        }
    ), 201
 
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

    sql = """
        UPDATE Restaurants
        SET PreferredDeliveryWindow = ?
        WHERE RestaurantID = ?
    """
    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [delivery_window, restaurant_id])

    if result["rows_affected"] == 0:
        return _error(
            f"No restaurant found with ID {restaurant_id}.",
            code="NOT_FOUND",
            field="RestaurantID",
            http=404,
        )

    return jsonify(
        {
            "status": "ok",
            "message": f"Delivery window updated for restaurant {restaurant_id}.",
            "rows_affected": result["rows_affected"],
        }
    ), 200
 
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

    sql = """
        UPDATE Trips
        SET TotalDistanceKM = ?
        WHERE TripID = ?
    """

    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [total_distance, trip_id])

    if result["rows_affected"] == 0:
        return _error(
            f"No trip found with ID {trip_id}.",
            code="NOT_FOUND",
            field="TripID",
            http=404,
        )

    return jsonify(
        {
            "status": "ok",
            "message": f"Trip {trip_id} distance updated successfully.",
            "rows_affected": result["rows_affected"],
        }
    ), 200
 
#FIRST DELETE statement: delete a specific order from Orders (TripOrders first; no CASCADE from Orders)
@bp.delete("/orders/<order_id>")
#order id from URL
def delete_order(order_id: str):
    cfg = current_app.config["APP_CONFIG"]
 
    # TripOrders references Orders without ON DELETE CASCADE. Remove those rows first
    sql_trip_orders = """
        DELETE FROM TripOrders
        WHERE OrderID = ?
    """
    execute_write(cfg, sql_trip_orders, [order_id])
 
    # OrderDetails CASCADE when Orders row is deleted; deleting the order is enough after TripOrders
    sql_order = """
        DELETE FROM Orders
        WHERE OrderID = ?
    """
    result = execute_write(cfg, sql_order, [order_id])
 
    if result["rows_affected"] == 0:
        return _error(
            f"No order found with ID {order_id}.",
            code="NOT_FOUND",
            field="OrderID",
            http=404,
        )

    return jsonify(
        {
            "status": "ok",
            "message": f"Order {order_id} cancelled successfully.",
            "rows_affected": result["rows_affected"],
        }
    ), 200
 
 
#SECOND DELETE statement: delete a specific harvest batch from the HarvestBatches table based on the provided batch_id, but only if it is still available (IsAvailable = 1)
@bp.delete("/harvest-batches/<batch_id>")
def delete_harvest_batch(batch_id: str):
    #get database connection settings
    cfg = current_app.config["APP_CONFIG"]
 
    # WHERE has two conditions: BatchID AND IsAvailable check
    sql = """
        DELETE FROM HarvestBatches
        WHERE BatchID = ? AND IsAvailable = 1
    """
    result = execute_write(cfg, sql, [batch_id])
 
    if result["rows_affected"] == 0:
        return _error(
            (
                f"Batch {batch_id} was not removed. "
                "It either does not exist or is not available for deletion (IsAvailable = 0)."
            ),
            code="NOT_FOUND",
            field="BatchID",
            http=404,
        )

    return jsonify(
        {
            "status": "ok",
            "message": f"Harvest batch {batch_id} removed successfully.",
            "rows_affected": result["rows_affected"],
        }
    ), 200
 
 
@bp.get("/reports/inactive-restaurants")
def get_report_inactive_restaurants():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            r.RestaurantID,
            r.RestaurantName,
            r.City,
            r.DeliveryAddress
        FROM Restaurants AS r
        WHERE r.RestaurantID NOT IN (
            SELECT o.RestaurantID
            FROM Orders AS o
            WHERE o.OrderDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        )
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200
 
 
@bp.get("/reports/batches-by-restaurant")
def get_report_batches_by_restaurant():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            r.RestaurantID,
            r.RestaurantName,
            o.OrderID,
            o.OrderDate,
            hb.BatchID,
            hb.CropTypeID,
            od.QuantityOrderedKG,
            od.UnitPriceAtOrder
        FROM Orders AS o
        JOIN Restaurants AS r ON o.RestaurantID = r.RestaurantID
        JOIN OrderDetails AS od ON od.OrderID = o.OrderID
        JOIN HarvestBatches AS hb ON hb.BatchID = od.BatchID
        WHERE o.Status = 'Delivered'
          AND o.OrderDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        ORDER BY r.RestaurantName, o.OrderDate DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200
 
 
@bp.get("/reports/farm-revenue")
def get_report_farm_revenue():
    cfg = current_app.config["APP_CONFIG"]
    sql = """
        SELECT
            f.FarmID,
            f.FarmName,
            SUM(od.QuantityOrderedKG * od.UnitPriceAtOrder) AS TotalRevenue
        FROM Farms AS f
        JOIN HarvestBatches AS hb ON hb.FarmID = f.FarmID
        JOIN OrderDetails AS od ON od.BatchID = hb.BatchID
        GROUP BY f.FarmID, f.FarmName
        ORDER BY TotalRevenue DESC
    """
    rows = execute_select(cfg, sql)
    return jsonify({"status": "ok", "rows": rows}), 200
 
 
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