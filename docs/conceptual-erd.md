## Conceptual ERD (Mermaid)

```mermaid
flowchart TD
    %% Entities (Rectangles)
    Farm[Farm]
    Harvest_Batch[Harvest_Batch]
    Crop[Crop]
    Order[Order]
    Delivery_Trip[Delivery_Trip]
    Driver[Driver]
    Restaurant[Restaurant]

    %% Relationships (Diamonds)
    Produces{Produces}
    Is_of_Type{Is_of_Type}
    Includes{Includes}
    Delivered_In{Delivered_In}
    Places_Order{Places_Order}
    Completes{Completes}

    %% -------------------------------------
    %% ATTRIBUTES
    %% -------------------------------------
    
    %% Farm Attributes
    Farm_ID([<u>Farm_ID</u>])
    Farm_Name([Name])
    Farm_Location([Location])
    Farm_Crop_Type(((Crop_Type))) %% Double oval for multi-valued attribute

    Farm --- Farm_ID
    Farm --- Farm_Name
    Farm --- Farm_Location
    Farm --- Farm_Crop_Type

    %% Harvest_Batch Attributes
    Batch_ID([<u>Batch_ID</u>])
    Available_Quantity([Available_Quantity])
    Harvest_Date([Harvest_Date])

    Harvest_Batch --- Batch_ID
    Harvest_Batch --- Available_Quantity
    Harvest_Batch --- Harvest_Date

    %% Crop Attributes
    Crop_ID([<u>Crop_ID</u>])
    Crop_Type([Crop_Type])

    Crop --- Crop_ID
    Crop --- Crop_Type

    %% Order Attributes
    Order_ID([<u>Order_ID</u>])
    Order_Date([Order_Date])
    Quantity_Ordered([Quantity_Ordered])

    Order --- Order_ID
    Order --- Order_Date
    Order --- Quantity_Ordered

    %% Delivery_Trip Attributes
    Trip_ID([<u>Trip_ID</u>])
    Trip_Date([Trip_Date])
    Total_Distance([Total_Distance])
    Route([Route])

    Delivery_Trip --- Trip_ID
    Delivery_Trip --- Trip_Date
    Delivery_Trip --- Total_Distance
    Delivery_Trip --- Route

    %% Driver Attributes (with Composite)
    Driver_ID([<u>Driver_ID</u>])
    Driver_Name([Name])
    First_Name([First_Name])
    Last_Name([Last_Name])

    Driver --- Driver_ID
    Driver --- Driver_Name
    Driver_Name --- First_Name
    Driver_Name --- Last_Name

    %% Restaurant Attributes (with Composite)
    Restaurant_ID([<u>Restaurant_ID</u>])
    Rest_Name([Name])
    Preferred_Window([Preferred_Delivery_Window])
    Delivery_Address([Delivery_Address])
    Street_No([Street_No])
    City([City])
    Postal_Code([Postal_Code])

    Restaurant --- Restaurant_ID
    Restaurant --- Rest_Name
    Restaurant --- Preferred_Window
    Restaurant --- Delivery_Address
    Delivery_Address --- Street_No
    Delivery_Address --- City
    Delivery_Address --- Postal_Code

    %% -------------------------------------
    %% CONNECTIONS & CARDINALITIES
    %% -------------------------------------
    %% Note: Thick lines (===) represent total participation (double lines in your image).
    %% Normal lines (---) represent partial participation (single lines in your image).

    Farm -- "1" --- Produces
    Produces == "M" === Harvest_Batch

    Harvest_Batch -- "M" --- Is_of_Type
    Is_of_Type -- "1" --- Crop

    Harvest_Batch -- "M" --- Includes
    Includes == "N" === Order

    Delivery_Trip == "M" === Delivered_In
    Delivered_In -- "N" --- Order

    Driver -- "1" --- Completes
    Completes == "M" === Delivery_Trip

    Order == "M" === Places_Order
    Places_Order -- "1" --- Restaurant
```

