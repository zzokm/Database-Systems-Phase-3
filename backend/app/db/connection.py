"""
This module will contain the database connection and query execution helpers.

It will:
- Build a connection string for the **externally hosted** MS SQL Server using env vars.
- Create/manage a `pyodbc` connection (and cursor usage pattern).
- Expose small helper functions for executing raw SQL safely (parameterized queries).
- Provide a consistent way to return rows (e.g., list of dicts) for JSON responses.

Important constraint: **no ORM**. All data access must be raw SQL.
"""

