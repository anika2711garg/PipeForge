"""Lightweight FastAPI control center for PipeForge."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from pipeline.config import Settings
from pipeline.demo import generate_demo_data, reset_demo_data
from pipeline.ingest import pipeline_status, run_pipeline
from pipeline.warehouse import Warehouse

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="PipeForge", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _settings() -> Settings:
    return Settings()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/status")
def api_status() -> dict:
    return pipeline_status(_settings())


@app.get("/api/runs")
def api_runs() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_runs()


@app.get("/api/files")
def api_files() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.incoming_files()


@app.get("/api/metrics")
def api_metrics() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_metrics()


@app.get("/api/quarantine")
def api_quarantine() -> list[dict]:
    with Warehouse(_settings()) as warehouse:
        return warehouse.list_quarantine()


@app.post("/api/run")
def api_run() -> dict:
    summary = run_pipeline(_settings())
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
    }


@app.post("/api/demo/generate")
def api_demo_generate() -> dict:
    paths = generate_demo_data(_settings())
    return {"files": [path.name for path in paths]}


@app.post("/api/demo/reset")
def api_demo_reset() -> dict:
    paths = reset_demo_data(_settings())
    return {"files": [path.name for path in paths], "warehouse": "reset"}


@app.exception_handler(Exception)
async def unhandled(_request, exc: Exception) -> JSONResponse:
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
