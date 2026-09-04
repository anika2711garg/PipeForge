"""SQLite analytical warehouse access layer."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from pipeline.config import Settings

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    amount_minor_units INTEGER,
    currency TEXT,
    occurred_at_utc TEXT NOT NULL,
    source TEXT,
    ingested_at TEXT NOT NULL,
    source_file TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    path TEXT,
    content_hash TEXT,
    status TEXT NOT NULL,
    record_count INTEGER,
    processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    files_processed INTEGER,
    records_accepted INTEGER,
    records_quarantined INTEGER,
    error TEXT
);

CREATE TABLE IF NOT EXISTS quarantine_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    raw_record TEXT NOT NULL,
    error_reason TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_metrics (
    metric_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_count INTEGER NOT NULL,
    total_amount_minor_units INTEGER NOT NULL
);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA_SQL)
    conn.commit()


class Warehouse:
    """Query and mutation helpers for the analytical warehouse."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        settings.ensure_directories()
        self._conn = connect(settings.db_path)
        initialize(self._conn)

    @property
    def connection(self) -> sqlite3.Connection:
        return self._conn

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "Warehouse":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def insert_event(self, event: dict[str, Any], *, commit: bool = True) -> None:
        self._conn.execute(
            """
            INSERT INTO events (
                event_id, user_id, event_type, amount_minor_units, currency,
                occurred_at_utc, source, ingested_at, source_file
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event["event_id"],
                event["user_id"],
                event["event_type"],
                event["amount_minor_units"],
                event["currency"],
                event["occurred_at_utc"],
                event["source"],
                event.get("ingested_at", utc_now()),
                event["source_file"],
            ),
        )
        if commit:
            self._conn.commit()

    def find_events(self, event_id: str) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM events WHERE event_id = ? ORDER BY id",
            (event_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    def get_event(self, event_id: str) -> dict[str, Any] | None:
        rows = self.find_events(event_id)
        return rows[0] if rows else None

    def event_count(self) -> int:
        row = self._conn.execute("SELECT COUNT(*) AS n FROM events").fetchone()
        return int(row["n"])

    def logical_event_count(self) -> int:
        row = self._conn.execute(
            "SELECT COUNT(DISTINCT event_id) AS n FROM events"
        ).fetchone()
        return int(row["n"])

    def list_events(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM events ORDER BY id"
        ).fetchall()
        return [dict(row) for row in rows]

    def insert_processed_file(
        self,
        filename: str,
        path: str,
        content_hash: str,
        status: str,
        record_count: int,
        *,
        commit: bool = True,
    ) -> None:
        self._conn.execute(
            """
            INSERT INTO processed_files (
                filename, path, content_hash, status, record_count, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (filename, path, content_hash, status, record_count, utc_now()),
        )
        if commit:
            self._conn.commit()

    def processed_files(self, filename: str | None = None) -> list[dict[str, Any]]:
        if filename is None:
            rows = self._conn.execute(
                "SELECT * FROM processed_files ORDER BY id"
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM processed_files WHERE filename = ? ORDER BY id",
                (filename,),
            ).fetchall()
        return [dict(row) for row in rows]

    def processed_file_count(self) -> int:
        row = self._conn.execute(
            "SELECT COUNT(DISTINCT filename) AS n FROM processed_files"
        ).fetchone()
        return int(row["n"])

    def start_run(self, run_id: str) -> None:
        self._conn.execute(
            """
            INSERT INTO pipeline_runs (
                run_id, started_at, completed_at, status,
                files_processed, records_accepted, records_quarantined, error
            ) VALUES (?, ?, NULL, 'running', 0, 0, 0, NULL)
            """,
            (run_id, utc_now()),
        )
        self._conn.commit()

    def finish_run(
        self,
        run_id: str,
        status: str,
        files_processed: int,
        records_accepted: int,
        records_quarantined: int,
        error: str | None = None,
    ) -> None:
        self._conn.execute(
            """
            UPDATE pipeline_runs
            SET completed_at = ?, status = ?, files_processed = ?,
                records_accepted = ?, records_quarantined = ?, error = ?
            WHERE run_id = ?
            """,
            (
                utc_now(),
                status,
                files_processed,
                records_accepted,
                records_quarantined,
                error,
                run_id,
            ),
        )
        self._conn.commit()

    def list_runs(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM pipeline_runs ORDER BY started_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]

    def latest_run(self) -> dict[str, Any] | None:
        row = self._conn.execute(
            "SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT 1"
        ).fetchone()
        return dict(row) if row else None

    def insert_quarantine(
        self,
        source_file: str,
        line_number: int,
        raw_record: str,
        error_reason: str,
        *,
        commit: bool = True,
    ) -> None:
        self._conn.execute(
            """
            INSERT INTO quarantine_records (
                source_file, line_number, raw_record, error_reason, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (source_file, line_number, raw_record, error_reason, utc_now()),
        )
        if commit:
            self._conn.commit()

    def quarantine_count(self) -> int:
        row = self._conn.execute(
            "SELECT COUNT(*) AS n FROM quarantine_records"
        ).fetchone()
        return int(row["n"])

    def list_quarantine(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT * FROM quarantine_records ORDER BY id"
        ).fetchall()
        return [dict(row) for row in rows]

    def insert_metric(
        self,
        metric_date: str,
        event_type: str,
        event_count: int,
        total_amount_minor_units: int,
        *,
        commit: bool = True,
    ) -> None:
        self._conn.execute(
            """
            INSERT INTO daily_metrics (
                metric_date, event_type, event_count, total_amount_minor_units
            ) VALUES (?, ?, ?, ?)
            """,
            (metric_date, event_type, event_count, total_amount_minor_units),
        )
        if commit:
            self._conn.commit()

    def list_metrics(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT metric_date, event_type,
                   SUM(event_count) AS event_count,
                   SUM(total_amount_minor_units) AS total_amount_minor_units
            FROM daily_metrics
            GROUP BY metric_date, event_type
            ORDER BY metric_date, event_type
            """
        ).fetchall()
        return [dict(row) for row in rows]

    def metrics_for_date(self, metric_date: str) -> list[dict[str, Any]]:
        return [m for m in self.list_metrics() if m["metric_date"] == metric_date]

    def metric_total_amount(self, metric_date: str | None = None) -> int:
        metrics = self.list_metrics()
        if metric_date is not None:
            metrics = [m for m in metrics if m["metric_date"] == metric_date]
        return int(sum(int(m["total_amount_minor_units"] or 0) for m in metrics))

    def metric_event_count(self, metric_date: str | None = None) -> int:
        metrics = self.list_metrics()
        if metric_date is not None:
            metrics = [m for m in metrics if m["metric_date"] == metric_date]
        return int(sum(int(m["event_count"] or 0) for m in metrics))

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        row = self._conn.execute(
            "SELECT * FROM pipeline_runs WHERE run_id = ?",
            (run_id,),
        ).fetchone()
        return dict(row) if row else None

    def get_quarantine_record(self, record_id: int) -> dict[str, Any] | None:
        row = self._conn.execute(
            "SELECT * FROM quarantine_records WHERE id = ?",
            (record_id,),
        ).fetchone()
        return dict(row) if row else None

    def event_facets(self) -> dict[str, list[str]]:
        def _values(column: str) -> list[str]:
            rows = self._conn.execute(
                f"SELECT DISTINCT {column} AS value FROM events "
                f"WHERE {column} IS NOT NULL AND {column} != '' "
                "ORDER BY value"
            ).fetchall()
            return [str(row["value"]) for row in rows]

        return {
            "event_types": _values("event_type"),
            "currencies": _values("currency"),
            "sources": _values("source"),
        }

    def currency_totals(self) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT COALESCE(currency, 'UNKNOWN') AS currency,
                   COUNT(*) AS event_count,
                   COALESCE(SUM(amount_minor_units), 0) AS total_amount_minor_units
            FROM events
            GROUP BY COALESCE(currency, 'UNKNOWN')
            ORDER BY currency
            """
        ).fetchall()
        return [dict(row) for row in rows]

    def query_events(
        self,
        *,
        search: str | None = None,
        event_type: str | None = None,
        currency: str | None = None,
        source: str | None = None,
        limit: int = 50,
        offset: int = 0,
        sort: str = "id",
        order: str = "desc",
    ) -> tuple[list[dict[str, Any]], int]:
        allowed_sort = {
            "id",
            "event_id",
            "user_id",
            "event_type",
            "amount_minor_units",
            "currency",
            "occurred_at_utc",
            "source",
            "source_file",
            "ingested_at",
        }
        sort_column = sort if sort in allowed_sort else "id"
        direction = "DESC" if str(order).lower() == "desc" else "ASC"
        safe_limit = max(1, min(int(limit), 200))
        safe_offset = max(0, int(offset))

        clauses: list[str] = []
        params: list[Any] = []
        if search:
            like = f"%{search}%"
            clauses.append(
                "(event_id LIKE ? OR user_id LIKE ? OR source_file LIKE ? OR source LIKE ?)"
            )
            params.extend([like, like, like, like])
        if event_type:
            clauses.append("event_type = ?")
            params.append(event_type)
        if currency:
            clauses.append("currency = ?")
            params.append(currency)
        if source:
            clauses.append("source = ?")
            params.append(source)

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        count_row = self._conn.execute(
            f"SELECT COUNT(*) AS n FROM events {where}",
            params,
        ).fetchone()
        rows = self._conn.execute(
            f"SELECT * FROM events {where} ORDER BY {sort_column} {direction} "
            "LIMIT ? OFFSET ?",
            [*params, safe_limit, safe_offset],
        ).fetchall()
        return [dict(row) for row in rows], int(count_row["n"])

    def incoming_files(self) -> list[dict[str, Any]]:
        incoming = self.settings.incoming_dir
        if not incoming.exists():
            return []
        result = []
        for path in sorted(incoming.glob("*.jsonl")):
            processed = self.processed_files(path.name)
            latest = processed[-1] if processed else None
            result.append(
                {
                    "filename": path.name,
                    "size": path.stat().st_size,
                    "processed": bool(processed),
                    "content_hash": (latest or {}).get("content_hash"),
                    "record_count": (latest or {}).get("record_count"),
                    "status": (latest or {}).get("status"),
                    "processed_at": (latest or {}).get("processed_at"),
                }
            )
        return result

    def iter_jsonl(self, path: Path) -> Iterator[tuple[int, str]]:
        with path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                yield line_number, line.rstrip("\n")
