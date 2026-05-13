-- DELETE statements executed by DELETE /api/orders/<id> and DELETE /api/harvest-batches/<id>.

-- @name: delete_trip_orders_by_order
DELETE FROM TripOrders
WHERE OrderID = ?;

-- @name: delete_order_by_id
DELETE FROM Orders
WHERE OrderID = ?;

-- @name: delete_harvest_batch_when_available
DELETE FROM HarvestBatches
WHERE BatchID = ? AND IsAvailable = 1;
