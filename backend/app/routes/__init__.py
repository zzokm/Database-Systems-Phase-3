from __future__ import annotations

from flask import Flask

from app.routes.health import bp as health_bp


def register_routes(app: Flask) -> None:
    # Health
    app.register_blueprint(health_bp)

    # Future:
    # - farms/restaurants/drivers CRUD/list routes
    # - reports routes (6 inquiries)


