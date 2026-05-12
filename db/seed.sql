/*
  seed.sql (SQL Server / T-SQL)
  Demo / mock data matching the former block in schema.sql.

  Rerunnable: removes prior rows keyed by this script's natural identifiers
  (farm names, restaurant names, driver phones, crop type names), then inserts
  fresh rows. Relative dates use GETDATE() at execution time (same behavior
  as the original seed).

  Prerequisite: run db/schema.sql first (tables must exist). Uses database FarmDB.
*/

USE FarmDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

-------------------------------------------------------------------------------
-- Seed identity lists (edit only if you rename demo entities in the INSERTs)
-------------------------------------------------------------------------------
DECLARE @SeedFarmNames TABLE (FarmName NVARCHAR(100) PRIMARY KEY);
INSERT INTO @SeedFarmNames (FarmName) VALUES
    (N'Green Valley Farm'), (N'El-Nile Organics'), (N'Sunrise Acres'),
    (N'Wadi El-Natrun Fields'), (N'Upper Egypt Harvest'), (N'Delta Fresh Co-op'),
    (N'Sinai Herbs Farm'), (N'Oasis Produce');

DECLARE @SeedRestaurantNames TABLE (RestaurantName NVARCHAR(100) PRIMARY KEY);
INSERT INTO @SeedRestaurantNames (RestaurantName) VALUES
    (N'Riverside Bistro'), (N'Garden Kitchen'), (N'Alex Sea Grill'),
    (N'Zamalek Brasserie'), (N'Fayoum Farmhouse'), (N'Delta Diner'),
    (N'Sinai Spice House'), (N'Minya Mezze'), (N'Old Town Eatery'),
    (N'No Orders Cafe');

DECLARE @SeedDriverPhones TABLE (Phone NVARCHAR(20) PRIMARY KEY);
INSERT INTO @SeedDriverPhones (Phone) VALUES
    (N'+20-111-000-0001'), (N'+20-111-000-0002'), (N'+20-111-000-0003'),
    (N'+20-111-000-0004'), (N'+20-111-000-0005');

DECLARE @SeedCropNames TABLE (CropTypeName NVARCHAR(50) PRIMARY KEY);
INSERT INTO @SeedCropNames (CropTypeName) VALUES
    (N'Tomato'), (N'Cucumber'), (N'Lettuce'), (N'Potato'), (N'Basil'),
    (N'Onion'), (N'Garlic'), (N'Pepper'), (N'Eggplant'), (N'Mint');

-------------------------------------------------------------------------------
-- Remove existing demo rows (dependency-safe order)
-------------------------------------------------------------------------------
DELETE dbo.TripOrders
WHERE TripID IN (
        SELECT t.TripID
        FROM dbo.Trips t
        INNER JOIN dbo.Drivers d ON d.DriverID = t.DriverID
        WHERE d.Phone IN (SELECT Phone FROM @SeedDriverPhones)
    );

DELETE dbo.Trips
WHERE DriverID IN (
        SELECT DriverID FROM dbo.Drivers WHERE Phone IN (SELECT Phone FROM @SeedDriverPhones)
    );

DELETE dbo.Orders
WHERE RestaurantID IN (
        SELECT r.RestaurantID
        FROM dbo.Restaurants r
        WHERE r.RestaurantName IN (SELECT RestaurantName FROM @SeedRestaurantNames)
    );

DELETE dbo.HarvestBatches
WHERE FarmID IN (
        SELECT f.FarmID FROM dbo.Farms f WHERE f.FarmName IN (SELECT FarmName FROM @SeedFarmNames)
    );

DELETE dbo.FarmCropSpecialties
WHERE FarmID IN (
        SELECT f.FarmID FROM dbo.Farms f WHERE f.FarmName IN (SELECT FarmName FROM @SeedFarmNames)
    );

DELETE dbo.Restaurants
WHERE RestaurantName IN (SELECT RestaurantName FROM @SeedRestaurantNames);

DELETE dbo.Drivers
WHERE Phone IN (SELECT Phone FROM @SeedDriverPhones);

DELETE dbo.Farms
WHERE FarmName IN (SELECT FarmName FROM @SeedFarmNames);

-- CropTypes: only remove seed crop names if nothing else references them
DELETE c
FROM dbo.CropTypes c
WHERE c.CropTypeName IN (SELECT CropTypeName FROM @SeedCropNames)
  AND NOT EXISTS (SELECT 1 FROM dbo.HarvestBatches hb WHERE hb.CropTypeID = c.CropTypeID)
  AND NOT EXISTS (SELECT 1 FROM dbo.FarmCropSpecialties f WHERE f.CropTypeID = c.CropTypeID);

-------------------------------------------------------------------------------
-- Dimension rows
-------------------------------------------------------------------------------
INSERT INTO dbo.Farms (FarmName, Location) VALUES
    (N'Green Valley Farm',        N'Giza, Egypt'),
    (N'El-Nile Organics',         N'Qalyubia, Egypt'),
    (N'Sunrise Acres',            N'Alexandria, Egypt'),
    (N'Wadi El-Natrun Fields',    N'Beheira, Egypt'),
    (N'Upper Egypt Harvest',      N'Minya, Egypt'),
    (N'Delta Fresh Co-op',        N'Dakahlia, Egypt'),
    (N'Sinai Herbs Farm',         N'North Sinai, Egypt'),
    (N'Oasis Produce',            N'Fayoum, Egypt');

INSERT INTO dbo.CropTypes (CropTypeName)
SELECT v.CropTypeName
FROM (VALUES
    (N'Tomato'), (N'Cucumber'), (N'Lettuce'), (N'Potato'), (N'Basil'),
    (N'Onion'), (N'Garlic'), (N'Pepper'), (N'Eggplant'), (N'Mint')
) AS v(CropTypeName)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.CropTypes c WHERE c.CropTypeName = v.CropTypeName
);

INSERT INTO dbo.FarmCropSpecialties (FarmID, CropTypeID)
SELECT f.FarmID, c.CropTypeID
FROM (VALUES
    (N'Green Valley Farm', N'Tomato'), (N'Green Valley Farm', N'Lettuce'),
    (N'Green Valley Farm', N'Basil'), (N'Green Valley Farm', N'Pepper'),
    (N'El-Nile Organics', N'Tomato'), (N'El-Nile Organics', N'Cucumber'),
    (N'El-Nile Organics', N'Potato'), (N'El-Nile Organics', N'Onion'),
    (N'Sunrise Acres', N'Cucumber'), (N'Sunrise Acres', N'Lettuce'),
    (N'Sunrise Acres', N'Potato'), (N'Sunrise Acres', N'Eggplant'),
    (N'Wadi El-Natrun Fields', N'Potato'), (N'Wadi El-Natrun Fields', N'Onion'),
    (N'Wadi El-Natrun Fields', N'Garlic'),
    (N'Upper Egypt Harvest', N'Tomato'), (N'Upper Egypt Harvest', N'Onion'),
    (N'Upper Egypt Harvest', N'Pepper'), (N'Upper Egypt Harvest', N'Eggplant'),
    (N'Delta Fresh Co-op', N'Cucumber'), (N'Delta Fresh Co-op', N'Potato'),
    (N'Delta Fresh Co-op', N'Onion'), (N'Delta Fresh Co-op', N'Pepper'),
    (N'Sinai Herbs Farm', N'Basil'), (N'Sinai Herbs Farm', N'Mint'),
    (N'Oasis Produce', N'Tomato'), (N'Oasis Produce', N'Cucumber'),
    (N'Oasis Produce', N'Lettuce'), (N'Oasis Produce', N'Pepper')
) AS v(FarmName, CropTypeName)
INNER JOIN dbo.Farms f ON f.FarmName = v.FarmName
INNER JOIN dbo.CropTypes c ON c.CropTypeName = v.CropTypeName;

INSERT INTO dbo.HarvestBatches
    (FarmID, CropTypeID, HarvestDate, AvailableQuantityKG, PricePerKG, IsAvailable)
SELECT f.FarmID, c.CropTypeID,
       CAST(DATEADD(DAY, v.DayOffset, GETDATE()) AS DATE),
       v.AvailableQuantityKG, v.PricePerKG, v.IsAvailable
FROM (VALUES
    (N'Green Valley Farm', N'Tomato',   -12, 500.00, 22.50, 1),
    (N'Green Valley Farm', N'Lettuce',   -8, 180.00, 18.00, 1),
    (N'Green Valley Farm', N'Pepper',    -5, 140.00, 28.00, 1),
    (N'El-Nile Organics', N'Cucumber',   -15, 350.00, 14.75, 1),
    (N'El-Nile Organics', N'Potato',     -20, 900.00,  9.50, 1),
    (N'El-Nile Organics', N'Onion',      -9, 260.00, 11.25, 1),
    (N'Sunrise Acres', N'Lettuce',       -6, 220.00, 19.25, 1),
    (N'Sunrise Acres', N'Potato',       -25, 750.00, 10.25, 1),
    (N'Sunrise Acres', N'Eggplant',     -11, 130.00, 23.00, 1),
    (N'Wadi El-Natrun Fields', N'Garlic', -14,  90.00, 35.00, 1),
    (N'Wadi El-Natrun Fields', N'Onion',  -7, 410.00, 10.00, 1),
    (N'Upper Egypt Harvest', N'Tomato',   -4, 300.00, 21.00, 1),
    (N'Delta Fresh Co-op', N'Pepper',     -18, 160.00, 27.50, 0),
    (N'Sinai Herbs Farm', N'Basil',       -3,  45.00, 45.00, 1),
    (N'Sinai Herbs Farm', N'Mint',        -2,  55.00, 32.00, 1),
    (N'Oasis Produce', N'Cucumber',      -21, 240.00, 15.50, 1),
    (N'Wadi El-Natrun Fields', N'Potato', -60, 600.00,  8.75, 1),
    (N'Upper Egypt Harvest', N'Eggplant', -75, 120.00, 22.00, 1),
    (N'Delta Fresh Co-op', N'Cucumber',    -45, 180.00, 13.00, 1),
    (N'Oasis Produce', N'Tomato',        -90, 260.00, 20.00, 1)
) AS v(FarmName, CropTypeName, DayOffset, AvailableQuantityKG, PricePerKG, IsAvailable)
INNER JOIN dbo.Farms f ON f.FarmName = v.FarmName
INNER JOIN dbo.CropTypes c ON c.CropTypeName = v.CropTypeName;

INSERT INTO dbo.Restaurants
    (RestaurantName, DeliveryAddress, City, PostalCode, PreferredDeliveryWindow, ContactPhone)
VALUES
    (N'Riverside Bistro',     N'12 Corniche St',         N'Cairo',      N'11511', N'10:00-12:00', N'+20-100-000-0001'),
    (N'Garden Kitchen',       N'8 El Tahrir Square',     N'Giza',       N'12611', N'12:00-14:00', N'+20-100-000-0002'),
    (N'Alex Sea Grill',       N'55 Saad Zaghloul',       N'Alexandria', N'21500', N'14:00-16:00', N'+20-100-000-0003'),
    (N'Zamalek Brasserie',    N'19 26th of July St',     N'Cairo',      N'11211', N'11:00-13:00', N'+20-100-000-0004'),
    (N'Fayoum Farmhouse',     N'Fayoum Lake Road KM 7',  N'Fayoum',     N'63511', N'09:00-11:00', N'+20-100-000-0005'),
    (N'Delta Diner',          N'3 Al-Geish St',          N'Mansoura',   N'35511', N'13:00-15:00', N'+20-100-000-0006'),
    (N'Sinai Spice House',    N'1 Peace Ave',            N'Arish',      NULL,     N'16:00-18:00', N'+20-100-000-0007'),
    (N'Minya Mezze',          N'10 University St',       N'Minya',      N'61111', N'12:00-14:00', N'+20-100-000-0008'),
    (N'Old Town Eatery',      N'42 Market Street',       N'Giza',       N'12511', NULL,           N'+20-100-000-0009'),
    (N'No Orders Cafe',       N'99 Quiet Lane',          N'Cairo',      NULL,     N'10:00-12:00', N'+20-100-000-0010');

INSERT INTO dbo.Drivers (FirstName, LastName, Phone) VALUES
    (N'Ahmed',   N'Hassan', N'+20-111-000-0001'),
    (N'Mona',    N'Salem',  N'+20-111-000-0002'),
    (N'Youssef', N'Adel',   N'+20-111-000-0003'),
    (N'Sara',    N'Kamal',  N'+20-111-000-0004'),
    (N'Omar',    N'Fathy',  N'+20-111-000-0005');

-------------------------------------------------------------------------------
-- Orders: insert in fixed sequence so SCOPE_IDENTITY / row order matches plan
-------------------------------------------------------------------------------
DECLARE @OrderIds TABLE (OrderKey INT NOT NULL PRIMARY KEY, OrderID INT NOT NULL);

DECLARE @ok INT, @rid INT;

-- 1
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Riverside Bistro';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -10, GETDATE()), N'Pending');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (1, @ok);
-- 2
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Garden Kitchen';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -9, GETDATE()), N'Pending');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (2, @ok);
-- 3
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Alex Sea Grill';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -7, GETDATE()), N'Confirmed');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (3, @ok);
-- 4
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Riverside Bistro';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -5, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (4, @ok);
-- 5
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Zamalek Brasserie';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -12, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (5, @ok);
-- 6
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Zamalek Brasserie';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -3, GETDATE()), N'Confirmed');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (6, @ok);
-- 7
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Fayoum Farmhouse';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -6, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (7, @ok);
-- 8
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Delta Diner';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -2, GETDATE()), N'Pending');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (8, @ok);
-- 9
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Delta Diner';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -16, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (9, @ok);
-- 10
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Sinai Spice House';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -8, GETDATE()), N'Cancelled');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (10, @ok);
-- 11
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Minya Mezze';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -20, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (11, @ok);
-- 12
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Old Town Eatery';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -21, GETDATE()), N'Confirmed');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (12, @ok);
-- 13
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Garden Kitchen';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -50, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (13, @ok);
-- 14
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Alex Sea Grill';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -45, GETDATE()), N'Delivered');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (14, @ok);
-- 15
SELECT @rid = RestaurantID FROM dbo.Restaurants WHERE RestaurantName = N'Fayoum Farmhouse';
INSERT INTO dbo.Orders (RestaurantID, OrderDate, Status) VALUES (@rid, DATEADD(DAY, -70, GETDATE()), N'Cancelled');
SET @ok = SCOPE_IDENTITY(); INSERT INTO @OrderIds VALUES (15, @ok);

-------------------------------------------------------------------------------
-- Map harvest batches by natural key (same rows as INSERT above)
-------------------------------------------------------------------------------
DECLARE @BatchIds TABLE (
    BatchKey INT NOT NULL PRIMARY KEY,
    BatchID  INT NOT NULL
);

;WITH BatchSeed AS (
    SELECT BatchKey, FarmName, CropTypeName, DayOffset, AvailableQuantityKG, PricePerKG, IsAvailable
    FROM (VALUES
        (1,  N'Green Valley Farm', N'Tomato',   -12, 500.00, 22.50, 1),
        (2,  N'Green Valley Farm', N'Lettuce',   -8, 180.00, 18.00, 1),
        (3,  N'Green Valley Farm', N'Pepper',    -5, 140.00, 28.00, 1),
        (4,  N'El-Nile Organics', N'Cucumber',   -15, 350.00, 14.75, 1),
        (5,  N'El-Nile Organics', N'Potato',     -20, 900.00,  9.50, 1),
        (6,  N'El-Nile Organics', N'Onion',      -9, 260.00, 11.25, 1),
        (7,  N'Sunrise Acres', N'Lettuce',       -6, 220.00, 19.25, 1),
        (8,  N'Sunrise Acres', N'Potato',       -25, 750.00, 10.25, 1),
        (9,  N'Sunrise Acres', N'Eggplant',     -11, 130.00, 23.00, 1),
        (10, N'Wadi El-Natrun Fields', N'Garlic', -14,  90.00, 35.00, 1),
        (11, N'Wadi El-Natrun Fields', N'Onion',  -7, 410.00, 10.00, 1),
        (12, N'Upper Egypt Harvest', N'Tomato',   -4, 300.00, 21.00, 1),
        (13, N'Delta Fresh Co-op', N'Pepper',     -18, 160.00, 27.50, 0),
        (14, N'Sinai Herbs Farm', N'Basil',       -3,  45.00, 45.00, 1),
        (15, N'Sinai Herbs Farm', N'Mint',        -2,  55.00, 32.00, 1),
        (16, N'Oasis Produce', N'Cucumber',      -21, 240.00, 15.50, 1),
        (17, N'Wadi El-Natrun Fields', N'Potato', -60, 600.00,  8.75, 1),
        (18, N'Upper Egypt Harvest', N'Eggplant', -75, 120.00, 22.00, 1),
        (19, N'Delta Fresh Co-op', N'Cucumber',    -45, 180.00, 13.00, 1),
        (20, N'Oasis Produce', N'Tomato',        -90, 260.00, 20.00, 1)
    ) AS v(BatchKey, FarmName, CropTypeName, DayOffset, AvailableQuantityKG, PricePerKG, IsAvailable)
)
INSERT INTO @BatchIds (BatchKey, BatchID)
SELECT p.BatchKey, hb.BatchID
FROM BatchSeed p
INNER JOIN dbo.Farms f ON f.FarmName = p.FarmName
INNER JOIN dbo.CropTypes c ON c.CropTypeName = p.CropTypeName
INNER JOIN dbo.HarvestBatches hb
    ON hb.FarmID = f.FarmID
   AND hb.CropTypeID = c.CropTypeID
   AND hb.HarvestDate = CAST(DATEADD(DAY, p.DayOffset, GETDATE()) AS DATE)
   AND hb.AvailableQuantityKG = p.AvailableQuantityKG
   AND hb.PricePerKG = p.PricePerKG
   AND hb.IsAvailable = p.IsAvailable;

-------------------------------------------------------------------------------
-- Order line items (OrderKey, BatchKey from plans above)
-------------------------------------------------------------------------------
INSERT INTO dbo.OrderDetails (OrderID, BatchID, QuantityOrderedKG, UnitPriceAtOrder)
SELECT oi.OrderID, bi.BatchID, v.Qty, v.Price
FROM (VALUES
    (1,  1,  50.00, 22.50), (1,  2,  20.00, 18.00), (1,  3,  15.00, 28.00),
    (2,  4,  40.00, 14.75), (2,  5, 100.00,  9.50),
    (3,  7,  30.00, 19.25), (3,  9,  10.00, 23.00),
    (4,  8, 120.00, 10.25), (4,  6,  25.00, 11.25),
    (5,  10,  8.00, 35.00), (5,  11, 60.00, 10.00),
    (6,  12, 45.00, 21.00),
    (7,  16, 10.00, 15.50), (7,  2,  25.00, 18.00),
    (8,  13, 18.00, 27.50),
    (9,  5,  80.00,  9.50), (9,  6,  40.00, 11.25),
    (10, 14,  5.00, 45.00), (10, 15,  6.00, 32.00),
    (11, 12, 35.00, 21.00), (11, 7,  20.00, 19.25),
    (12, 4,  15.00, 14.75), (12, 1,  25.00, 22.50),
    (13, 17, 140.00,  8.75),
    (14, 19,  25.00, 13.00),
    (15, 20,  60.00, 20.00)
) AS v(OrderKey, BatchKey, Qty, Price)
INNER JOIN @OrderIds oi ON oi.OrderKey = v.OrderKey
INNER JOIN @BatchIds bi ON bi.BatchKey = v.BatchKey;

-------------------------------------------------------------------------------
-- Trips (TripKey 1..9) then TripOrders
-------------------------------------------------------------------------------
DECLARE @TripIds TABLE (TripKey INT NOT NULL PRIMARY KEY, TripID INT NOT NULL);
DECLARE @tid INT, @did INT;

-- TripKey 1
SELECT @did = DriverID FROM dbo.Drivers WHERE Phone = N'+20-111-000-0001';
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -10, GETDATE()), 42.50);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (1, @tid);
-- 2
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -9, GETDATE()), 18.25);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (2, @tid);
-- 3
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -7, GETDATE()), 55.10);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (3, @tid);
-- 4
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -5, GETDATE()), 23.80);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (4, @tid);
-- 5
SELECT @did = DriverID FROM dbo.Drivers WHERE Phone = N'+20-111-000-0002';
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -12, GETDATE()), 12.40);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (5, @tid);
-- 6
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -3, GETDATE()), 36.75);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (6, @tid);
-- 7
SELECT @did = DriverID FROM dbo.Drivers WHERE Phone = N'+20-111-000-0003';
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -20, GETDATE()), 61.00);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (7, @tid);
-- 8
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -45, GETDATE()), 44.00);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (8, @tid);
-- 9
SELECT @did = DriverID FROM dbo.Drivers WHERE Phone = N'+20-111-000-0004';
INSERT INTO dbo.Trips (DriverID, TripDate, TotalDistanceKM) VALUES (@did, DATEADD(DAY, -8, GETDATE()), 27.30);
SET @tid = SCOPE_IDENTITY(); INSERT INTO @TripIds VALUES (9, @tid);

INSERT INTO dbo.TripOrders (TripID, OrderID, DeliverySequence)
SELECT ti.TripID, oi.OrderID, v.Seq
FROM (VALUES
    (1, 1, 1), (1, 2, 2), (1, 5, 3),
    (2, 3, 1), (2, 4, 2),
    (3, 6, 1), (3, 7, 2),
    (4, 8, 1), (4, 9, 2),
    (5, 10, 1),
    (6, 11, 1), (6, 12, 2),
    (7, 13, 1),
    (8, 14, 1), (8, 15, 2),
    (9, 2, 1)
) AS v(TripKey, OrderKey, Seq)
INNER JOIN @TripIds ti ON ti.TripKey = v.TripKey
INNER JOIN @OrderIds oi ON oi.OrderKey = v.OrderKey;

COMMIT TRANSACTION;
GO
