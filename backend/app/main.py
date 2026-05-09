from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from app.config import AppConfig
from app.routes import register_routes


def create_app() -> Flask:
    # Load root `.env` for local runs (docker-compose already injects env vars).
    # Tests set SKIP_ROOT_DOTENV=1 so monkeypatched env wins.
    if os.getenv("SKIP_ROOT_DOTENV", "").lower() not in ("1", "true", "yes", "on"):
        repo_root_env = Path(__file__).resolve().parents[2] / ".env"
        if repo_root_env.exists():
            load_dotenv(repo_root_env)

    cfg = AppConfig.from_env()

    app = Flask(__name__)
    app.config["APP_CONFIG"] = cfg

    # CORS for local dev (Next.js on a different port)
    CORS(
        app,
        resources={
            r"/api/*": {"origins": "*"},
            r"/health": {"origins": "*"},
            r"/ready": {"origins": "*"},
        },
    )

    register_routes(app)

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        return jsonify(
            {
                "status": "error",
                "code": exc.code,
                "message": exc.description or exc.name,
            }
        ), exc.code or 500

    @app.errorhandler(Exception)
    def handle_error(err: Exception):
        # Keep it simple; backend engineers can refine later.
        status = getattr(err, "status", 500)
        return jsonify({"status": "error", "message": str(err)}), status

    return app


# WSGI entry for Gunicorn (`app.main:app`). Avoids `--factory`, which older Gunicorn builds reject.
app = create_app()

