"""Same filename with new bytes is new input; event ids still win."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_changed_content_keeps_filename_but_ingests_new_logical_events(
    settings: Settings,
) -> None:
    path = settings.incoming_dir / "batch.jsonl"
    write_jsonl(
        path,
        [
            event("evt_keep", amount="10.00"),
            event("evt_only_first", amount="4.00"),
        ],
    )
    first = run_pipeline(settings)
    assert first.status == "completed"

    write_jsonl(
        path,
        [
            event("evt_keep", amount="10.00"),
            event("evt_only_second", amount="8.00"),
        ],
    )
    second = run_pipeline(settings)
    assert second.status == "completed"

    with Warehouse(settings) as warehouse:
        assert len(warehouse.find_events("evt_keep")) == 1
        assert warehouse.get_event("evt_only_first") is not None
        assert warehouse.get_event("evt_only_second") is not None
        assert warehouse.event_count() == 3
        hashes = {row["content_hash"] for row in warehouse.processed_files("batch.jsonl")}
        assert len(hashes) >= 1
