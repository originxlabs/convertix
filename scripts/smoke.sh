#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-https://convertix.azurewebsites.net}"
TMP_DIR="$(mktemp -d)"

command -v curl >/dev/null || { echo "❌ curl missing"; exit 1; }
command -v base64 >/dev/null || { echo "❌ base64 missing"; exit 1; }

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

base64_decode() {
  if base64 --help 2>&1 | grep -q -- "-d"; then base64 -d; else base64 -D; fi
}

request() {
  local label="$1"; shift
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  if [[ "$code" =~ ^2 ]]; then
    printf "✅ %-32s %s\n" "$label" "$code"
  else
    printf "❌ %-32s %s\n" "$label" "$code" >&2
    exit 1
  fi
}

echo "🔥 Smoke test started against: $API_BASE"
echo "--------------------------------------"

# Health checks
curl -fs "$API_BASE/health" | grep -qi "ok" || exit 1
curl -fs "$API_BASE/api/image/health" | grep -qi "ok" || exit 1
curl -fs "$API_BASE/image-engine/health" | grep -qi "ok" || exit 1

echo "✅ Health checks passed"

# Create assets
PDF="$TMP_DIR/sample.pdf"
IMG="$TMP_DIR/img.png"

cat <<'B64' | base64_decode > "$PDF"
JVBERi0xLjQKJS...
B64

cat <<'B64' | base64_decode > "$IMG"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1Pe...
B64

# Core API
request "POST /api/session" -X POST "$API_BASE/api/session"
request "POST /api/upload" -F "file=@$PDF" "$API_BASE/api/upload"
request "POST /api/pdf/merge" -F "files=@$PDF" -F "files=@$PDF" "$API_BASE/api/pdf/merge"
request "POST /api/pdf/compress" -F "file=@$PDF" "$API_BASE/api/pdf/compress"
request "POST /api/image/process" -F "file=@$IMG" -F "operation=resize" -F "width=32" -F "height=32" "$API_BASE/api/image/process"

echo "🎉 Smoke test PASSED"
