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

if [[ ! -d .next ]]; then
  echo "No build found. Run first:"
  echo "  npm i"
  echo "  npm run build"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

PORT="${APP_PORT:-3314}"
BIND="${APP_BIND_HOST:-0.0.0.0}"

echo "==> Starting Aveno frontend in background (systemd)"
echo "    http://${BIND}:${PORT}"
echo "    Public: ${PUBLIC_URL:-—}"

chmod +x "${ROOT}/scripts/start-frontend.sh"

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
echo "Running in background — safe to close SSH."
sudo systemctl --no-pager status "${SERVICE_NAME}" || true
