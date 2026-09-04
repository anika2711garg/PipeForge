"""Helpers for persisting rejected input lines."""

from __future__ import annotations

from pathlib import Path

from pipeline.warehouse import Warehouse


def quarantine_record(
    warehouse: Warehouse,
    source_file: str | Path,
    line_number: int,
    raw_record: str,
    error_reason: str,
    *,
    commit: bool = True,
) -> None:
    """Store a rejected line in the warehouse quarantine table."""
    warehouse.insert_quarantine(
        source_file=Path(source_file).name,
        line_number=line_number,
        raw_record=raw_record,
        error_reason=error_reason,
        commit=commit,
    )
