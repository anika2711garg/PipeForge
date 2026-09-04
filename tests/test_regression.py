"""Mixed scenario that should stay green after the full repair."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_mixed_rerun_duplicate_timezone_and_late_data(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "wave_a.jsonl",
        [
            event("evt_reg_1", amount="0.10", occurred_at="2026-08-05T00:30:00+05:30"),
            event("evt_reg_1", amount="0.10", occurred_at="2026-08-05T00:30:00+05:30"),
            event("evt_reg_2", amount="10.07", occurred_at="2026-09-03T12:00:00+00:00"),
            "{broken",
        ],
    )
    first = run_pipeline(settings)
    assert first.status == "completed"

    write_jsonl(
        settings.incoming_dir / "wave_b.jsonl",
        [
            event("evt_reg_1", amount="9.99", occurred_at="2026-08-05T00:30:00+05:30"),
            event("evt_reg_late", amount="0.20", occurred_at="2026-08-01T08:00:00+00:00"),
            event(
                "evt_reg_extra",
                amount="1.00",
                occurred_at="2026-09-03T13:00:00+00:00",
                campaign="autumn",
            ),
        ],
    )
    second = run_pipeline(settings)
    third = run_pipeline(settings)
    assert second.status == "completed"
    assert third.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 4
        assert len(warehouse.find_events("evt_reg_1")) == 1
        assert warehouse.get_event("evt_reg_1")["amount_minor_units"] == 10
        assert warehouse.quarantine_count() == 2
        assert warehouse.metric_event_count("2026-08-04") == 1
        assert warehouse.metric_event_count("2026-08-01") == 1
        assert warehouse.get_event("evt_reg_extra") is not None
        assert warehouse.metric_total_amount("2026-09-03") == 1007 + 100
