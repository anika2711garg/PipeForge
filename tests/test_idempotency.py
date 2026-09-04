"""Unchanged input must not change logical warehouse contents."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_three_runs_of_the_same_file_are_idempotent(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "stable.jsonl",
        [event(f"evt_stable_{i}", amount="19.99") for i in range(6)],
    )

    first = run_pipeline(settings)
    assert first.status == "completed"

    with Warehouse(settings) as warehouse:
        events_after_first = warehouse.event_count()
        logical_after_first = warehouse.logical_event_count()
        metrics_after_first = warehouse.list_metrics()
        quarantine_after_first = warehouse.quarantine_count()

    second = run_pipeline(settings)
    third = run_pipeline(settings)
    assert second.status == "completed"
    assert third.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == events_after_first
        assert warehouse.logical_event_count() == logical_after_first
        assert warehouse.event_count() == warehouse.logical_event_count()
        assert warehouse.list_metrics() == metrics_after_first
        assert warehouse.quarantine_count() == quarantine_after_first
        assert events_after_first == 6
