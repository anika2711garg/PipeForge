"""An empty incoming directory is a completed no-op."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse


def test_empty_incoming_directory_completes_with_zero_events(settings: Settings) -> None:
    summary = run_pipeline(settings)
    assert summary.status == "completed"
    assert summary.files_discovered == 0
    assert summary.records_accepted == 0

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 0
        assert warehouse.quarantine_count() == 0
        latest = warehouse.latest_run()
        assert latest is not None
        assert latest["status"] == "completed"
