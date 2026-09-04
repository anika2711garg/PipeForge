#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${ROOT}/environment/repo"
PATCH="${ROOT}/solution/reference.patch"

if [ ! -f "$PATCH" ]; then
  echo "Missing reference patch: $PATCH" >&2
  exit 1
fi

cd "$REPO"

if git apply --check "$PATCH" 2>/dev/null; then
  git apply "$PATCH"
elif patch -p1 --dry-run < "$PATCH" >/dev/null; then
  patch -p1 < "$PATCH"
else
  echo "Unable to apply reference.patch from ${REPO}" >&2
  exit 1
fi

echo "Reference solution applied."
