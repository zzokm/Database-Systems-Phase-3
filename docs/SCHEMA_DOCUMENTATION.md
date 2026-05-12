## FarmDB schema documentation (MSSQL / T-SQL)

This document describes the physical database schema implemented in `db/schema.sql`.

### Conventions

- **Primary keys**: `INT IDENTITY(1,1)` surrogate keys unless otherwise noted.
- **Foreign keys**: enforce relationships between parent and child tables.
- **Units**: quantities are stored in **KG** and distances in **KM**.
- **Money**: unit prices are stored as `DECIMAL(10,2)` (currency not explicitly modeled).

### Entity/relationship summary

- **Farms** produce **HarvestBatches** of a specific **CropType**.
- **Restaurants** place **Orders**.
- Each **Order** has one or more line items in **OrderDetails**, each line references a **HarvestBatch**.
- **Drivers** complete **Trips**.
- Each **Trip** delivers one or more **Orders** via **TripOrders** (with a delivery sequence).
- **FarmCropSpecialties** is a bridge table that records which crop types a farm can supply (many-to-many).

---

## Tables

### `Farms`

- **Row represents**: one farm/producer in the distribution network.

**Columns**

- **`FarmID`** (`INT IDENTITY(1,1)`): Primary key.
- **`FarmName`** (`NVARCHAR(100) NOT NULL`): Display name of the farm.
- **`Location`** (`NVARCHAR(200) NOT NULL`): Human-readable location (governorate/city/etc.).

**Constraints**

- **PK**: `FarmID`.

---

### `CropTypes`

- **Row represents**: one crop category/type (e.g., Tomato, Basil).

**Columns**

- **`CropTypeID`** (`INT IDENTITY(1,1)`): Primary key.
- **`CropTypeName`** (`NVARCHAR(50) NOT NULL`): Crop type name.

**Constraints**

- **PK**: `CropTypeID`.
- **UNIQUE**: `CropTypeName` (no duplicate crop names).

---

### `FarmCropSpecialties` (bridge: Farms ↔ CropTypes)

- **Row represents**: “Farm X can supply CropType Y”.
- **Why it exists**: models a multi-valued/combinatorial attribute (a farm can have many crop specialties; a crop type can be supplied by many farms).

**Columns**

- **`FarmID`** (`INT NOT NULL`): FK → `Farms(FarmID)`.
- **`CropTypeID`** (`INT NOT NULL`): FK → `CropTypes(CropTypeID)`.

**Constraints**

- **Composite PK**: (`FarmID`, `CropTypeID`) (prevents duplicates).
- **FK**: `FarmID` → `Farms(FarmID)` **ON DELETE CASCADE**.
- **FK**: `CropTypeID` → `CropTypes(CropTypeID)` **ON DELETE CASCADE**.

---

### `HarvestBatches`

- **Row represents**: a harvested batch/listing from a farm for a specific crop type.
- **Used for**: availability, pricing, and linking sales (via `OrderDetails`) to what was harvested.

**Columns**

- **`BatchID`** (`INT IDENTITY(1,1)`): Primary key.
- **`FarmID`** (`INT NOT NULL`): FK → `Farms(FarmID)` (producer).
- **`CropTypeID`** (`INT NOT NULL`): FK → `CropTypes(CropTypeID)` (crop type).
- **`HarvestDate`** (`DATE NOT NULL`): Date harvested/listed.
- **`AvailableQuantityKG`** (`DECIMAL(10,2) NOT NULL`): Remaining available quantity (KG).
- **`PricePerKG`** (`DECIMAL(10,2) NOT NULL`): Current listing price per KG.
- **`IsAvailable`** (`BIT NOT NULL DEFAULT 1`): Manual availability flag (1=available, 0=not available).

**Constraints**

- **PK**: `BatchID`.
- **CHECK**: `AvailableQuantityKG > 0`.
- **CHECK**: `PricePerKG > 0`.
- **FK**: `FarmID` → `Farms(FarmID)` **ON DELETE CASCADE**.
- **FK**: `CropTypeID` → `CropTypes(CropTypeID)`.

---

### `Restaurants`

- **Row represents**: one restaurant/customer receiving deliveries.

**Columns**

- **`RestaurantID`** (`INT IDENTITY(1,1)`): Primary key.
- **`RestaurantName`** (`NVARCHAR(100) NOT NULL`): Restaurant name.
- **`DeliveryAddress`** (`NVARCHAR(200) NOT NULL`): Street/address text.
- **`City`** (`NVARCHAR(50) NOT NULL`): City.
- **`PostalCode`** (`NVARCHAR(20) NULL`): Postal code (optional).
- **`PreferredDeliveryWindow`** (`NVARCHAR(100) NULL`): Preferred delivery time window (optional).
- **`ContactPhone`** (`NVARCHAR(20) NULL`): Contact phone (optional).

**Constraints**

- **PK**: `RestaurantID`.

---

### `Orders`

- **Row represents**: one order placed by one restaurant at a specific time.
- **Line items**: stored in `OrderDetails` (not in this table).

**Columns**

- **`OrderID`** (`INT IDENTITY(1,1)`): Primary key.
- **`RestaurantID`** (`INT NOT NULL`): FK → `Restaurants(RestaurantID)` (who placed the order).
- **`OrderDate`** (`DATETIME NOT NULL DEFAULT GETDATE()`): When the order was created.
- **`Status`** (`NVARCHAR(50) NOT NULL DEFAULT 'Pending'`): Order lifecycle status.

**Constraints**

- **PK**: `OrderID`.
- **FK**: `RestaurantID` → `Restaurants(RestaurantID)` **ON DELETE CASCADE**.
- **CHECK**: `Status IN ('Pending', 'Confirmed', 'Delivered', 'Cancelled')`.

---

### `OrderDetails` (order lines; bridge: Orders ↔ HarvestBatches)

- **Row represents**: a single line item in an order (one batch + quantity + price at order time).
- **Why quantity lives here**: an order can contain many batches, and the same batch can appear across many orders (many-to-many).

**Columns**

- **`OrderDetailID`** (`INT IDENTITY(1,1)`): Surrogate primary key for the line.
- **`OrderID`** (`INT NOT NULL`): FK → `Orders(OrderID)`.
- **`BatchID`** (`INT NOT NULL`): FK → `HarvestBatches(BatchID)`.
- **`QuantityOrderedKG`** (`DECIMAL(10,2) NOT NULL`): Quantity ordered from that batch (KG).
- **`UnitPriceAtOrder`** (`DECIMAL(10,2) NOT NULL`): Captured unit price at purchase time.

**Constraints**

- **PK**: `OrderDetailID`.
- **UNIQUE**: (`OrderID`, `BatchID`) (prevents duplicate lines for the same batch in the same order).
- **CHECK**: `QuantityOrderedKG > 0`.
- **CHECK**: `UnitPriceAtOrder > 0`.
- **FK**: `OrderID` → `Orders(OrderID)` **ON DELETE CASCADE**.
- **FK**: `BatchID` → `HarvestBatches(BatchID)`.

---

### `Drivers`

- **Row represents**: one delivery driver.

**Columns**

- **`DriverID`** (`INT IDENTITY(1,1)`): Primary key.
- **`FirstName`** (`NVARCHAR(50) NOT NULL`): Driver first name.
- **`LastName`** (`NVARCHAR(50) NOT NULL`): Driver last name.
- **`Phone`** (`NVARCHAR(20) NULL`): Driver phone (optional).

**Constraints**

- **PK**: `DriverID`.

---

### `Trips`

- **Row represents**: one delivery trip completed by one driver.

**Columns**

- **`TripID`** (`INT IDENTITY(1,1)`): Primary key.
- **`DriverID`** (`INT NOT NULL`): FK → `Drivers(DriverID)` (who drove the trip).
- **`TripDate`** (`DATETIME NOT NULL DEFAULT GETDATE()`): When the trip occurred/was recorded.
- **`TotalDistanceKM`** (`DECIMAL(8,2) NOT NULL`): Total trip distance in KM.

**Constraints**

- **PK**: `TripID`.
- **CHECK**: `TotalDistanceKM >= 0`.
- **FK**: `DriverID` → `Drivers(DriverID)`.

---

### `TripOrders` (bridge: Trips ↔ Orders)

- **Row represents**: “Order X is delivered on Trip Y at delivery position N”.

**Columns**

- **`TripID`** (`INT NOT NULL`): FK → `Trips(TripID)`.
- **`OrderID`** (`INT NOT NULL`): FK → `Orders(OrderID)`.
- **`DeliverySequence`** (`INT NOT NULL`): The stop/order within the trip route.

**Constraints**

- **Composite PK**: (`TripID`, `OrderID`) (an order appears at most once per trip).
- **CHECK**: `DeliverySequence > 0`.
- **FK**: `TripID` → `Trips(TripID)` **ON DELETE CASCADE**.
- **FK**: `OrderID` → `Orders(OrderID)`.

---

## Notes / design rationale

- **Order quantities** belong on `OrderDetails` (not `Orders`) because Orders↔HarvestBatches is many-to-many.
- **IsAvailable** is kept even though availability could be derived from quantity; it allows manual hiding/pausing a batch.
- **Cascading deletes**: deleting a farm or restaurant deletes dependent records (batches, orders, bridges). This is useful for demo/test resets, but should be reviewed for real production behavior.

