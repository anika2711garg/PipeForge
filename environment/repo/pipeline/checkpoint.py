"""File-identity and processed-file bookkeeping."""

from __future__ import annotations

import hashlib
from pathlib import Path

from pipeline.warehouse import Warehouse


def content_hash(path: Path) -> str:
    """SHA-256 of the file bytes."""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def should_skip(warehouse: Warehouse, path: Path) -> bool:
    """Return True if this incoming file should not be ingested again."""
    digest = content_hash(path)
    rows = warehouse.connection.execute(
        "SELECT 1 FROM processed_files WHERE content_hash = ? AND status = 'success'",
        (path.name,),
    ).fetchone()
    _ = digest
    return rows is not None


def mark_processed(
    warehouse: Warehouse,
    path: Path,
    record_count: int,
    status: str = "success",
    *,
    commit: bool = True,
) -> None:
    warehouse.insert_processed_file(
        filename=path.name,
        path=str(path),
        content_hash=content_hash(path),
        status=status,
        record_count=record_count,
        commit=commit,
    )
