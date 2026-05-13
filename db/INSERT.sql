-- INSERT statements executed by POST /api/harvest-batches and POST /api/drivers.

-- @name: insert_harvest_batch
INSERT INTO HarvestBatches
    (FarmID, CropTypeID, HarvestDate, AvailableQuantityKG, PricePerKG, IsAvailable)
OUTPUT INSERTED.BatchID
VALUES
    (?, ?, ?, ?, ?, ?);

-- @name: insert_driver
INSERT INTO Drivers (FirstName, LastName, Phone)
OUTPUT INSERTED.DriverID
VALUES (?, ?, ?);
