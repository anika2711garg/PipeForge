"""Happy-path ingestion of a single valid file."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_basic_ingestion_loads_ten_events(settings: Settings) -> None:
    rows = [
        event(f"evt_basic_{index:02d}", amount=f"{10 + index}.00")
        for index in range(10)
    ]
    write_jsonl(settings.incoming_dir / "batch_basic.jsonl", rows)

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 10
        assert warehouse.logical_event_count() == 10
        processed = warehouse.processed_files("batch_basic.jsonl")
        assert processed
        assert processed[-1]["status"] == "success"
        assert warehouse.metric_event_count("2026-09-03") == 10
        latest = warehouse.latest_run()
        assert latest is not None
        assert latest["status"] == "completed"
        assert latest["records_accepted"] == 10
