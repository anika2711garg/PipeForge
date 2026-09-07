#!/usr/bin/env python3
"""Build an isolated reference workspace and grade it without touching environment/repo.

Uses git show of the starting ETL revision + solution/reference.patch into grader/scratch/.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"
PATCH = ROOT / "solution" / "reference.patch"
SCRATCH = ROOT / "grader" / "scratch" / "isolated_reference_repo"
START_REV = "697007e"
PIPELINE_FILES = (
    "environment/repo/pipeline/ingest.py",
    "environment/repo/pipeline/parser.py",
    "environment/repo/pipeline/checkpoint.py",
    "environment/repo/pipeline/metrics.py",
)


def run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=cwd or ROOT, check=False, text=True, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeats", type=int, default=3)
    args = parser.parse_args()

    if SCRATCH.exists():
        shutil.rmtree(SCRATCH)
    shutil.copytree(
        REPO,
        SCRATCH,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "warehouse.db*", "incoming/*.jsonl"),
    )

    # Overlay starting ETL sources from the known starter revision when available.
    for rel in PIPELINE_FILES:
        shown = run(["git", "show", f"{START_REV}:{rel}"])
        if shown.returncode != 0:
            print(f"warn: cannot git show {START_REV}:{rel}; using live file", file=sys.stderr)
            continue
        # Scratch is a copy of environment/repo, so strip the prefix.
        target_rel = rel.split("environment/repo/", 1)[-1]
        target = SCRATCH / target_rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(shown.stdout, encoding="utf-8")

    applied = subprocess.run(
        ["git", "apply", "--verbose", str(PATCH)],
        cwd=SCRATCH,
        check=False,
        text=True,
        capture_output=True,
    )
    if applied.returncode != 0:
        print(applied.stdout)
        print(applied.stderr, file=sys.stderr)
        print("Failed to apply reference.patch to isolated workspace", file=sys.stderr)
        return 2

    grade = subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "grade.py"),
            "--repo",
            str(SCRATCH),
            "--repeats",
            str(args.repeats),
            "--report",
            str(ROOT / "grader" / "scratch" / "isolated_reference_report.md"),
            "--json-out",
            str(ROOT / "grader" / "scratch" / "isolated_reference_results.json"),
        ],
        cwd=ROOT,
        check=False,
    )
    print(f"Isolated reference grade exit={grade.returncode} repo={SCRATCH}")
    return grade.returncode


if __name__ == "__main__":
    raise SystemExit(main())
