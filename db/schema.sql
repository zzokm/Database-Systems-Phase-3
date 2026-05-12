/*
  schema.sql (SQL Server / T-SQL)
  - Rerunnable: creates DB if needed, drops tables in dependency order, recreates everything.
  - After DDL, load demo data with db/seed.sql (rerunnable; safe to repeat).
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
