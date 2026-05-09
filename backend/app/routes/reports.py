"""
Reporting routes for the 6 mandatory analytical inquiries will live here.

This file will include:
- `GET /api/reports/<report-name>` endpoints that execute raw SQL JOIN queries
  and return JSON to the frontend dashboard.
- Query parameter handling where needed (e.g., date windows like "last month").

All queries must be raw SQL (no ORM) and parameterized.
"""

