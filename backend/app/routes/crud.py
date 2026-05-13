from __future__ import annotations
 
from flask import Blueprint, current_app, jsonify, request
 
from app.db.connection import execute_select, execute_write
 
bp = Blueprint("crud", __name__, url_prefix="/api")
 
#input validation in private helper function 
def _require_fields(body: dict, *fields: str):
    #Checks that all required fields are present in the request body.
    #Returns an error response if any are missing, or None if all good
    for field in fields:
        if field not in body:
            return jsonify({
                "status": "error",
                "message": f"Missing required field: '{field}'"
            }), 400
    return None
 
 
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


#FIRST INSERT statement: insert a new harvest batch into the HarvestBatches table. It expects a JSON body with the req fields after someone sends a POST reuest
@bp.post("/harvest-batches")
def post_harvest_batch():
    #prevent crashing if invalid input 
    body = request.get_json(silent=True) or {}
 
    # Validate required fields using the helper func
    err = _require_fields(body, "FarmID", "CropTypeID", "HarvestDate",
                          "AvailableQuantityKG", "PricePerKG")
    if err:
        #continue
        return err
 
    farm_id = body["FarmID"]
    crop_type_id = body["CropTypeID"]
    #YYYY-MM-DD format expected for date input
    harvest_date = body["HarvestDate"]
    quantity_kg = body["AvailableQuantityKG"]
    price_per_kg = body["PricePerKG"]
    #Optional field with default value 
    is_available = body.get("IsAvailable", True)
 
    #Raw SQL INSERT,? placeholders prevent SQL injection, no ORM
    sql = """
        INSERT INTO HarvestBatches
            (FarmID, CropTypeID, HarvestDate, AvailableQuantityKG, PricePerKG, IsAvailable)
        VALUES
            (?, ?, ?, ?, ?, ?)
    """
    #get database connection settings
    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [farm_id, crop_type_id, harvest_date,
                                      quantity_kg, price_per_kg, is_available])
    #send success response with number of rows affected (should be 1 if successful)
    return jsonify({
        "status": "ok",
        "message": "Harvest batch added successfully.",
        "rows_affected": result["rows_affected"]
    }), 201
 
 
#SECOND INSERT statement: insert a new driver into the Drivers table. It expects a JSON body with the required fields after someone sends a POST request 
@bp.post("/drivers")
def post_driver():
    #prevent crashing if invalid input
    body = request.get_json(silent=True) or {}
    # Validate required fields using the helper func
    err = _require_fields(body, "FirstName", "LastName", "Phone")
    if err:
        #continue
        return err
    # strip() removes any extra whitespace from input
    first_name = body["FirstName"].strip()
    last_name = body["LastName"].strip()
    phone = body["Phone"].strip()
    #Check that required fields are not empty after stripping whitespace
    if not first_name or not last_name or not phone:
        return jsonify({
            "status": "error",
            "message": "FirstName, LastName, and Phone cannot be empty."
        }), 400
    #Raw SQL INSERT,? placeholders prevent SQL injection, no ORM
    sql = """
        INSERT INTO drivers (FirstName, LastName, Phone)
        VALUES (?, ?, ?)
    """
 
    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [first_name, last_name, phone])
 
    return jsonify({
        "status": "ok",
        "message": "Driver registered successfully.",
        "rows_affected": result["rows_affected"]
    }), 201
 
#FIRST UPDATE statement: update the PreferredDeliveryWindow for a specific restaurant in the Restaurants table
@bp.put("/restaurants/<restaurant_id>/delivery-window")
def put_restaurant_window(restaurant_id: str):
    body = request.get_json(silent=True) or {}
 
    err = _require_fields(body, "PreferredDeliveryWindow")
    if err:
        return err
 
    delivery_window = body["PreferredDeliveryWindow"].strip()
    if not delivery_window:
        return jsonify({
            "status": "error",
            "message": "PreferredDeliveryWindow cannot be empty."
        }), 400
 
    #WHERE RestaurantID = ? is the required condition for UPDATE
    sql = """
        UPDATE Restaurants
        SET PreferredDeliveryWindow = ?
        WHERE RestaurantID = ?
    """
    #get database connection settings
    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [delivery_window, restaurant_id])
 
    if result["rows_affected"] == 0:
        return jsonify({
            "status": "error",
            "message": f"No restaurant found with ID {restaurant_id}."
        }), 404
 
    return jsonify({
        "status": "ok",
        "message": f"Delivery window updated for restaurant {restaurant_id}.",
        "rows_affected": result["rows_affected"]
    }), 200
 
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
        return jsonify({
            "status": "error",
            "message": "TotalDistanceKM must be a positive number."
        }), 400
 
    # WHERE TripID = ? is the required condition for UPDATE
    sql = """
        UPDATE trips
        SET TotalDistanceKM = ?
        WHERE TripID = ?
    """
 
    cfg = current_app.config["APP_CONFIG"]
    result = execute_write(cfg, sql, [total_distance, trip_id])
 
    if result["rows_affected"] == 0:
        return jsonify({
            "status": "error",
            "message": f"No trip found with ID {trip_id}."
        }), 404
 
    return jsonify({
        "status": "ok",
        "message": f"Trip {trip_id} distance updated successfully.",
        "rows_affected": result["rows_affected"]
    }), 200
 
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
        return jsonify({
            "status": "error",
            "message": f"No order found with ID {order_id}."
        }), 404
 
    return jsonify({
        "status": "ok",
        "message": f"Order {order_id} cancelled successfully.",
        "rows_affected": result["rows_affected"]
    }), 200
 
 
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
        return jsonify({
            "status": "error",
            "message": (
                f"Batch {batch_id} was not removed. "
                "It either doesn't exist or has already been sold (IsAvailable = 0)."
            )
        }), 404
 
    return jsonify({
        "status": "ok",
        "message": f"Harvest batch {batch_id} removed successfully.",
        "rows_affected": result["rows_affected"]
    }), 200
 
 
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
                {"method": "POST", "path": "/api/harvest-batches"},
                {"method": "POST", "path": "/api/drivers"},
                {"method": "PUT", "pattern": "/api/restaurants/{id}/delivery-window"},
                {"method": "PUT", "pattern": "/api/trips/{id}/route"},
                {"method": "DELETE", "pattern": "/api/orders/{id}"},
                {"method": "DELETE", "pattern": "/api/harvest-batches/{id}"},
                {"method": "GET", "path": "/api/reports/top-crop"},
                {"method": "GET", "path": "/api/reports/inactive-farms"},
                {"method": "GET", "path": "/api/reports/top-driver"},
                {"method": "GET", "path": "/api/reports/inactive-restaurants"},
                {"method": "GET", "path": "/api/reports/batches-by-restaurant"},
                {"method": "GET", "path": "/api/reports/farm-revenue"},
            ],
        }
    ), 200