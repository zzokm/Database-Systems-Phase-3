"""Run the Flask development server (local use; reads root `.env` via create_app)."""

from __future__ import annotations

from app.main import app


def main() -> None:
    cfg = app.config["APP_CONFIG"]
    app.run(host="0.0.0.0", port=cfg.backend_port, debug=cfg.flask_debug)


if __name__ == "__main__":
    main()
