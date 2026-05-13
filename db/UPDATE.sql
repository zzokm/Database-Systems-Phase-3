-- UPDATE statements executed by PUT /api/restaurants/<id>/delivery-window and PUT /api/trips/<id>/route.

-- @name: update_restaurant_delivery_window
UPDATE Restaurants
SET PreferredDeliveryWindow = ?
WHERE RestaurantID = ?;

-- @name: update_trip_distance
UPDATE Trips
SET TotalDistanceKM = ?
WHERE TripID = ?;
