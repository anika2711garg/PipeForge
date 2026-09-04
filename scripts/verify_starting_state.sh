#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="${ROOT}/environment/repo${PYTHONPATH:+:${PYTHONPATH}}"

cd "$ROOT"

set +e
pytest -q "$ROOT/tests"
code=$?
set -e

if [ "$code" -eq 0 ]; then
  echo "ERROR: starting state unexpectedly passed the verifier."
  exit 1
fi

if [ "$code" -eq 1 ]; then
  echo "Starting state fails as expected. Environment is ready for an agent."
  exit 0
fi

echo "Infrastructure failure while verifying the starting state (pytest exit ${code})."
exit "$code"
