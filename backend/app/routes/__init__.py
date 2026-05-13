from __future__ import annotations

from flask import Flask

from app.routes.crud import bp as crud_bp
from app.routes.health import bp as health_bp


def register_routes(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(crud_bp)
