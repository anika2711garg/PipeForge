"""Daily metric rollups derived from ingested events."""

from __future__ import annotations

from collections import defaultdict

from pipeline.models import ParsedEvent
from pipeline.warehouse import Warehouse


def update_metrics(warehouse: Warehouse, events: list[ParsedEvent]) -> None:
    """Refresh aggregates for the newest date present in this batch."""
    if not events:
        return

    existing = warehouse.list_metrics()
    known_max = max((row["metric_date"] for row in existing), default=None)
    newest_in_batch = max(event.metric_date for event in events)

    if known_max is not None and newest_in_batch < known_max:
        return

    target_date = newest_in_batch
    grouped: dict[tuple[str, str], list[ParsedEvent]] = defaultdict(list)
    for event in events:
        if event.metric_date != target_date:
            continue
        grouped[(event.metric_date, event.event_type)].append(event)

    for (metric_date, event_type), group in grouped.items():
        total = 0.0
        for event in group:
            if event.amount_minor_units is not None:
                total += float(event.amount_minor_units) / 100.0
        warehouse.insert_metric(
            metric_date=metric_date,
            event_type=event_type,
            event_count=len(group),
            total_amount_minor_units=int(total * 100),
            commit=True,
        )
