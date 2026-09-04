#!/usr/bin/env python3
"""Apply solution/reference.patch to environment/repo."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"
PATCH = ROOT / "solution" / "reference.patch"


def main() -> int:
    if not PATCH.is_file():
        print(f"Missing reference patch: {PATCH}", file=sys.stderr)
        return 1

    applied = subprocess.run(
        ["git", "apply", "--verbose", str(PATCH)],
        cwd=REPO,
        check=False,
        capture_output=True,
        text=True,
    )
    if applied.returncode == 0:
        print("Reference solution applied.")
        return 0

    print(applied.stdout, end="")
    print(applied.stderr, end="", file=sys.stderr)
    print(f"Unable to apply reference.patch from {REPO}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
