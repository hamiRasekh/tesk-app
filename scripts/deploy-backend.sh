#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.production.example and edit values."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

echo "==> Aveno backend (Docker: PostgreSQL + FastAPI)"
echo "    API → http://127.0.0.1:8000"
echo "    Start frontend separately: npm run deploy:frontend"

docker compose -f docker-compose.backend.yml --env-file .env up --build -d

echo ""
echo "Done. Check: curl -s http://127.0.0.1:8000/health"
echo "Logs:  docker compose -f docker-compose.backend.yml logs -f"
