-- Canonical SELECT / lookup queries used by GET /api/* (see backend/app/routes/crud.py).
-- Each block is tagged for loading via app.db.sql_files.

-- @name: farms
SELECT FarmID, FarmName, Location
FROM Farms
ORDER BY FarmName;

-- @name: restaurants
SELECT
    RestaurantID,
    RestaurantName,
    City,
    DeliveryAddress,
    PostalCode,
    PreferredDeliveryWindow,
    ContactPhone
FROM Restaurants
ORDER BY RestaurantName;

-- @name: trips
SELECT
    t.TripID,
    t.DriverID,
    t.TripDate,
    t.TotalDistanceKM,
    d.FirstName + N' ' + d.LastName AS DriverName
FROM Trips AS t
INNER JOIN Drivers AS d ON d.DriverID = t.DriverID
ORDER BY t.TripDate DESC, t.TripID DESC;

-- @name: orders_list
SELECT
    o.OrderID,
    o.RestaurantID,
    r.RestaurantName,
    o.OrderDate,
    o.Status
FROM Orders AS o
INNER JOIN Restaurants AS r ON r.RestaurantID = o.RestaurantID
ORDER BY o.OrderDate DESC, o.OrderID DESC;

-- @name: order_detail
SELECT
    o.OrderID,
    o.RestaurantID,
    r.RestaurantName,
    r.City,
    o.OrderDate,
    o.Status
FROM Orders AS o
INNER JOIN Restaurants AS r ON r.RestaurantID = o.RestaurantID
WHERE o.OrderID = ?;

-- @name: harvest_batches_list
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
INNER JOIN CropTypes AS ct ON ct.CropTypeID = hb.CropTypeID;

-- @name: drivers
SELECT DriverID, FirstName, LastName, Phone
FROM Drivers
ORDER BY LastName, FirstName;

-- @name: crop_types
SELECT CropTypeID, CropTypeName
FROM CropTypes
ORDER BY CropTypeName;

-- @name: farm_exists
SELECT 1 AS x FROM Farms WHERE FarmID = ?;

-- @name: crop_exists
SELECT 1 AS x FROM CropTypes WHERE CropTypeID = ?;

-- @name: driver_duplicate_check
SELECT DriverID FROM Drivers
WHERE (LTRIM(RTRIM(ISNULL(Phone, N''))) = ?)
   OR (FirstName = ? AND LastName = ?);
