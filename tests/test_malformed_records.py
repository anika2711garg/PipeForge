"""Invalid lines are quarantined; valid siblings still load."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_broken_json_line_is_quarantined_and_valid_rows_survive(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "mixed.jsonl",
        [
            event("evt_ok_1"),
            event("evt_ok_2"),
            "{this is not json",
            event("evt_ok_3"),
        ],
    )

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 3
        assert warehouse.quarantine_count() == 1
        item = warehouse.list_quarantine()[0]
        assert item["source_file"] == "mixed.jsonl"
        assert item["line_number"] == 3
        assert "this is not json" in item["raw_record"]
        assert item["error_reason"]


def test_missing_event_id_is_quarantined(settings: Settings) -> None:
    payload = event("evt_will_drop")
    del payload["event_id"]
    write_jsonl(
        settings.incoming_dir / "missing.jsonl",
        [payload, event("evt_kept")],
    )

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_kept") is not None
        assert warehouse.event_count() == 1
        assert warehouse.quarantine_count() == 1
