from __future__ import annotations

import os
from dataclasses import dataclass


def _require(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class AppConfig:
    # Server
    backend_port: int
    flask_env: str | None
    flask_debug: bool

    # External MSSQL
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    db_driver: str

    @staticmethod
    def from_env() -> "AppConfig":
        # Nothing is assumed: if you want defaults, define them in root `.env`.
        backend_port = int(_require("BACKEND_PORT"))

        flask_env = os.getenv("FLASK_ENV")
        flask_debug = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true", "yes", "on")

        return AppConfig(
            backend_port=backend_port,
            flask_env=flask_env,
            flask_debug=flask_debug,
            db_host=_require("DB_HOST"),
            db_port=int(_require("DB_PORT")),
            db_name=_require("DB_NAME"),
            db_user=_require("DB_USER"),
            db_password=_require("DB_PASSWORD"),
            db_driver=_require("DB_DRIVER"),
        )

