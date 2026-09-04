"""Shared JSONL fixtures used by the behavioral verifier."""

from __future__ import annotations

import json
from pathlib import Path


def write_jsonl(path: Path, rows: list[object]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            if isinstance(row, str):
                handle.write(row.rstrip("\n") + "\n")
            else:
                handle.write(json.dumps(row) + "\n")
    return path


def event(
    event_id: str,
    *,
    user_id: str = "usr_1",
    event_type: str = "purchase",
    amount: str | None = "10.00",
    currency: str | None = "USD",
    occurred_at: str = "2026-09-03T12:00:00+00:00",
    source: str = "web",
    **extra: object,
) -> dict:
    payload = {
        "event_id": event_id,
        "user_id": user_id,
        "event_type": event_type,
        "occurred_at": occurred_at,
        "source": source,
    }
    if amount is not None:
        payload["amount"] = amount
    if currency is not None:
        payload["currency"] = currency
    payload.update(extra)
    return payload
