#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${ROOT}/environment/repo"
PATCH="${ROOT}/solution/reference.patch"

cd "$REPO"

if git apply --reverse --check "$PATCH" 2>/dev/null; then
  git apply --reverse "$PATCH"
elif patch -p1 -R --dry-run < "$PATCH" >/dev/null 2>&1; then
  patch -p1 -R < "$PATCH"
fi

rm -f "$REPO/data/warehouse.db" "$REPO/data/warehouse.db-wal" "$REPO/data/warehouse.db-shm"
find "$REPO/data/incoming" -name '*.jsonl' -delete
find "$REPO/data/quarantine" -type f ! -name '.gitkeep' -delete

echo "Environment reset to the starting repository."
