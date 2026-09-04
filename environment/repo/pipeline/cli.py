"""Command-line interface for PipeForge."""

from __future__ import annotations

import argparse
import sys

from pipeline.config import Settings
from pipeline.ingest import pipeline_status, run_pipeline


def _print_run_summary(summary) -> None:
    print(f"Run ID: {summary.run_id}")
    print(f"Files discovered: {summary.files_discovered}")
    print(f"Files processed: {summary.files_processed}")
    print(f"Files skipped: {summary.files_skipped}")
    print(f"Records accepted: {summary.records_accepted}")
    print(f"Records duplicated: {summary.records_duplicated}")
    print(f"Records quarantined: {summary.records_quarantined}")
    print(f"Status: {summary.status}")
    if summary.error:
        print(f"Error: {summary.error}")


def _print_status(snapshot: dict) -> None:
    last = snapshot.get("last_successful_run")
    latest = snapshot.get("latest_run")
    totals = snapshot.get("aggregate_totals") or {}
    print(f"Total processed files: {snapshot['total_processed_files']}")
    print(f"Total warehouse events: {snapshot['total_warehouse_events']}")
    print(f"Quarantined records: {snapshot['quarantined_records']}")
    if last:
        print(f"Last successful run: {last['run_id']} ({last['completed_at']})")
    elif latest:
        print(f"Last successful run: none (latest={latest['run_id']} {latest['status']})")
    else:
        print("Last successful run: none")
    print(f"Aggregate event count: {totals.get('event_count', 0)}")
    print(
        "Aggregate amount (minor units): "
        f"{totals.get('total_amount_minor_units', 0)}"
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipeline",
        description="PipeForge incremental event ETL",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("run", help="Process eligible incoming JSONL files")
    sub.add_parser("status", help="Show warehouse and pipeline status")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    settings = Settings()
    if args.command == "run":
        summary = run_pipeline(settings)
        _print_run_summary(summary)
        return 0 if summary.status == "completed" else 1
    if args.command == "status":
        _print_status(pipeline_status(settings))
        return 0
    parser.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
