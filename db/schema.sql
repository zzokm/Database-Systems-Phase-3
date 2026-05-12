/*
  schema.sql (SQL Server / T-SQL)
  - Rerunnable: creates DB if needed, drops tables in dependency order, recreates everything.
*/

IF DB_ID(N'FarmDB') IS NULL
BEGIN
    CREATE DATABASE FarmDB;
END
GO

USE FarmDB;
GO

-- Drop tables in reverse dependency order (assumes default schema dbo)
IF OBJECT_ID(N'dbo.TripOrders', N'U') IS NOT NULL DROP TABLE dbo.TripOrders;
IF OBJECT_ID(N'dbo.OrderDetails', N'U') IS NOT NULL DROP TABLE dbo.OrderDetails;
IF OBJECT_ID(N'dbo.Trips', N'U') IS NOT NULL DROP TABLE dbo.Trips;
IF OBJECT_ID(N'dbo.Orders', N'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID(N'dbo.Drivers', N'U') IS NOT NULL DROP TABLE dbo.Drivers;
IF OBJECT_ID(N'dbo.Restaurants', N'U') IS NOT NULL DROP TABLE dbo.Restaurants;
IF OBJECT_ID(N'dbo.HarvestBatches', N'U') IS NOT NULL DROP TABLE dbo.HarvestBatches;
IF OBJECT_ID(N'dbo.FarmCropSpecialties', N'U') IS NOT NULL DROP TABLE dbo.FarmCropSpecialties;
IF OBJECT_ID(N'dbo.CropTypes', N'U') IS NOT NULL DROP TABLE dbo.CropTypes;
IF OBJECT_ID(N'dbo.Farms', N'U') IS NOT NULL DROP TABLE dbo.Farms;
GO

-- 1. Farms table
CREATE TABLE Farms (
    FarmID INT IDENTITY(1,1) PRIMARY KEY,
    FarmName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(200) NOT NULL
);

-- 2. CropTypes table
CREATE TABLE CropTypes (
    CropTypeID INT IDENTITY(1,1) PRIMARY KEY,
    CropTypeName NVARCHAR(50) NOT NULL UNIQUE
);

-- 3. FarmCropSpecialties (M:N bridge)
CREATE TABLE FarmCropSpecialties (
    FarmID INT NOT NULL,
    CropTypeID INT NOT NULL,
    PRIMARY KEY (FarmID, CropTypeID),
    FOREIGN KEY (FarmID) REFERENCES Farms(FarmID) ON DELETE CASCADE,
    FOREIGN KEY (CropTypeID) REFERENCES CropTypes(CropTypeID) ON DELETE CASCADE
);

-- 4. HarvestBatches table
CREATE TABLE HarvestBatches (
    BatchID INT IDENTITY(1,1) PRIMARY KEY,
    FarmID INT NOT NULL,
    CropTypeID INT NOT NULL,
    HarvestDate DATE NOT NULL,
    AvailableQuantityKG DECIMAL(10,2) NOT NULL CHECK (AvailableQuantityKG > 0),
    PricePerKG DECIMAL(10,2) NOT NULL CHECK (PricePerKG > 0),
    IsAvailable BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (FarmID) REFERENCES Farms(FarmID) ON DELETE CASCADE,
    FOREIGN KEY (CropTypeID) REFERENCES CropTypes(CropTypeID)
);

-- 5. Restaurants table
CREATE TABLE Restaurants (
    RestaurantID INT IDENTITY(1,1) PRIMARY KEY,
    RestaurantName NVARCHAR(100) NOT NULL,
    DeliveryAddress NVARCHAR(200) NOT NULL,
    City NVARCHAR(50) NOT NULL,
    PostalCode NVARCHAR(20) NULL,
    PreferredDeliveryWindow NVARCHAR(100) NULL,
    ContactPhone NVARCHAR(20) NULL
);

-- 6. Orders table
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    RestaurantID INT NOT NULL,
    OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Confirmed', 'Delivered', 'Cancelled')),
    FOREIGN KEY (RestaurantID) REFERENCES Restaurants(RestaurantID) ON DELETE CASCADE
);

-- 7. OrderDetails table (M:N bridge between Orders and HarvestBatches)
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    BatchID INT NOT NULL,
    QuantityOrderedKG DECIMAL(10,2) NOT NULL CHECK (QuantityOrderedKG > 0),
    UnitPriceAtOrder DECIMAL(10,2) NOT NULL CHECK (UnitPriceAtOrder > 0),
    UNIQUE (OrderID, BatchID),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (BatchID) REFERENCES HarvestBatches(BatchID)
);

-- 8. Drivers table
CREATE TABLE Drivers (
    DriverID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Phone NVARCHAR(20) NULL
);

-- 9. Trips table
CREATE TABLE Trips (
    TripID INT IDENTITY(1,1) PRIMARY KEY,
    DriverID INT NOT NULL,
    TripDate DATETIME NOT NULL DEFAULT GETDATE(),
    TotalDistanceKM DECIMAL(8,2) NOT NULL CHECK (TotalDistanceKM >= 0),
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID)
);

-- 10. TripOrders table (M:N bridge between Trips and Orders)
CREATE TABLE TripOrders (
    TripID INT NOT NULL,
    OrderID INT NOT NULL,
    DeliverySequence INT NOT NULL CHECK (DeliverySequence > 0),
    PRIMARY KEY (TripID, OrderID),
    FOREIGN KEY (TripID) REFERENCES Trips(TripID) ON DELETE CASCADE,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
GO

/* ---------------------------------------------------------------------------
   Mock data (seed) - for testing/demo purposes
   Assumes the script was run from scratch (tables were dropped/recreated).
--------------------------------------------------------------------------- */

-- Farms
INSERT INTO Farms (FarmName, Location) VALUES
    (N'Green Valley Farm',        N'Giza, Egypt'),
    (N'El-Nile Organics',         N'Qalyubia, Egypt'),
    (N'Sunrise Acres',            N'Alexandria, Egypt'),
    (N'Wadi El-Natrun Fields',    N'Beheira, Egypt'),
    (N'Upper Egypt Harvest',      N'Minya, Egypt'),
    (N'Delta Fresh Co-op',        N'Dakahlia, Egypt'),
    (N'Sinai Herbs Farm',         N'North Sinai, Egypt'),
    (N'Oasis Produce',            N'Fayoum, Egypt');

-- Crop types
INSERT INTO CropTypes (CropTypeName) VALUES
    (N'Tomato'),
    (N'Cucumber'),
    (N'Lettuce'),
    (N'Potato'),
    (N'Basil'),
    (N'Onion'),
    (N'Garlic'),
    (N'Pepper'),
    (N'Eggplant'),
    (N'Mint');

-- Farm specialties (M:N)
INSERT INTO FarmCropSpecialties (FarmID, CropTypeID) VALUES
    -- Farm 1
    (1, 1), (1, 3), (1, 5), (1, 8),
    -- Farm 2
    (2, 1), (2, 2), (2, 4), (2, 6),
    -- Farm 3
    (3, 2), (3, 3), (3, 4), (3, 9),
    -- Farm 4
    (4, 4), (4, 6), (4, 7),
    -- Farm 5
    (5, 1), (5, 6), (5, 8), (5, 9),
    -- Farm 6
    (6, 2), (6, 4), (6, 6), (6, 8),
    -- Farm 7 (herbs-focused)
    (7, 5), (7, 10),
    -- Farm 8
    (8, 1), (8, 2), (8, 3), (8, 8);

-- Harvest batches
-- Mix of recent + older batches so the "last month" inquiries have meaningful edge cases:
-- - Some farms have only old batches (inactive last month)
-- - Some batches are unavailable (IsAvailable = 0) even with remaining quantity
INSERT INTO HarvestBatches
    (FarmID, CropTypeID, HarvestDate, AvailableQuantityKG, PricePerKG, IsAvailable)
VALUES
    -- Recent (within last ~30 days)
    (1, 1, CAST(DATEADD(DAY, -12, GETDATE()) AS DATE), 500.00, 22.50, 1), -- Tomato
    (1, 3, CAST(DATEADD(DAY, -8,  GETDATE()) AS DATE), 180.00, 18.00, 1), -- Lettuce
    (1, 8, CAST(DATEADD(DAY, -5,  GETDATE()) AS DATE), 140.00, 28.00, 1), -- Pepper
    (2, 2, CAST(DATEADD(DAY, -15, GETDATE()) AS DATE), 350.00, 14.75, 1), -- Cucumber
    (2, 4, CAST(DATEADD(DAY, -20, GETDATE()) AS DATE), 900.00,  9.50, 1), -- Potato
    (2, 6, CAST(DATEADD(DAY, -9,  GETDATE()) AS DATE), 260.00, 11.25, 1), -- Onion
    (3, 3, CAST(DATEADD(DAY, -6,  GETDATE()) AS DATE), 220.00, 19.25, 1), -- Lettuce
    (3, 4, CAST(DATEADD(DAY, -25, GETDATE()) AS DATE), 750.00, 10.25, 1), -- Potato
    (3, 9, CAST(DATEADD(DAY, -11, GETDATE()) AS DATE), 130.00, 23.00, 1), -- Eggplant
    (4, 7, CAST(DATEADD(DAY, -14, GETDATE()) AS DATE),  90.00, 35.00, 1), -- Garlic
    (4, 6, CAST(DATEADD(DAY, -7,  GETDATE()) AS DATE), 410.00, 10.00, 1), -- Onion
    (5, 1, CAST(DATEADD(DAY, -4,  GETDATE()) AS DATE), 300.00, 21.00, 1), -- Tomato
    (6, 8, CAST(DATEADD(DAY, -18, GETDATE()) AS DATE), 160.00, 27.50, 0), -- Pepper (unavailable)
    (7, 5, CAST(DATEADD(DAY, -3,  GETDATE()) AS DATE),  45.00, 45.00, 1), -- Basil
    (7, 10,CAST(DATEADD(DAY, -2,  GETDATE()) AS DATE),  55.00, 32.00, 1), -- Mint
    (8, 2, CAST(DATEADD(DAY, -21, GETDATE()) AS DATE), 240.00, 15.50, 1), -- Cucumber

    -- Older (outside last month)
    (4, 4, CAST(DATEADD(DAY, -60, GETDATE()) AS DATE), 600.00,  8.75, 1), -- Potato (old)
    (5, 9, CAST(DATEADD(DAY, -75, GETDATE()) AS DATE), 120.00, 22.00, 1), -- Eggplant (old)
    (6, 2, CAST(DATEADD(DAY, -45, GETDATE()) AS DATE), 180.00, 13.00, 1), -- Cucumber (old)
    (8, 1, CAST(DATEADD(DAY, -90, GETDATE()) AS DATE), 260.00, 20.00, 1); -- Tomato (old)

-- Restaurants
INSERT INTO Restaurants
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

-- Orders
-- Mix of statuses + dates so "inactive restaurants last month" and other edge cases are covered.
INSERT INTO Orders (RestaurantID, OrderDate, Status) VALUES
    -- Recent (within last month)
    (1, DATEADD(DAY, -10, GETDATE()), N'Pending'),
    (2, DATEADD(DAY, -9,  GETDATE()), N'Pending'),
    (3, DATEADD(DAY, -7,  GETDATE()), N'Confirmed'),
    (1, DATEADD(DAY, -5,  GETDATE()), N'Delivered'),
    (4, DATEADD(DAY, -12, GETDATE()), N'Delivered'),
    (4, DATEADD(DAY, -3,  GETDATE()), N'Confirmed'),
    (5, DATEADD(DAY, -6,  GETDATE()), N'Delivered'),
    (6, DATEADD(DAY, -2,  GETDATE()), N'Pending'),
    (6, DATEADD(DAY, -16, GETDATE()), N'Delivered'),
    (7, DATEADD(DAY, -8,  GETDATE()), N'Cancelled'),
    (8, DATEADD(DAY, -20, GETDATE()), N'Delivered'),
    (9, DATEADD(DAY, -21, GETDATE()), N'Confirmed'),

    -- Older (outside last month) -> makes some restaurants "inactive last month"
    (2, DATEADD(DAY, -50, GETDATE()), N'Delivered'),
    (3, DATEADD(DAY, -45, GETDATE()), N'Delivered'),
    (5, DATEADD(DAY, -70, GETDATE()), N'Cancelled');

-- Order details (link to batches)
INSERT INTO OrderDetails (OrderID, BatchID, QuantityOrderedKG, UnitPriceAtOrder) VALUES
    -- Order 1 (Restaurant 1)
    (1, 1,  50.00, 22.50),
    (1, 2,  20.00, 18.00),
    (1, 3,  15.00, 28.00),

    -- Order 2 (Restaurant 2)
    (2, 4,  40.00, 14.75),
    (2, 5, 100.00,  9.50),

    -- Order 3 (Restaurant 3)
    (3, 7,  30.00, 19.25),
    (3, 9,  10.00, 23.00),

    -- Order 4 (Restaurant 1)
    (4, 8, 120.00, 10.25),
    (4, 6,  25.00, 11.25),

    -- Order 5 (Restaurant 4)
    (5, 10,  8.00, 35.00),
    (5, 11, 60.00, 10.00),

    -- Order 6 (Restaurant 4)
    (6, 12, 45.00, 21.00),

    -- Order 7 (Restaurant 5)
    (7, 16, 10.00, 15.50),
    (7, 2,  25.00, 18.00),

    -- Order 8 (Restaurant 6)
    (8, 13, 18.00, 27.50),

    -- Order 9 (Restaurant 6)
    (9, 5,  80.00,  9.50),
    (9, 6,  40.00, 11.25),

    -- Order 10 (Restaurant 7) Cancelled order still has details
    (10, 14,  5.00, 45.00),
    (10, 15,  6.00, 32.00),

    -- Order 11 (Restaurant 8)
    (11, 12, 35.00, 21.00),
    (11, 7,  20.00, 19.25),

    -- Order 12 (Restaurant 9)
    (12, 4,  15.00, 14.75),
    (12, 1,  25.00, 22.50),

    -- Old orders
    (13, 17, 140.00,  8.75),
    (14, 19,  25.00, 13.00),
    (15, 20,  60.00, 20.00);

-- Drivers
INSERT INTO Drivers (FirstName, LastName, Phone) VALUES
    (N'Ahmed',  N'Hassan', N'+20-111-000-0001'),
    (N'Mona',   N'Salem',  N'+20-111-000-0002'),
    (N'Youssef',N'Adel',   N'+20-111-000-0003'),
    (N'Sara',   N'Kamal',  N'+20-111-000-0004'),
    (N'Omar',   N'Fathy',  N'+20-111-000-0005');

-- Trips
INSERT INTO Trips (DriverID, TripDate, TotalDistanceKM) VALUES
    -- Driver 1 (more trips in last month)
    (1, DATEADD(DAY, -10, GETDATE()), 42.50),
    (1, DATEADD(DAY, -9,  GETDATE()), 18.25),
    (1, DATEADD(DAY, -7,  GETDATE()), 55.10),
    (1, DATEADD(DAY, -5,  GETDATE()), 23.80),

    -- Driver 2
    (2, DATEADD(DAY, -12, GETDATE()), 12.40),
    (2, DATEADD(DAY, -3,  GETDATE()), 36.75),

    -- Driver 3
    (3, DATEADD(DAY, -20, GETDATE()), 61.00),
    (3, DATEADD(DAY, -45, GETDATE()), 44.00), -- old trip

    -- Driver 4
    (4, DATEADD(DAY, -8,  GETDATE()), 27.30);

-- Trip assignments (M:N)
INSERT INTO TripOrders (TripID, OrderID, DeliverySequence) VALUES
    -- Trip 1 (Driver 1)
    (1, 1, 1),
    (1, 2, 2),
    (1, 5, 3),

    -- Trip 2 (Driver 1)
    (2, 3, 1),
    (2, 4, 2),

    -- Trip 3 (Driver 1)
    (3, 6, 1),
    (3, 7, 2),

    -- Trip 4 (Driver 1)
    (4, 8, 1),
    (4, 9, 2),

    -- Trip 5 (Driver 2)
    (5, 10, 1),

    -- Trip 6 (Driver 2)
    (6, 11, 1),
    (6, 12, 2),

    -- Trip 7 (Driver 3)
    (7, 13, 1),

    -- Trip 8 (Driver 3) old
    (8, 14, 1),
    (8, 15, 2),

    -- Trip 9 (Driver 4)
    (9, 2, 1);