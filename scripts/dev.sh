#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_DIR="$ROOT_DIR/services/api"
WEB_DIR="$ROOT_DIR/apps/web"
IMAGE_ENGINE_DIR="$ROOT_DIR/services/image-engine"

mkdir -p /tmp/convertix

# Stop any previous Convertix processes tracked by our PID/port files.
if [ -x "$ROOT_DIR/scripts/stop.sh" ]; then
  "$ROOT_DIR/scripts/stop.sh" >/dev/null 2>&1 || true
fi

is_port_free() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return
  fi
  if command -v nc >/dev/null 2>&1; then
    ! nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    return
  fi
  if command -v ss >/dev/null 2>&1; then
    ! ss -ltn "sport = :$port" | tail -n +2 | grep -q .
    return
  fi
  if command -v netstat >/dev/null 2>&1; then
    ! netstat -an | grep -E "\\.${port}\\s" | grep -q LISTEN
    return
  fi
  return 0
}

pick_port() {
  local preferred="$1"
  local start="$2"
  local end="$3"
  if is_port_free "$preferred"; then
    echo "$preferred"
    return
  fi
  local p
  for p in $(seq "$start" "$end"); do
    if is_port_free "$p"; then
      echo "$p"
      return
    fi
  done
  echo "$preferred"
}

API_PORT="${API_PORT:-$(pick_port 5055 5056 5099)}"
WEB_PORT="${WEB_PORT:-$(pick_port 3000 3001 3099)}"
IMAGE_ENGINE_PORT="${IMAGE_ENGINE_PORT:-$(pick_port 7071 7072 7099)}"
API_BASE="http://localhost:$API_PORT"
IMAGE_ENGINE_BASE="http://localhost:$IMAGE_ENGINE_PORT"

# Start API
( 
  cd "$API_DIR"
  dotnet restore >/tmp/convertix/api.restore.log 2>&1
  IMAGE_ENGINE_URL="$API_BASE/image-engine" dotnet run --urls "$API_BASE" > /tmp/convertix/api.log 2>&1 &
  echo $! > /tmp/convertix/api.pid
  echo "$API_PORT" > /tmp/convertix/api.port
)

# Start Web
(
  cd "$WEB_DIR"
  NEXT_PUBLIC_API_URL="$API_BASE" NEXT_PUBLIC_IMAGE_ENGINE_URL="$IMAGE_ENGINE_BASE" npm run dev -- --port "$WEB_PORT" > /tmp/convertix/web.log 2>&1 &
  echo $! > /tmp/convertix/web.pid
  echo "$WEB_PORT" > /tmp/convertix/web.port
)

# Start Image Engine (Node)
(
  cd "$IMAGE_ENGINE_DIR"
  if [ ! -d node_modules ]; then
    npm install >/tmp/convertix/image-engine.install.log 2>&1
  fi
  IMAGE_ENGINE_PORT="$IMAGE_ENGINE_PORT" npm run dev > /tmp/convertix/image-engine.log 2>&1 &
  echo $! > /tmp/convertix/image-engine.pid
  echo "$IMAGE_ENGINE_PORT" > /tmp/convertix/image-engine.port
)

wait_for_api() {
  local url="$1"
  local retries=30
  local count=0
  until curl -fsS "$url/health" >/dev/null 2>&1; do
    count=$((count + 1))
    if [ "$count" -ge "$retries" ]; then
      return 1
    fi
    sleep 0.5
  done
  return 0
}

if wait_for_api "$API_BASE"; then
  echo "Convertix API running at $API_BASE"
else
  echo "Convertix API failed to respond at $API_BASE"
  echo "Check logs: /tmp/convertix/api.log"
fi

if wait_for_api "$IMAGE_ENGINE_BASE"; then
  echo "Convertix Image Engine running at $IMAGE_ENGINE_BASE"
else
  echo "Convertix Image Engine failed to respond at $IMAGE_ENGINE_BASE"
  echo "Check logs: /tmp/convertix/image-engine.log"
fi

echo "Convertix Web running at http://localhost:$WEB_PORT"
echo "Logs: /tmp/convertix/api.log, /tmp/convertix/web.log, /tmp/convertix/image-engine.log"
