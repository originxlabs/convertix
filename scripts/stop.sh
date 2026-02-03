#!/usr/bin/env bash
set -euo pipefail

kill_pid_file() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

kill_port() {
  local port_file="$1"
  if [ -f "$port_file" ]; then
    local port
    port="$(cat "$port_file" 2>/dev/null || true)"
    if [ -n "$port" ] && command -v lsof >/dev/null 2>&1; then
      local pids
      pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
      if [ -n "$pids" ]; then
        kill $pids 2>/dev/null || true
      fi
    fi
    if [ -n "$port" ] && command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
    rm -f "$port_file"
  fi
}

kill_pid_file /tmp/convertix/api.pid
kill_pid_file /tmp/convertix/web.pid
kill_pid_file /tmp/convertix/image-engine.pid
kill_port /tmp/convertix/api.port
kill_port /tmp/convertix/web.port
kill_port /tmp/convertix/image-engine.port

# Fallback: stop any dotnet or next dev servers bound to common ports.
if command -v lsof >/dev/null 2>&1; then
  for port in 5055 5056 5057 5058 5059 5060 3000 3001 3002 3003 3004 3005 3006 7071 7072 7073; do
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      kill $pids 2>/dev/null || true
    fi
  done
fi

echo "Convertix services stopped."
