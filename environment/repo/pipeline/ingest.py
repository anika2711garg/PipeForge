"""Discover incoming JSONL files and load them into the warehouse."""

from __future__ import annotations

import uuid
from pathlib import Path

from pipeline.checkpoint import mark_processed, should_skip
from pipeline.config import Settings
from pipeline.metrics import update_metrics
from pipeline.models import FailureInjector, ParsedEvent, RunSummary
from pipeline.parser import parse_event_line
from pipeline.warehouse import Warehouse, utc_now


def discover_files(incoming_dir: Path) -> list[Path]:
    if not incoming_dir.exists():
        return []
    return sorted(path for path in incoming_dir.glob("*.jsonl") if path.is_file())


def _event_payload(event: ParsedEvent, source_file: str) -> dict:
    return {
        "event_id": event.event_id,
        "user_id": event.user_id,
        "event_type": event.event_type,
        "amount_minor_units": event.amount_minor_units,
        "currency": event.currency,
        "occurred_at_utc": event.occurred_at_utc,
        "source": event.source,
        "ingested_at": utc_now(),
        "source_file": source_file,
    }


def _process_file(
    warehouse: Warehouse,
    path: Path,
    injector: FailureInjector | None,
) -> tuple[int, int, list[ParsedEvent]]:
    accepted = 0
    seen_local: set[str] = set()
    parsed: list[ParsedEvent] = []

    mark_processed(warehouse, path, record_count=0, status="success", commit=True)

    for _line_number, line in warehouse.iter_jsonl(path):
        if not line.strip():
            continue
        event = parse_event_line(line)
        if event.event_id in seen_local:
            continue
        seen_local.add(event.event_id)
        warehouse.insert_event(_event_payload(event, path.name), commit=True)
        parsed.append(event)
        accepted += 1
        if injector is not None:
            injector.notify_record_written()

    if injector is not None:
        injector.notify_before_commit()
        injector.notify_after_write_before_checkpoint()

    return accepted, 0, parsed


def run_pipeline(
    settings: Settings | None = None,
    injector: FailureInjector | None = None,
) -> RunSummary:
    """Process eligible incoming JSONL files into the warehouse."""
    settings = settings or Settings()
    settings.ensure_directories()
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    summary = RunSummary(run_id=run_id, status="running")

    with Warehouse(settings) as warehouse:
        warehouse.start_run(run_id)
        files = discover_files(settings.incoming_dir)
        summary.files_discovered = len(files)
        accepted_events: list[ParsedEvent] = []

        try:
            for path in files:
                if should_skip(warehouse, path):
                    summary.files_skipped += 1
                    continue
                accepted, duplicated, parsed = _process_file(
                    warehouse, path, injector
                )
                summary.files_processed += 1
                summary.records_accepted += accepted
                summary.records_duplicated += duplicated
                accepted_events.extend(parsed)

            update_metrics(warehouse, accepted_events)
            summary.status = "completed"
            warehouse.finish_run(
                run_id,
                status=summary.status,
                files_processed=summary.files_processed,
                records_accepted=summary.records_accepted,
                records_quarantined=summary.records_quarantined,
            )
        except Exception as exc:
            summary.status = "failed"
            summary.error = str(exc)
            warehouse.finish_run(
                run_id,
                status="failed",
                files_processed=summary.files_processed,
                records_accepted=summary.records_accepted,
                records_quarantined=summary.records_quarantined,
                error=str(exc),
            )
            if injector is not None and type(exc).__name__ == "IngestInjectionError":
                raise
            return summary

    return summary


def pipeline_status(settings: Settings | None = None) -> dict:
    """Aggregated warehouse snapshot used by CLI and the dashboard."""
    settings = settings or Settings()
    settings.ensure_directories()
    with Warehouse(settings) as warehouse:
        latest = warehouse.latest_run()
        metrics = warehouse.list_metrics()
        totals = {
            "event_count": sum(int(m["event_count"] or 0) for m in metrics),
            "total_amount_minor_units": sum(
                int(m["total_amount_minor_units"] or 0) for m in metrics
            ),
        }
        return {
            "total_processed_files": warehouse.processed_file_count(),
            "total_warehouse_events": warehouse.event_count(),
            "quarantined_records": warehouse.quarantine_count(),
            "last_successful_run": next(
                (
                    run
                    for run in warehouse.list_runs()
                    if run["status"] == "completed"
                ),
                None,
            ),
            "latest_run": latest,
            "aggregate_totals": totals,
            "metrics": metrics,
            "database": str(settings.db_path),
            "database_exists": settings.db_path.exists(),
        }
