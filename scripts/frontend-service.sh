#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="aveno-frontend"
ACTION="${1:-status}"

case "$ACTION" in
  status)
    sudo systemctl --no-pager status "${SERVICE_NAME}"
    ;;
  logs)
    sudo journalctl -u "${SERVICE_NAME}" -f --no-pager
    ;;
  restart)
    sudo systemctl restart "${SERVICE_NAME}"
    sudo systemctl --no-pager status "${SERVICE_NAME}"
    ;;
  stop)
    sudo systemctl stop "${SERVICE_NAME}"
    echo "Stopped ${SERVICE_NAME}"
    ;;
  start)
    sudo systemctl start "${SERVICE_NAME}"
    sudo systemctl --no-pager status "${SERVICE_NAME}"
    ;;
  *)
    echo "Usage: $0 {status|logs|restart|stop|start}"
    exit 1
    ;;
esac
