"""New files are ingested without rewriting or wiping prior warehouse state."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_new_file_is_added_without_duplicating_old_events(settings: Settings) -> None:
    write_jsonl(
        settings.incoming_dir / "first_wave.jsonl",
        [event("evt_old_1"), event("evt_old_2")],
    )
    first = run_pipeline(settings)
    assert first.status == "completed"

    write_jsonl(
        settings.incoming_dir / "second_wave.jsonl",
        [event("evt_new_1", occurred_at="2026-09-04T08:00:00+00:00")],
    )
    second = run_pipeline(settings)
    assert second.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 3
        assert warehouse.get_event("evt_old_1") is not None
        assert warehouse.get_event("evt_old_2") is not None
        assert warehouse.get_event("evt_new_1") is not None


def test_preexisting_warehouse_row_is_not_wiped(settings: Settings) -> None:
    with Warehouse(settings) as warehouse:
        warehouse.insert_event(
            {
                "event_id": "evt_seeded",
                "user_id": "usr_seed",
                "event_type": "signup",
                "amount_minor_units": None,
                "currency": None,
                "occurred_at_utc": "2026-08-01T00:00:00Z",
                "source": "seed",
                "source_file": "seed",
            }
        )

    write_jsonl(settings.incoming_dir / "fresh.jsonl", [event("evt_fresh")])
    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_seeded") is not None
        assert warehouse.get_event("evt_fresh") is not None
        assert warehouse.logical_event_count() == 2
