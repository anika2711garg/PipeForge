"""Additive unknown fields must not reject a valid core event."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_extra_fields_are_tolerated(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "evolved.jsonl",
        [
            event(
                "evt_extra_ok",
                amount="4.00",
                device_type="mobile",
                app_version="8.1.0",
                experiment="checkout_v2",
            )
        ],
    )

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        loaded = warehouse.get_event("evt_extra_ok")
        assert loaded is not None
        assert loaded["user_id"] == "usr_1"
        assert loaded["amount_minor_units"] == 400
        assert warehouse.event_count() == 1
