"""Financial totals must be exact integer minor units."""

from __future__ import annotations

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_repeated_decimal_amounts_sum_exactly(settings: Settings) -> None:
    rows = []
    for index in range(10):
        rows.append(event(f"evt_dime_{index}", amount="0.10", event_type="micro"))
    for index in range(10):
        rows.append(event(f"evt_double_{index}", amount="0.20", event_type="fee"))
    rows.append(event("evt_ten_oh_seven", amount="10.07"))
    rows.append(event("evt_ninety_nine", amount="99.99"))
    write_jsonl(settings.incoming_dir / "money.jsonl", rows)

    summary = run_pipeline(settings)
    assert summary.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.get_event("evt_ten_oh_seven")["amount_minor_units"] == 1007
        assert warehouse.get_event("evt_ninety_nine")["amount_minor_units"] == 9999
        micro = next(
            row
            for row in warehouse.list_metrics()
            if row["event_type"] == "micro"
        )
        fee = next(
            row
            for row in warehouse.list_metrics()
            if row["event_type"] == "fee"
        )
        assert int(micro["total_amount_minor_units"]) == 100
        assert int(micro["event_count"]) == 10
        assert int(fee["total_amount_minor_units"]) == 200
        assert warehouse.metric_total_amount("2026-09-03") == 100 + 200 + 1007 + 9999
