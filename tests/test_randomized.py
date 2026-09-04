"""Seeded integration dataset with an independent expected-result oracle."""

from __future__ import annotations

import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_EVEN
from pathlib import Path

from pipeline.config import Settings
from pipeline.ingest import run_pipeline
from pipeline.warehouse import Warehouse

from helpers import write_jsonl

REQUIRED = ("event_id", "user_id", "event_type", "occurred_at", "source")


def _minor(amount: str | None) -> int | None:
    if amount is None:
        return None
    cents = (Decimal(amount) * Decimal(100)).quantize(
        Decimal("1"), rounding=ROUND_HALF_EVEN
    )
    return int(cents)


def _oracle(files: list[Path]) -> dict:
    events: dict[str, dict] = {}
    quarantine = 0
    for path in files:
        for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not raw.strip():
                continue
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                quarantine += 1
                continue
            if not isinstance(payload, dict) or any(field not in payload for field in REQUIRED):
                quarantine += 1
                continue
            try:
                occurred = datetime.fromisoformat(str(payload["occurred_at"]))
            except ValueError:
                quarantine += 1
                continue
            if occurred.tzinfo is None:
                quarantine += 1
                continue
            utc = occurred.astimezone(timezone.utc)
            amount = payload.get("amount")
            try:
                minor = _minor(None if amount in (None, "") else str(amount))
            except Exception:
                quarantine += 1
                continue
            candidate = {
                "event_id": str(payload["event_id"]),
                "user_id": str(payload["user_id"]),
                "event_type": str(payload["event_type"]),
                "amount_minor_units": minor,
                "currency": payload.get("currency"),
                "occurred_at_utc": utc,
                "source": str(payload["source"]),
            }
            existing = events.get(candidate["event_id"])
            if existing is None:
                events[candidate["event_id"]] = candidate
                continue
            same = all(
                existing[key] == candidate[key]
                for key in (
                    "user_id",
                    "event_type",
                    "amount_minor_units",
                    "currency",
                    "source",
                )
            ) and existing["occurred_at_utc"] == candidate["occurred_at_utc"]
            if not same:
                quarantine += 1

    metrics: dict[tuple[str, str], dict[str, int]] = {}
    for item in events.values():
        day = item["occurred_at_utc"].date().isoformat()
        key = (day, item["event_type"])
        bucket = metrics.setdefault(key, {"event_count": 0, "total_amount_minor_units": 0})
        bucket["event_count"] += 1
        bucket["total_amount_minor_units"] += int(item["amount_minor_units"] or 0)

    return {
        "accepted": len(events),
        "quarantine": quarantine,
        "metrics": metrics,
    }


def test_randomized_dataset_matches_independent_oracle(settings: Settings) -> None:
    rng = random.Random(20260812)
    file_count = rng.randint(3, 6)
    target_events = rng.randint(40, 100)
    files: list[Path] = []
    catalog: list[dict] = []

    amounts = ["0.10", "0.20", "10.07", "19.99", "99.99"]
    types = ["purchase", "page_view", "signup"]
    offsets = [timezone.utc, timezone(timedelta(hours=5, minutes=30)), timezone(timedelta(hours=-4))]

    remaining = target_events
    for file_index in range(file_count):
        rows: list[object] = []
        share = remaining if file_index == file_count - 1 else rng.randint(5, max(6, remaining // 2))
        remaining = max(0, remaining - share)
        for _ in range(share):
            occurred = datetime(2026, 8, rng.randint(1, 8), rng.randint(0, 23), rng.randint(0, 59), tzinfo=rng.choice(offsets))
            event_type = rng.choice(types)
            payload = {
                "event_id": f"evt_{uuid.UUID(int=rng.getrandbits(128), version=4)}",
                "user_id": f"usr_{rng.randint(1, 40)}",
                "event_type": event_type,
                "occurred_at": occurred.isoformat(),
                "source": rng.choice(["web", "mobile", "ios"]),
            }
            if event_type == "purchase":
                payload["amount"] = rng.choice(amounts)
                payload["currency"] = "USD"
            if rng.random() < 0.2:
                payload["app_version"] = f"9.{rng.randint(0, 9)}.{rng.randint(0, 9)}"
            catalog.append(payload)
            rows.append(payload)
        if catalog:
            rows.append(dict(rng.choice(catalog)))
        if rng.random() < 0.8:
            rows.append("{not-json-" + str(rng.randint(1, 99)))
        late = datetime(2026, 7, rng.randint(20, 28), 10, 0, tzinfo=timezone.utc)
        rows.append(
            {
                "event_id": f"evt_late_{file_index}_{rng.randint(1, 9999)}",
                "user_id": "usr_late",
                "event_type": "purchase",
                "amount": "10.07",
                "currency": "USD",
                "occurred_at": late.isoformat(),
                "source": "web",
            }
        )
        path = settings.incoming_dir / f"rand_{rng.randint(1000, 9999)}_{file_index}.jsonl"
        write_jsonl(path, rows)
        files.append(path)

    expected = _oracle(files)
    first = run_pipeline(settings)
    assert first.status == "completed"

    with Warehouse(settings) as warehouse:
        assert warehouse.logical_event_count() == expected["accepted"]
        assert warehouse.event_count() == expected["accepted"]
        assert warehouse.quarantine_count() == expected["quarantine"]
        actual_metrics = {
            (row["metric_date"], row["event_type"]): {
                "event_count": int(row["event_count"]),
                "total_amount_minor_units": int(row["total_amount_minor_units"]),
            }
            for row in warehouse.list_metrics()
        }
        assert actual_metrics == expected["metrics"]

    second = run_pipeline(settings)
    assert second.status == "completed"
    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == expected["accepted"]
        assert warehouse.quarantine_count() == expected["quarantine"]
        assert warehouse.list_metrics() == [
            {
                "metric_date": date,
                "event_type": event_type,
                "event_count": values["event_count"],
                "total_amount_minor_units": values["total_amount_minor_units"],
            }
            for (date, event_type), values in sorted(expected["metrics"].items())
        ]
