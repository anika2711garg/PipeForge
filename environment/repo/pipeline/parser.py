"""Parse JSONL event lines into structured records."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from pipeline.models import ParsedEvent

REQUIRED_FIELDS = (
    "event_id",
    "user_id",
    "event_type",
    "occurred_at",
    "source",
)


class EventRecord(BaseModel):
    """Inbound event schema. Unknown fields are ignored so a run can finish."""

    model_config = ConfigDict(extra="ignore")

    event_id: str
    user_id: str
    event_type: str
    amount: str | None = None
    currency: str | None = None
    occurred_at: str
    source: str


def parse_json_line(line: str) -> dict[str, Any]:
    """Decode one JSON object from a JSONL line."""
    return json.loads(line)


def parse_amount(value: str | None) -> int | None:
    """Convert a monetary string into integer minor units."""
    if value is None or value == "":
        return None
    return int(float(value) * 100)


def parse_timestamp(value: str) -> tuple[str, str]:
    """Return (occurred_at_utc_iso, metric_date)."""
    dt = datetime.fromisoformat(value)
    naive = dt.replace(tzinfo=None)
    occurred_at_utc = naive.strftime("%Y-%m-%dT%H:%M:%S")
    metric_date = naive.date().isoformat()
    return occurred_at_utc, metric_date


def parse_event_line(line: str) -> ParsedEvent:
    """Parse and validate a single JSONL line into a ParsedEvent."""
    payload = parse_json_line(line)
    record = EventRecord.model_validate(payload)
    amount_minor = parse_amount(record.amount)
    occurred_at_utc, metric_date = parse_timestamp(record.occurred_at)
    return ParsedEvent(
        event_id=record.event_id,
        user_id=record.user_id,
        event_type=record.event_type,
        amount_minor_units=amount_minor,
        currency=record.currency,
        occurred_at_utc=occurred_at_utc,
        metric_date=metric_date,
        source=record.source,
        raw=payload,
    )


def core_identity(event: ParsedEvent) -> tuple:
    """Fields that define whether two events with the same id agree."""
    return (
        event.event_id,
        event.user_id,
        event.event_type,
        event.amount_minor_units,
        event.currency,
        event.occurred_at_utc,
        event.source,
    )
