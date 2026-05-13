-- Member 3–4 analytical inquiries 4–6 (GET /api/reports/inactive-restaurants, batches-by-restaurant, farm-revenue).
USE FarmDB;
GO

-- @name: inactive_restaurants
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
);

-- @name: batches_by_restaurant
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
ORDER BY r.RestaurantName, o.OrderDate DESC;

-- @name: farm_revenue
SELECT
    f.FarmID,
    f.FarmName,
    SUM(od.QuantityOrderedKG * od.UnitPriceAtOrder) AS TotalRevenue
FROM Farms AS f
JOIN HarvestBatches AS hb ON hb.FarmID = f.FarmID
JOIN OrderDetails AS od ON od.BatchID = hb.BatchID
GROUP BY f.FarmID, f.FarmName
ORDER BY TotalRevenue DESC;
