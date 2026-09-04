"""Interrupted ingestion must recover to the same result as a clean run."""

from __future__ import annotations

import pytest

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.models import FailureInjector, IngestInjectionError
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def _clean_expected(settings: Settings) -> dict:
    other = Settings(
        incoming_dir=settings.incoming_dir,
        quarantine_dir=settings.quarantine_dir.parent / "clean_quarantine",
        db_path=settings.db_path.parent / "clean.db",
    )
    other.ensure_directories()
    run_pipeline(other)
    with Warehouse(other) as warehouse:
        return {
            "events": warehouse.event_count(),
            "logical": warehouse.logical_event_count(),
            "quarantine": warehouse.quarantine_count(),
            "metrics": warehouse.list_metrics(),
            "ids": sorted(row["event_id"] for row in warehouse.list_events()),
        }


def test_crash_after_n_records_then_rerun_matches_clean_run(settings: Settings) -> None:
    rows = [event(f"evt_crash_{i}", amount="3.50") for i in range(10)]
    write_jsonl(settings.incoming_dir / "crash_batch.jsonl", rows)
    expected = _clean_expected(settings)

    injector = FailureInjector(fail_after_records=4)
    with pytest.raises(IngestInjectionError):
        run_pipeline(settings, injector=injector)

    recovered = run_pipeline(settings)
    assert recovered.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == expected["events"]
        assert warehouse.logical_event_count() == expected["logical"]
        assert warehouse.quarantine_count() == expected["quarantine"]
        assert sorted(row["event_id"] for row in warehouse.list_events()) == expected["ids"]
        assert warehouse.list_metrics() == expected["metrics"]


def test_checkpoint_not_success_until_ingestion_finishes(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "ckpt.jsonl",
        [event(f"evt_ckpt_{i}") for i in range(5)],
    )
    injector = FailureInjector(fail_after_write_before_checkpoint=True)
    with pytest.raises(IngestInjectionError):
        run_pipeline(settings, injector=injector)

    with Warehouse(settings) as warehouse:
        success = [
            row
            for row in warehouse.processed_files("ckpt.jsonl")
            if row["status"] == "success"
        ]
        assert success == []

    rerun = run_pipeline(settings)
    assert rerun.status == "completed"
    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 5
        assert warehouse.logical_event_count() == 5
