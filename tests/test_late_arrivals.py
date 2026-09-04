"""Older events must create or repair historical UTC daily metrics."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_late_september_first_updates_history_without_corrupting_later_days(
    settings: Settings,
) -> None:
    write_jsonl(
        settings.incoming_dir / "recent.jsonl",
        [
            event("evt_sep3", occurred_at="2026-09-03T15:00:00+00:00", amount="5.00"),
            event("evt_sep4", occurred_at="2026-09-04T15:00:00+00:00", amount="7.00"),
        ],
    )
    first = run_pipeline(settings)
    assert first.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.metric_event_count("2026-09-03") == 1
        assert warehouse.metric_event_count("2026-09-04") == 1
        sep4_before = warehouse.metric_total_amount("2026-09-04")

    write_jsonl(
        settings.incoming_dir / "late.jsonl",
        [
            event(
                "evt_sep1",
                occurred_at="2026-09-01T11:00:00+00:00",
                amount="9.00",
            )
        ],
    )
    second = run_pipeline(settings)
    assert second.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_sep1") is not None
        assert warehouse.metric_event_count("2026-09-01") == 1
        assert warehouse.metric_total_amount("2026-09-01") == 900
        assert warehouse.metric_event_count("2026-09-03") == 1
        assert warehouse.metric_event_count("2026-09-04") == 1
        assert warehouse.metric_total_amount("2026-09-04") == sep4_before
