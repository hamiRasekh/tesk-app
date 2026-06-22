#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SERVICE_NAME="aveno-frontend"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.production.example and edit values."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

export NODE_ENV=production
export API_INTERNAL_URL="${API_INTERNAL_URL:-http://127.0.0.1:8000}"
export PORT="${APP_PORT:-3314}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo "==> Aveno frontend (systemd background service)"
echo "    API_INTERNAL_URL=$API_INTERNAL_URL"
echo "    Listen on http://${HOSTNAME}:${PORT}"
echo "    Public URL: ${PUBLIC_URL:-not set}"

if ! curl -sf "${API_INTERNAL_URL}/health" >/dev/null 2>&1; then
  echo ""
  echo "WARNING: API not reachable at ${API_INTERNAL_URL}"
  echo "Start backend first: npm run deploy:backend"
  echo ""
fi

if [[ -f .npmrc ]]; then
  npm ci
else
  npm install
fi

npm run build

chmod +x "${ROOT}/scripts/start-frontend.sh"

echo ""
echo "==> Installing systemd service: ${SERVICE_NAME}"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=Aveno Next.js frontend
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${ROOT}
ExecStart=${ROOT}/scripts/start-frontend.sh
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"

echo ""
echo "==> Frontend running in background (survives SSH disconnect)"
sudo systemctl --no-pager status "${SERVICE_NAME}" || true
echo ""
echo "Useful commands:"
echo "  npm run frontend:logs     — live logs"
echo "  npm run frontend:status   — service status"
echo "  npm run frontend:restart  — restart after code changes"
echo "  npm run frontend:stop     — stop service"
