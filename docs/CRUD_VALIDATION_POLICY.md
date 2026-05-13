# CRUD API validation policy

This document aligns the Flask CRUD API with the physical schema and the CRUD UI. It is the source of truth for duplicate-driver behaviour and phone requirements on write paths.

## Drivers (`POST /api/drivers`)

- **Phone on insert:** The API requires `Phone` to be a non-empty string after trim, with a maximum length of 20 characters. In `db/schema.sql`, `Drivers.Phone` is nullable at the database level; the stricter rule is enforced in application code so every driver created through this endpoint has contact information.
- **Name length:** `FirstName` and `LastName` are trimmed and must be non-empty, each at most 50 characters.
- **Duplicate policy (HTTP 409, code `DUPLICATE_DRIVER`):** Insert is rejected if either condition holds:
  1. Another driver exists with the same trimmed phone (compared to `LTRIM(RTRIM(ISNULL(Phone, N'')))`), or
  2. Another driver exists with the same `FirstName` and `LastName` (exact match after the API’s trim on insert).

The database does not define a `UNIQUE` constraint on phone or name pairs; duplicates are blocked only through this API check.

## Harvest batches (`POST /api/harvest-batches`)

- `FarmID` and `CropTypeID` must exist (`UNKNOWN_FARM` / `UNKNOWN_CROP_TYPE` on failure).
- `AvailableQuantityKG` and `PricePerKG` must be numeric and greater than zero (matches table `CHECK` constraints).
- Successful inserts return the new `BatchID` in the JSON body.

## Harvest batch delete (`DELETE /api/harvest-batches/<id>`)

- The backend only deletes rows that satisfy **`IsAvailable = 1`**. Batches that are not available typically result in no row updated or a not-found style response depending on implementation.
- The CRUD UI lists batches using **`GET /api/harvest-batches?available=1`** so users only pick deletable batches.

## Orders

- **Delete:** `DELETE /api/orders/<id>` remains destructive. The UI may call **`GET /api/orders/<id>`** first to show restaurant and date before confirmation.
