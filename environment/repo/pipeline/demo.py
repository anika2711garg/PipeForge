"""Deterministic synthetic demo-dataset helpers."""

from __future__ import annotations

import json
from pathlib import Path

from pipeline.config import Settings
from pipeline.warehouse import Warehouse

DEMO_SEED_EVENTS = [
    {
        "event_id": "evt_demo_1001",
        "user_id": "usr_north_01",
        "event_type": "signup",
        "amount": None,
        "currency": None,
        "occurred_at": "2026-08-03T10:15:00+00:00",
        "source": "web",
    },
    {
        "event_id": "evt_demo_1002",
        "user_id": "usr_north_01",
        "event_type": "page_view",
        "amount": None,
        "currency": None,
        "occurred_at": "2026-08-03T10:16:22+00:00",
        "source": "web",
        "device_type": "desktop",
        "app_version": "8.1.0",
    },
    {
        "event_id": "evt_demo_1003",
        "user_id": "usr_north_01",
        "event_type": "purchase",
        "amount": "19.99",
        "currency": "USD",
        "occurred_at": "2026-08-03T10:18:04+00:00",
        "source": "web",
    },
]


def _write_jsonl(path: Path, rows: list[object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            if isinstance(row, str):
                handle.write(row.rstrip("\n") + "\n")
            else:
                handle.write(json.dumps(row, separators=(",", ":")) + "\n")


def generate_demo_batches(incoming_dir: Path) -> list[Path]:
    """Write a deterministic multi-file demo dataset and return paths."""
    incoming_dir.mkdir(parents=True, exist_ok=True)

    batch_one: list[object] = []
    for index in range(20):
        batch_one.append(
            {
                "event_id": f"evt_demo_{2000 + index}",
                "user_id": f"usr_{(index % 7) + 1:02d}",
                "event_type": "purchase" if index % 3 == 0 else "page_view",
                "amount": "10.07" if index % 3 == 0 else None,
                "currency": "USD" if index % 3 == 0 else None,
                "occurred_at": f"2026-08-04T1{index % 8}:0{index % 6}:00+00:00",
                "source": "mobile" if index % 2 == 0 else "web",
            }
        )
    batch_one.append(
        {
            "event_id": "evt_demo_dup_shared",
            "user_id": "usr_shared",
            "event_type": "purchase",
            "amount": "0.10",
            "currency": "USD",
            "occurred_at": "2026-08-04T12:00:00+00:00",
            "source": "mobile",
        }
    )
    batch_one.append(
        {
            "event_id": "evt_demo_tz_boundary",
            "user_id": "usr_tz",
            "event_type": "purchase",
            "amount": "0.20",
            "currency": "USD",
            "occurred_at": "2026-08-05T00:30:00+05:30",
            "source": "mobile",
        }
    )

    batch_two: list[object] = list(DEMO_SEED_EVENTS)
    for index in range(12):
        batch_two.append(
            {
                "event_id": f"evt_demo_{3000 + index}",
                "user_id": f"usr_west_{index % 4}",
                "event_type": "signup" if index % 4 == 0 else "purchase",
                "amount": "99.99" if index % 4 else None,
                "currency": "USD" if index % 4 else None,
                "occurred_at": f"2026-08-04T18:{index:02d}:00-04:00",
                "source": "ios",
                "experiment": "checkout_v2",
            }
        )
    batch_two.append(
        {
            "event_id": "evt_demo_dup_shared",
            "user_id": "usr_shared",
            "event_type": "purchase",
            "amount": "0.10",
            "currency": "USD",
            "occurred_at": "2026-08-04T12:00:00+00:00",
            "source": "mobile",
        }
    )
    batch_two.append("{this is not valid json")
    batch_two.append(
        {
            "event_id": "evt_demo_late_hist",
            "user_id": "usr_late",
            "event_type": "purchase",
            "amount": "10.07",
            "currency": "USD",
            "occurred_at": "2026-08-01T09:00:00+00:00",
            "source": "web",
        }
    )

    paths = [
        incoming_dir / "events_001.jsonl",
        incoming_dir / "events_002.jsonl",
        incoming_dir / "events_003.jsonl",
    ]
    _write_jsonl(paths[0], batch_one)
    _write_jsonl(paths[1], batch_two)
    _write_jsonl(
        paths[2],
        [
            {
                "event_id": "evt_demo_repeat_cents",
                "user_id": "usr_cents",
                "event_type": "purchase",
                "amount": "0.10",
                "currency": "USD",
                "occurred_at": "2026-08-04T20:00:00+00:00",
                "source": "web",
            },
            {
                "event_id": "evt_demo_repeat_cents_b",
                "user_id": "usr_cents",
                "event_type": "purchase",
                "amount": "0.20",
                "currency": "USD",
                "occurred_at": "2026-08-04T20:01:00+00:00",
                "source": "web",
            },
        ],
    )
    return paths


def generate_demo_data(settings: Settings | None = None) -> list[Path]:
    settings = settings or Settings()
    settings.ensure_directories()
    return generate_demo_batches(settings.incoming_dir)


def reset_demo_data(settings: Settings | None = None) -> list[Path]:
    """Wipe warehouse state and regenerate the synthetic incoming files."""
    settings = settings or Settings()
    settings.ensure_directories()
    if settings.db_path.exists():
        settings.db_path.unlink()
    for leftover in settings.incoming_dir.glob("*.jsonl"):
        leftover.unlink()
    for leftover in settings.quarantine_dir.glob("*"):
        if leftover.is_file():
            leftover.unlink()
    paths = generate_demo_batches(settings.incoming_dir)
    Warehouse(settings).close()
    return paths
