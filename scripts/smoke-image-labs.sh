#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-https://convertix.azurewebsites.net}"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🔥 Image Labs smoke test started against: $API_BASE"
echo "--------------------------------------"

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

base64_decode() {
  if base64 --help 2>&1 | grep -q -- "-d"; then
    base64 -d
  else
    base64 -D
  fi
}

IMG="$TMP_DIR/sample.png"
SOURCE_ICON="apps/desktop/src-tauri/icons/icon.png"
if [ -f "$SOURCE_ICON" ]; then
  cp "$SOURCE_ICON" "$IMG"
else
  cat <<'B64' | base64_decode > "$IMG"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==
B64
fi

echo "➡️ Core Image Engine"
request "GET /api/image/health" "$API_BASE/api/image/health"

TOOLS_JSON=$(curl -s "$API_BASE/api/image/health/tools" || true)
ENGINE_OK=$(echo "$TOOLS_JSON" | grep -q '"engine":true' && echo "1" || echo "0")
PLAYWRIGHT_OK=$(echo "$TOOLS_JSON" | grep -q '"playwright":true' && echo "1" || echo "0")
REMOVE_BG_OK=$(echo "$TOOLS_JSON" | grep -q '"removebg":true' && echo "1" || echo "0")
UPSCALE_OK=$(echo "$TOOLS_JSON" | grep -q '"upscale":true' && echo "1" || echo "0")
BLUR_OK=$(echo "$TOOLS_JSON" | grep -q '"blurface":true' && echo "1" || echo "0")
MEME_OK=$(echo "$TOOLS_JSON" | grep -q '"meme":true' && echo "1" || echo "0")

if [ "$ENGINE_OK" = "1" ]; then
  echo "➡️ Image process endpoints"
  request "POST /api/image/process (compress)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=compress" -F "quality=80"
  request "POST /api/image/process (resize)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=resize" -F "width=200" -F "height=200"
  request "POST /api/image/process (crop)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=crop" -F "left=0" -F "top=0" -F "width=80" -F "height=80"
  request "POST /api/image/process (rotate)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=rotate" -F "angle=90"
  request "POST /api/image/process (convert-to-jpg)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=convert-to-jpg"
  request "POST /api/image/process (convert-from-jpg)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=convert-from-jpg" -F "format=png"
  request "POST /api/image/process (watermark)" -X POST "$API_BASE/api/image/process" \
    -F "file=@$IMG" -F "operation=watermark" -F "text=Convertix" -F "position=bottom-right"
else
  echo "⚠️ Image engine unavailable; skipping process checks"
fi

if [ "$PLAYWRIGHT_OK" = "1" ]; then
  request "POST /api/image/html-to-image" -X POST "$API_BASE/api/image/html-to-image" \
    -H "Content-Type: application/json" -d '{"url":"https://example.com","format":"png"}'
else
  echo "⚠️ Playwright unavailable; skipping html-to-image"
fi

if [ "$REMOVE_BG_OK" = "1" ]; then
  request "POST /api/image/remove-bg" -X POST "$API_BASE/api/image/remove-bg" -F "file=@$IMG"
else
  echo "⚠️ Remove-bg key missing; skipping"
fi

if [ "$UPSCALE_OK" = "1" ]; then
  request "POST /api/image/upscale" -X POST "$API_BASE/api/image/upscale" -F "file=@$IMG"
else
  echo "⚠️ Upscale key missing; skipping"
fi

if [ "$BLUR_OK" = "1" ]; then
  request "POST /api/image/blur-face" -X POST "$API_BASE/api/image/blur-face" -F "file=@$IMG"
else
  echo "⚠️ Blur-face key missing; skipping"
fi

if [ "$MEME_OK" = "1" ]; then
  request "POST /api/image/meme" -X POST "$API_BASE/api/image/meme" \
    -F "file=@$IMG" -F "templateId=61579" -F "topText=Convertix" -F "bottomText=Labs"
else
  echo "⚠️ Meme API credentials missing; skipping"
fi

echo "✅ Image Labs smoke tests complete."
