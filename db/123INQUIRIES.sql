USE FarmDB;
Go

-- INQUIRY 1: Max orders by crop type
SELECT TOP 1
    ct.CropTypeName,
    COUNT(od.OrderDetailID) AS OrderCount
FROM CropTypes ct
JOIN HarvestBatches hb ON ct.CropTypeID = hb.CropTypeID
JOIN OrderDetails od ON hb.BatchID = od.BatchID
GROUP BY ct.CropTypeName
ORDER BY OrderCount DESC;

-- INQUIRY 2: Farms with no batches or sold duringlast month
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
   OR od.OrderDetailID IS NULL;

-- INQUIRY 3: Driver with most trips in last 30 days

SELECT TOP 1
    d.DriverID,
    d.FirstName + ' ' + d.LastName AS DriverName,
    COUNT(t.TripID) AS TripCount
FROM Drivers d
JOIN Trips t 
    ON d.DriverID = t.DriverID
WHERE t.TripDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
GROUP BY d.DriverID, d.FirstName, d.LastName
ORDER BY TripCount DESC;
