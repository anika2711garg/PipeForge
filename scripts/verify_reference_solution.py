#!/usr/bin/env python3
"""Reset, apply the reference patch, and require a clean verifier run."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"


def main() -> int:
    reset = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "reset_environment.py")],
        check=False,
    )
    if reset.returncode != 0:
        return reset.returncode
    apply = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "apply_reference_solution.py")],
        check=False,
    )
    if apply.returncode != 0:
        return apply.returncode
    env = os.environ.copy()
    existing = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = os.pathsep.join(filter(None, [str(REPO), existing]))
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", str(ROOT / "tests")],
        cwd=ROOT,
        env=env,
        check=False,
    )
    if result.returncode != 0:
        return result.returncode
    print("Reference solution passed the full verifier.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
