#!/usr/bin/env python3
"""Restore the starting repository and wipe local demo warehouse files."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"
PATCH = ROOT / "solution" / "reference.patch"


def main() -> int:
    reverse = subprocess.run(
        ["git", "apply", "--reverse", "--check", str(PATCH)],
        cwd=REPO,
        check=False,
        capture_output=True,
    )
    if reverse.returncode == 0:
        subprocess.run(
            ["git", "apply", "--reverse", str(PATCH)],
            cwd=REPO,
            check=False,
        )

    for name in ("warehouse.db", "warehouse.db-wal", "warehouse.db-shm"):
        target = REPO / "data" / name
        if target.exists():
            target.unlink()
    incoming = REPO / "data" / "incoming"
    if incoming.exists():
        for leftover in incoming.glob("*.jsonl"):
            leftover.unlink()
    quarantine = REPO / "data" / "quarantine"
    if quarantine.exists():
        for leftover in quarantine.iterdir():
            if leftover.is_file() and leftover.name != ".gitkeep":
                leftover.unlink()
    print("Environment reset to the starting repository.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
