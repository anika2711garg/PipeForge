"""Lightweight FastAPI control center for PipeForge."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from pipeline.checkpoint import content_hash
from pipeline.config import Settings
from pipeline.demo import generate_demo_data, reset_demo_data
from pipeline.ingest import pipeline_status, run_pipeline
from pipeline.warehouse import Warehouse, utc_now

STATIC_DIR = Path(__file__).resolve().parent / "static"
BACKEND_VERSION = "1.0.0"

app = FastAPI(title="PipeForge", docs_url=None, redoc_url=None)

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
_extra = os.environ.get("PIPEFORGE_CORS_ORIGINS", "")
_origins = _default_origins + [item.strip() for item in _extra.split(",") if item.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _settings() -> Settings:
    return Settings()


def _safe_name(path: Path) -> str:
    return path.name


def _enrich_files(warehouse: Warehouse, files: list[dict]) -> list[dict]:
    incoming = warehouse.settings.incoming_dir
    enriched: list[dict] = []
    for item in files:
        path = incoming / str(item["filename"])
        current = content_hash(path) if path.is_file() else None
        stored = item.get("content_hash")
        processed = bool(item.get("processed"))
        changed = bool(processed and stored and current and stored != current)
        enriched.append(
            {
                **item,
                "current_hash": current,
                "content_changed": changed,
            }
        )
    return enriched


def _status_payload() -> dict:
    settings = _settings()
    snapshot = pipeline_status(settings)
    with Warehouse(settings) as warehouse:
        runs = warehouse.list_runs()
        physical = int(snapshot.get("total_warehouse_events") or 0)
        logical = warehouse.logical_event_count()
        snapshot["logical_warehouse_events"] = logical
        snapshot["duplicate_event_rows"] = max(0, physical - logical)
        snapshot["total_runs"] = len(runs)
        snapshot["total_accepted_records"] = sum(
            int(run.get("records_accepted") or 0) for run in runs
        )
        snapshot["last_failed_run"] = next(
            (run for run in runs if run.get("status") == "failed"),
            None,
        )
        snapshot["currency_totals"] = warehouse.currency_totals()
        snapshot["incoming_file_count"] = len(warehouse.incoming_files())
    snapshot["database"] = _safe_name(settings.db_path)
    snapshot["incoming_dir"] = _safe_name(settings.incoming_dir)
    snapshot["backend_version"] = BACKEND_VERSION
    return snapshot


def _health_payload() -> dict:
    settings = _settings()
    settings.ensure_directories()
    database_status = "missing"
    incoming_status = "healthy" if settings.incoming_dir.is_dir() else "missing"
    try:
        if settings.db_path.exists():
            with Warehouse(settings) as warehouse:
                warehouse.event_count()
            database_status = "healthy"
        else:
            database_status = "missing"
    except Exception:
        database_status = "error"

    overall = "healthy"
    if database_status != "healthy" or incoming_status != "healthy":
        overall = "degraded"

    return {
        "status": overall,
        "api": "healthy",
        "database": database_status,
        "incoming_dir": incoming_status,
        "database_name": _safe_name(settings.db_path),
        "incoming_name": _safe_name(settings.incoming_dir),
        "backend_version": BACKEND_VERSION,
        "checked_at": utc_now(),
    }


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def api_health() -> dict:
    return _health_payload()


@app.get("/api/status")
def api_status() -> dict:
    return _status_payload()


@app.get("/api/system")
def api_system() -> dict:
    settings = _settings()
    health = _health_payload()
    status = _status_payload()
    return {
        "api": health["api"],
        "database": {
            "status": health["database"],
            "name": health["database_name"],
        },
        "incoming": {
            "status": health["incoming_dir"],
            "name": health["incoming_name"],
            "file_count": status.get("incoming_file_count", 0),
        },
        "backend_version": BACKEND_VERSION,
        "total_events": status.get("total_warehouse_events", 0),
        "logical_events": status.get("logical_warehouse_events", 0),
        "total_processed_files": status.get("total_processed_files", 0),
        "quarantined_records": status.get("quarantined_records", 0),
        "total_runs": status.get("total_runs", 0),
        "last_successful_run": status.get("last_successful_run"),
        "last_failed_run": status.get("last_failed_run"),
        "latest_run": status.get("latest_run"),
        "checked_at": health["checked_at"],
        "database_exists": settings.db_path.exists(),
    }


@app.get("/api/runs")
def api_runs() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_runs()


@app.get("/api/runs/{run_id}")
def api_run_detail(run_id: str) -> dict:
    with Warehouse(_settings()) as warehouse:
        row = warehouse.get_run(run_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return row


@app.get("/api/files")
def api_files() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return _enrich_files(warehouse, warehouse.incoming_files())


@app.get("/api/metrics")
def api_metrics() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_metrics()


@app.get("/api/quarantine")
def api_quarantine() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_quarantine()


@app.get("/api/quarantine/{record_id}")
def api_quarantine_detail(record_id: int) -> dict:
    with Warehouse(_settings()) as warehouse:
        row = warehouse.get_quarantine_record(record_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Quarantine record not found")
        return row


@app.get("/api/events")
def api_events(
    search: str | None = None,
    event_type: str | None = None,
    currency: str | None = None,
    source: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort: str = "id",
    order: str = "desc",
) -> dict:
    with Warehouse(_settings()) as warehouse:
        items, total = warehouse.query_events(
            search=search,
            event_type=event_type,
            currency=currency,
            source=source,
            limit=limit,
            offset=offset,
            sort=sort,
            order=order,
        )
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
        }


@app.get("/api/events/facets")
def api_event_facets() -> dict:
    with Warehouse(_settings()) as warehouse:
        return warehouse.event_facets()


@app.get("/api/search")
def api_search(q: str = "", limit: int = Query(default=8, ge=1, le=25)) -> dict:
    query = q.strip()
    if not query:
        return {"q": query, "runs": [], "files": [], "events": [], "quarantine": []}

    like = f"%{query}%"
    with Warehouse(_settings()) as warehouse:
        runs = [
            run
            for run in warehouse.list_runs()
            if query.lower() in str(run.get("run_id") or "").lower()
        ][:limit]
        files = [
            item
            for item in warehouse.incoming_files()
            if query.lower() in str(item.get("filename") or "").lower()
        ][:limit]
        events, _total = warehouse.query_events(search=query, limit=limit, offset=0)
        quarantine = warehouse.connection.execute(
            """
            SELECT id, source_file, line_number, error_reason, created_at
            FROM quarantine_records
            WHERE source_file LIKE ? OR error_reason LIKE ? OR raw_record LIKE ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (like, like, like, limit),
        ).fetchall()
        return {
            "q": query,
            "runs": runs,
            "files": files,
            "events": events,
            "quarantine": [dict(row) for row in quarantine],
        }


@app.post("/api/run")
def api_run() -> dict:
    settings = _settings()
    summary = run_pipeline(settings)
    started_at = None
    completed_at = None
    with Warehouse(settings) as warehouse:
        row = warehouse.get_run(summary.run_id)
        if row:
            started_at = row.get("started_at")
            completed_at = row.get("completed_at")
    return {
        "run_id": summary.run_id,
        "files_discovered": summary.files_discovered,
        "files_processed": summary.files_processed,
        "files_skipped": summary.files_skipped,
        "records_accepted": summary.records_accepted,
        "records_duplicated": summary.records_duplicated,
        "records_quarantined": summary.records_quarantined,
        "status": summary.status,
        "error": summary.error,
        "started_at": started_at,
        "completed_at": completed_at,
    }


@app.post("/api/demo/generate")
def api_demo_generate() -> dict:
    paths = generate_demo_data(_settings())
    return {"files": [path.name for path in paths]}


@app.post("/api/demo/reset")
def api_demo_reset() -> dict:
    paths = reset_demo_data(_settings())
    return {"files": [path.name for path in paths], "warehouse": "reset"}


@app.exception_handler(HTTPException)
async def http_errors(request: Request, exc: HTTPException) -> JSONResponse:
    return await http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return await http_exception_handler(request, exc)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def main() -> None:
    import uvicorn

    uvicorn.run(
        "pipeline.dashboard:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()
