#!/usr/bin/env python3
"""Generate the synthetic PipeForge demo dataset."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pipeline.demo import generate_demo_data  # noqa: E402


def main() -> int:
    paths = generate_demo_data()
    print(f"Wrote {len(paths)} demo files:")
    for path in paths:
        print(f"  {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
