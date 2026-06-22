#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RUNTIME="${ROOT}/scripts/runtime.env"
if [[ ! -f "$RUNTIME" ]]; then
  echo "Missing ${RUNTIME} — run: npm run up" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$RUNTIME"
# shellcheck disable=SC1091
source .env

export NODE_ENV=production
export API_INTERNAL_URL="${API_INTERNAL_URL:-http://127.0.0.1:8000}"
export PORT="${APP_PORT:-3314}"
export HOSTNAME="${APP_BIND_HOST:-0.0.0.0}"

NEXT_BIN="${ROOT}/node_modules/next/dist/bin/next"
if [[ ! -f "$NEXT_BIN" ]]; then
  echo "Next.js not installed — run: npm i && npm run build" >&2
  exit 1
fi

exec "${NODE_BIN}" "${NEXT_BIN}" start
