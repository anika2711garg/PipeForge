"""PipeForge incremental ETL pipeline."""

from pipeline.config import Settings
from pipeline.ingest import run_pipeline

__all__ = ["Settings", "run_pipeline"]
