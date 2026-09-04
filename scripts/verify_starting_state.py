#!/usr/bin/env python3
"""Run the verifier against the intentionally flawed starting repository."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"


def main() -> int:
    env = os.environ.copy()
    existing = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = os.pathsep.join(filter(None, [str(REPO), existing]))
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", str(ROOT / "tests")],
        cwd=ROOT,
        env=env,
        check=False,
    )
    if result.returncode == 0:
        print("ERROR: starting state unexpectedly passed the verifier.")
        return 1
    if result.returncode == 1:
        print("Starting state fails as expected. Environment is ready for an agent.")
        return 0
    print(
        "Infrastructure failure while verifying the starting state "
        f"(pytest exit {result.returncode})."
    )
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
