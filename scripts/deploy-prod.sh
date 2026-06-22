#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Creating .env from .env.production.example — edit PUBLIC_URL and passwords!"
  cp .env.production.example .env
fi

# shellcheck disable=SC1091
source .env 2>/dev/null || true

echo "==> Aveno production deploy (port ${APP_PORT:-3314})"
echo "    PUBLIC_URL=${PUBLIC_URL:-not set — edit .env}"

if command -v docker >/dev/null 2>&1; then
  if [[ -f docker/daemon.arvan.json.example ]] && [[ ! -f /etc/docker/daemon.json ]]; then
    echo "Tip: For faster image pulls in Iran, configure Docker Arvan mirror:"
    echo "  sudo cp docker/daemon.arvan.json.example /etc/docker/daemon.json"
    echo "  sudo systemctl restart docker"
  fi
fi

docker compose -f docker-compose.prod.yml --env-file .env up --build -d

echo ""
echo "Done. Open: ${PUBLIC_URL:-http://localhost:3314}"
echo "Logs: docker compose -f docker-compose.prod.yml logs -f"
