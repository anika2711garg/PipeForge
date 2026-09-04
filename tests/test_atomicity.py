"""Partial writes must not become durable success after a mid-run failure."""

from __future__ import annotations

import pytest

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.models import FailureInjector, IngestInjectionError
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_failure_before_commit_leaves_no_partial_success(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "atomic.jsonl",
        [event(f"evt_atomic_{i}") for i in range(8)],
    )

    injector = FailureInjector(fail_before_commit=True)
    with pytest.raises(IngestInjectionError):
        run_pipeline(settings, injector=injector)

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 0
        success_rows = [
            row
            for row in warehouse.processed_files("atomic.jsonl")
            if row["status"] == "success"
        ]
        assert success_rows == []
