"""Timezone-aware timestamps normalize onto UTC calendar dates."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_offset_crossing_utc_midnight_lands_on_previous_utc_date(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "tz.jsonl",
        [
            event(
                "evt_ist_boundary",
                occurred_at="2026-08-05T00:30:00+05:30",
                amount="1.00",
            ),
            event(
                "evt_edt_boundary",
                occurred_at="2026-08-05T00:15:00-04:00",
                amount="2.00",
            ),
            event(
                "evt_utc_same_day",
                occurred_at="2026-08-04T23:00:00+00:00",
                amount="3.00",
            ),
        ],
    )

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        ist = warehouse.get_event("evt_ist_boundary")
        edt = warehouse.get_event("evt_edt_boundary")
        utc = warehouse.get_event("evt_utc_same_day")
        assert ist is not None and edt is not None and utc is not None
        assert "2026-08-04" in ist["occurred_at_utc"]
        assert "2026-08-05" in edt["occurred_at_utc"]
        assert warehouse.metric_event_count("2026-08-04") == 2
        assert warehouse.metric_event_count("2026-08-05") == 1


def test_naive_timestamp_is_quarantined(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "naive.jsonl",
        [
            event("evt_naive", occurred_at="2026-08-05T00:30:00"),
            event("evt_aware", occurred_at="2026-08-05T00:30:00+00:00"),
        ],
    )
    summary = run_pipeline(settings)
    assert summary.status == "completed"
    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_aware") is not None
        assert warehouse.get_event("evt_naive") is None
        assert warehouse.quarantine_count() == 1
