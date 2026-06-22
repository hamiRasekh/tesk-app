#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck disable=SC1091
set -a
source .env
set +a

export NODE_ENV=production
export API_INTERNAL_URL="${API_INTERNAL_URL:-http://127.0.0.1:8000}"
export PORT="${APP_PORT:-3314}"
export HOSTNAME="${APP_BIND_HOST:-0.0.0.0}"

exec npm start
