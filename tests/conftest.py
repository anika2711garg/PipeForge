"""Isolate each test against a temporary incoming directory and SQLite file."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DOCKER_REPO = Path("/workspace")


def _candidate_repo() -> Path:
    override = os.environ.get("PIPEFORGE_CANDIDATE_REPO", "").strip()
    if override:
        return Path(override).resolve()
    if (DOCKER_REPO / "pipeline").is_dir():
        return DOCKER_REPO.resolve()
    return (ROOT / "environment" / "repo").resolve()


REPO_ROOT = _candidate_repo()
_repo_s = str(REPO_ROOT)
if _repo_s in sys.path:
    sys.path.remove(_repo_s)
sys.path.insert(0, _repo_s)

TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

from pipeline.config import Settings  # noqa: E402
from pipeline.warehouse import Warehouse  # noqa: E402


@pytest.fixture
def repo_root() -> Path:
    return REPO_ROOT


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    incoming = tmp_path / "incoming"
    quarantine = tmp_path / "quarantine"
    incoming.mkdir()
    quarantine.mkdir()
    cfg = Settings(
        incoming_dir=incoming,
        quarantine_dir=quarantine,
        db_path=tmp_path / "warehouse.db",
    )
    cfg.ensure_directories()
    return cfg


@pytest.fixture
def warehouse(settings: Settings) -> Warehouse:
    store = Warehouse(settings)
    try:
        yield store
    finally:
        store.close()

