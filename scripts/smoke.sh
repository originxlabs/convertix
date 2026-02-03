#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5055}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pdf_from_base64() {
  local out="$1"
  cat <<'B64' | base64_decode > "$out"
JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+CmVuZG9iagoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxPj4KZW5kb2JqCgozIDAgb2JqCjw8L1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDUgMCBSPj4+Pj4+CmVuZG9iagoKNCAwIG9iago8PC9MZW5ndGggNDQ+PnN0cmVhbQpCVCAvRjEgMTIgVGYgNzIgMTIwIFRkIChIZWxsbykgVGogRVQKZW5kc3RyZWFtCmVuZG9iagoKNSAwIG9iago8PC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE2IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDMzMyAwMDAwMCBuIAp0cmFpbGVyCjw8L1Jvb3QgMSAwIFIgL1NpemUgNj4+CnN0YXJ0eHJlZgozOTgKJSVFT0YK
B64
}

create_png() {
  local out="$1"
  if command -v sips >/dev/null 2>&1; then
    local ppm="$TMP_DIR/one.ppm"
    cat > "$ppm" <<'PPM'
P3
1 1
255
255 0 0
PPM
    sips -s format png "$ppm" --out "$out" >/dev/null 2>&1
  else
    # Fallback: a minimal PNG (may not work with some pdfcpu builds).
    cat <<'B64' | base64_decode > "$out"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z/C/HwAFgwJ/l3sX7gAAAABJRU5ErkJggg==
B64
  fi
}

base64_decode() {
  if base64 --help 2>&1 | grep -q -- "-d"; then
    base64 -d
  else
    base64 -D
  fi
}

request() {
  local label="$1"
  shift
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  printf "%-28s %s\n" "$label" "$code"
}

PDF1="$TMP_DIR/sample-1.pdf"
PDF2="$TMP_DIR/sample-2.pdf"
SIG="$TMP_DIR/sign.png"
IMG1="$TMP_DIR/img-1.png"

pdf_from_base64 "$PDF1"
cp "$PDF1" "$PDF2"
create_png "$SIG"
create_png "$IMG1"

printf "API base: %s\n" "$API_BASE"

request "GET /health" "$API_BASE/health"
request "POST /api/session" -X POST "$API_BASE/api/session"

UPLOAD_JSON_PATH="$TMP_DIR/upload.json"
UPLOAD_CODE=$(curl -s -o "$UPLOAD_JSON_PATH" -w "%{http_code}" -F "file=@$PDF1" "$API_BASE/api/upload")
UPLOAD_JSON=$(cat "$UPLOAD_JSON_PATH")

if [ "$UPLOAD_CODE" != "200" ]; then
  echo "Upload failed with status $UPLOAD_CODE" >&2
  echo "$UPLOAD_JSON" >&2
  exit 1
fi
FILE_ID=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("fileId",""))' "$UPLOAD_JSON")

if [ -z "$FILE_ID" ]; then
  echo "Failed to parse fileId from /api/upload" >&2
  exit 1
fi

request "POST /api/export" -X POST \
  -F "fileId=$FILE_ID" \
  -F "edits=[]" \
  -F "pageWidth=612" \
  -F "pageHeight=792" \
  "$API_BASE/api/export"

request "POST /api/pdf/merge" -X POST \
  -F "files=@$PDF1" \
  -F "files=@$PDF2" \
  "$API_BASE/api/pdf/merge"

request "POST /api/pdf/split" -X POST \
  -F "file=@$PDF1" \
  -F "mode=span" \
  -F "span=1" \
  "$API_BASE/api/pdf/split"

request "POST /api/pdf/compress" -X POST \
  -F "file=@$PDF1" \
  "$API_BASE/api/pdf/compress"

PROTECTED_PDF="$TMP_DIR/protected.pdf"
PROTECT_CODE=$(curl -s -o "$PROTECTED_PDF" -w "%{http_code}" \
  -F "file=@$PDF1" \
  -F "ownerPassword=owner" \
  -F "userPassword=user" \
  "$API_BASE/api/pdf/protect")
printf "%-28s %s\n" "POST /api/pdf/protect" "$PROTECT_CODE"

if [ "$PROTECT_CODE" = "200" ]; then
  request "POST /api/pdf/unlock" -X POST \
    -F "file=@$PROTECTED_PDF" \
    -F "ownerPassword=owner" \
    -F "userPassword=user" \
    "$API_BASE/api/pdf/unlock"
else
  echo "Skipping unlock: protect failed" >&2
fi

request "POST /api/pdf/organize" -X POST \
  -F "file=@$PDF1" \
  -F "pages=1" \
  "$API_BASE/api/pdf/organize"

request "POST /api/pdf/crop" -X POST \
  -F "file=@$PDF1" \
  -F "cropBox=0 0 200 200" \
  -F "pages=1" \
  "$API_BASE/api/pdf/crop"

request "POST /api/pdf/sign" -X POST \
  -F "file=@$PDF1" \
  -F "signature=@$SIG" \
  -F "position=br" \
  -F "scale=0.2" \
  "$API_BASE/api/pdf/sign"

request "POST /api/pdf/pdf-to-word" -X POST \
  -F "file=@$PDF1" \
  "$API_BASE/api/pdf/pdf-to-word"

request "POST /api/convert/image-to-pdf" -X POST \
  -F "files=@$IMG1" \
  "$API_BASE/api/convert/image-to-pdf"
