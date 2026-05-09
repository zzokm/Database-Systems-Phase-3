"""
Healthcheck and readiness endpoints will live here.

This will include:
- A simple `GET /health` route to confirm the API is running.
- Optionally, a `GET /ready` route that attempts a lightweight DB query
  (against the external MS SQL Server) to confirm connectivity.
"""

