#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_DIR="$ROOT_DIR/services/api"
WEB_DIR="$ROOT_DIR/apps/web"

mkdir -p /tmp/convertix

# Start API
( 
  cd "$API_DIR"
  dotnet run --urls http://localhost:5055 > /tmp/convertix/api.log 2>&1 &
  echo $! > /tmp/convertix/api.pid
)

# Start Web
(
  cd "$WEB_DIR"
  npm run dev -- --port 3000 > /tmp/convertix/web.log 2>&1 &
  echo $! > /tmp/convertix/web.pid
)

echo "Convertix API running at http://localhost:5055"
echo "Convertix Web running at http://localhost:3000"
echo "Logs: /tmp/convertix/api.log, /tmp/convertix/web.log"
