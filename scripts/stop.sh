#!/usr/bin/env bash
set -euo pipefail

if [ -f /tmp/convertix/api.pid ]; then
  kill "$(cat /tmp/convertix/api.pid)" 2>/dev/null || true
  rm -f /tmp/convertix/api.pid
fi

if [ -f /tmp/convertix/web.pid ]; then
  kill "$(cat /tmp/convertix/web.pid)" 2>/dev/null || true
  rm -f /tmp/convertix/web.pid
fi

echo "Convertix services stopped."
