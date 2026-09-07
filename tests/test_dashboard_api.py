"""Dashboard HTTP routes must stay wired to the same pipeline settings."""

from __future__ import annotations

from typing import Any

from pipeline.config import Settings
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def _invoke(app: Any, path: str, method: str = "GET") -> Any:
    for route in app.routes:
        if getattr(route, "path", None) == path and method in getattr(route, "methods", set()):
            return route.endpoint()
    raise AssertionError(f"missing {method} {path}")


def test_dashboard_health_status_and_run_use_pipeline(
    settings: Settings,
    monkeypatch,
) -> None:
    from pipeline import dashboard as dash

    monkeypatch.setattr(dash, "_settings", lambda: settings)
    write_jsonl(
        settings.incoming_dir / "dash_batch.jsonl",
        [event("evt_dash_1", amount="3.00")],
    )

    health = _invoke(dash.app, "/api/health")
    assert isinstance(health, dict)
    assert health.get("api")

    before = _invoke(dash.app, "/api/status")
    assert "total_warehouse_events" in before
    assert "quarantined_records" in before

    result = _invoke(dash.app, "/api/run", "POST")
    assert isinstance(result, dict)
    assert result.get("status") == "completed"
    assert int(result.get("records_accepted") or 0) >= 1

    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_dash_1") is not None

    after = _invoke(dash.app, "/api/status")
    assert int(after["total_warehouse_events"]) >= 1
