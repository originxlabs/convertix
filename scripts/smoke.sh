#!/usr/bin/env bash
set -euo pipefail

# ==============================
# CONFIG
# ==============================
API_BASE="${API_BASE:-https://convertix.azurewebsites.net}"

ENABLE_IMAGE_ENGINE="${ENABLE_IMAGE_ENGINE:-0}"
ENABLE_IMAGE_API="${ENABLE_IMAGE_API:-0}"

TMP_DIR="$(mktemp -d)"

# ==============================
# PREREQS
# ==============================
command -v curl >/dev/null || { echo "❌ curl missing"; exit 1; }
command -v base64 >/dev/null || { echo "❌ base64 missing"; exit 1; }

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# ==============================
# UTILS
# ==============================
base64_decode() {
  if base64 --help 2>&1 | grep -q -- "-d"; then
    base64 -d
  else
    base64 -D
  fi
}

request() {
  local label="$1"; shift
  local code
  local body_file
  body_file="$(mktemp)"
  code=$(curl -s -o "$body_file" -w "%{http_code}" "$@")

  if [[ "$code" =~ ^2 ]]; then
    printf "✅ %-32s %s\n" "$label" "$code"
    rm -f "$body_file"
    return 0
  else
    printf "❌ %-32s %s\n" "$label" "$code" >&2
    if [ -s "$body_file" ]; then
      echo "---- response body ----" >&2
      cat "$body_file" >&2
      echo "-----------------------" >&2
    fi
    rm -f "$body_file"
    return 1
  fi
}

soft_check() {
  local label="$1"; shift
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@" || true)

  if [[ "$code" =~ ^2 ]]; then
    printf "✅ %-32s %s\n" "$label" "$code"
  else
    printf "⚠️  %-32s %s (skipped)\n" "$label" "$code"
  fi
}

# ==============================
# START
# ==============================
echo "🔥 Smoke test started against: $API_BASE"
echo "--------------------------------------"

# ==============================
# MANDATORY HEALTH
# ==============================
echo "➡️ Core health check"
request "GET /health" "$API_BASE/health" \
  || { echo "❌ Core health failed"; exit 1; }

# ==============================
# OPTIONAL HEALTH
# ==============================
if [ "$ENABLE_IMAGE_API" = "1" ]; then
  soft_check "GET /api/image/health" "$API_BASE/api/image/health"
else
  echo "ℹ️  Image API health skipped"
fi

if [ "$ENABLE_IMAGE_ENGINE" = "1" ]; then
  soft_check "GET /image-engine/health" "$API_BASE/image-engine/health"
else
  echo "ℹ️  Image engine health skipped"
fi

# ==============================
# TEST ASSETS
# ==============================
PDF="$TMP_DIR/sample.pdf"
IMG="$TMP_DIR/img.png"

cat <<'B64' | base64_decode > "$PDF"
JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAzNSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyIFRkIChIZWxsbykgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDAzMjYgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozOTYKJSVFT0YK
B64

cat <<'B64' | base64_decode > "$IMG"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z/C/HwAFgwJ/l3sX7gAAAABJRU5ErkJggg==
B64

# ==============================
# CORE API (FAIL IF BROKEN)
# ==============================
echo "➡️ Core API checks"

request "POST /api/session" \
  -X POST "$API_BASE/api/session" \
  || exit 1

request "POST /api/upload" \
  -F "file=@$PDF" \
  "$API_BASE/api/upload" \
  || exit 1

request "POST /api/pdf/merge" \
  -F "files=@$PDF" \
  -F "files=@$PDF" \
  "$API_BASE/api/pdf/merge" \
  || exit 1

request "POST /api/pdf/compress" \
  -F "file=@$PDF" \
  "$API_BASE/api/pdf/compress" \
  || exit 1

# ==============================
# OPTIONAL IMAGE API
# ==============================
if [ "$ENABLE_IMAGE_API" = "1" ]; then
  request "POST /api/image/process" \
    -F "file=@$IMG" \
    -F "operation=resize" \
    -F "width=32" \
    -F "height=32" \
    "$API_BASE/api/image/process"
else
  echo "ℹ️  Image processing skipped"
fi

echo "--------------------------------------"
echo "🎉 Smoke test PASSED"
