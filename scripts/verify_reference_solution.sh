#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}/environment/repo${PYTHONPATH:+:${PYTHONPATH}}"

"$ROOT/scripts/reset_environment.sh"
"$ROOT/scripts/apply_reference_solution.sh"

cd "$ROOT"
pytest -q "$ROOT/tests"
echo "Reference solution passed the full verifier."
