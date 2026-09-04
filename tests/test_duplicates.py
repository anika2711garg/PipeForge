"""In-file, cross-file, and conflicting event identity."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_identical_duplicate_inside_one_file(settings: Settings) -> None:
    payload = event("evt_same_file", amount="12.50")
    write_jsonl(settings.incoming_dir / "one.jsonl", [payload, payload, event("evt_other")])

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 2
        assert len(warehouse.find_events("evt_same_file")) == 1


def test_duplicate_event_across_two_files(settings: Settings) -> None:
    shared = event("evt_shared_cross", amount="15.00", user_id="usr_x")
    write_jsonl(settings.incoming_dir / "file_a.jsonl", [shared, event("evt_only_a")])
    write_jsonl(settings.incoming_dir / "file_b.jsonl", [shared, event("evt_only_b")])

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.logical_event_count() == 3
        assert warehouse.event_count() == 3
        assert len(warehouse.find_events("evt_shared_cross")) == 1


def test_conflicting_duplicate_keeps_original(settings: Settings) -> None:
    original = event("e100", amount="10.00", user_id="usr_orig")
    conflict = event("e100", amount="99.00", user_id="usr_orig")
    write_jsonl(settings.incoming_dir / "file_a.jsonl", [original])
    write_jsonl(settings.incoming_dir / "file_b.jsonl", [conflict])

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        rows = warehouse.find_events("e100")
        assert len(rows) == 1
        assert rows[0]["amount_minor_units"] == 1000
        assert warehouse.quarantine_count() == 1
        reasons = " ".join(item["error_reason"] for item in warehouse.list_quarantine())
        assert "conflict" in reasons.lower() or "duplicate" in reasons.lower()
