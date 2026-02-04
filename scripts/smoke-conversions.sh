#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-https://convertix.azurewebsites.net}"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🔥 Conversion smoke test started against: $API_BASE"
echo "--------------------------------------"

FAILURES=0
HEALTH_TOOLS_JSON=""
if command -v curl >/dev/null 2>&1; then
  HEALTH_TOOLS_JSON=$(curl -s "$API_BASE/health/tools" || true)
fi

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
    FAILURES=$((FAILURES + 1))
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

# Sample PDF
PDF="$TMP_DIR/sample.pdf"
cat <<'B64' | base64_decode > "$PDF"
JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAzNSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyIFRkIChIZWxsbykgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDAzMjYgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozOTYKJSVFT0YK
B64

# Sample PDF 2 (for compare)
PDF2="$TMP_DIR/sample-2.pdf"
cat <<'B64' | base64_decode > "$PDF2"
JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAzNSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyIFRkIChDb252ZXJ0aXgpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwMzI2IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMzk2CiUlRU9GCg==
B64

# Sample DOCX
DOCX="$TMP_DIR/sample.docx"
cat <<'B64' | base64_decode > "$DOCX"
UEsDBBQAAAAIALOaRFyF+Ddc5QAAAKcBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH2Qy07DMBBF9/0Ky1sUO7BACCXpgscSWJQPGNmTxMIvedxS/p5JC0VClKV1H8dzu/U+eLHDQi7FXl6qVgqMJlkXp16+bh6bG7keVt3mIyMJ9kbq5VxrvtWazIwBSKWMkZUxlQCVn2XSGcwbTKiv2vZamxQrxtrUpUMOKyG6exxh66t42LNyRBf0JMXd0bvgegk5e2egsq530f4CNV8QxcmDh2aX6YINUp+DLOJ5xk/0mRcpzqJ4gVKfILBRv6ditU1mGzis/m/647dpHJ3BU35pyyUZJOKpg1cnJYCL31d0+jD88AlQSwMEFAAAAAgAs5pEXDzDyG+oAAAAHQEAAAsAAABfcmVscy8ucmVsc42POw7CMBBE+5zC2p5sQoEQwkmDkNKicADL3jgR8Ue2+d0eFxQEUVDu7Mwbzb59mJndKMTJWQ51WQEjK52arOZw7o+rLbRNsT/RLFK2xHHykeWMjRzGlPwOMcqRjIil82TzZ3DBiJTPoNELeRGacF1VGwyfDGgKxhZY1ikOoVM1sP7p6R+8G4ZJ0sHJqyGbfrR8OTJZBE2Jw90FheotlxkLmFfiYmbzAlBLAwQUAAAACACzmkRcarg+QKAAAADUAAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sNY7BCsIwEETv/YqQu031IFLa9CCIH6AfUJPYBpLdsIm2/r1JoZfHzC4zTDes3rGvoWgRen6sG84MKNQWpp4/H7fDhQ+y6pZWo/p4A4nlAMR26fmcUmiFiGo2fow1BgP590byY8qWJrEg6UCoTIy5zztxapqz8KMFLivGcusL9a/IzQSZQQVJ3o1zyK4IeVuyayfKsZA2hi0v9oKi9oHyD1BLAQIUAxQAAAAIALOaRFyF+Ddc5QAAAKcBAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAgAs5pEXDzDyG+oAAAAHQEAAAsAAAAAAAAAAAAAAIABFgEAAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgAs5pEXGq4PkCgAAAA1AAAABEAAAAAAAAAAAAAAIAB5wEAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAADAAMAuQAAALYCAAAAAA==
B64

# Sample PPTX
PPTX="$TMP_DIR/sample.pptx"
if python3 - <<'PYCHK'
import importlib.util
raise SystemExit(0 if importlib.util.find_spec("pptx") else 1)
PYCHK
then
  python3 - "$PPTX" <<'PYGEN'
from pathlib import Path
import sys
from pptx import Presentation

output_path = Path(sys.argv[1])
prs = Presentation()
slide_layout = prs.slide_layouts[0]
slide = prs.slides.add_slide(slide_layout)
slide.shapes.title.text = "Convertix"
slide.placeholders[1].text = "PPTX smoke test"
prs.save(output_path)
PYGEN
else
  echo "ℹ️  python-pptx not installed; skipping PPTX sample generation."
  PPTX=""
fi

# Sample XLSX
XLSX="$TMP_DIR/sample.xlsx"
cat <<'B64' | base64_decode > "$XLSX"
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
B64

# Sample PNG (for scan-to-pdf)
PNG="$TMP_DIR/sample.png"
cat <<'B64' | base64_decode > "$PNG"
iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAIAAACQKrqGAAAAVElEQVR4nGP8//8/Azbw4cPHGf4zZ86cQWQGhkKQePr06S8QxKZNm8aYgFQw+QGJUBhK8P///z+1q7du3UQyQ0aN2oYwVIAAOJZC0Yx1m7YAAAAAElFTkSuQmCC
B64

echo "➡️ Conversion endpoints"
request "POST /api/pdf/pdf-to-word" -X POST "$API_BASE/api/pdf/pdf-to-word" -F "file=@$PDF" || true
request "POST /api/pdf/word-to-pdf" -X POST "$API_BASE/api/pdf/word-to-pdf" -F "file=@$DOCX" || true
if [ -n "${PPTX:-}" ]; then
  request "POST /api/pdf/ppt-to-pdf" -X POST "$API_BASE/api/pdf/ppt-to-pdf" -F "file=@$PPTX" || true
else
  echo "ℹ️  POST /api/pdf/ppt-to-pdf skipped (no PPTX sample)."
fi
request "POST /api/pdf/excel-to-pdf" -X POST "$API_BASE/api/pdf/excel-to-pdf" -F "file=@$XLSX" || true
request "POST /api/pdf/html-to-pdf" -X POST "$API_BASE/api/pdf/html-to-pdf" \
  -H "Content-Type: application/json" -d '{"url":"https://example.com"}'

request "POST /api/pdf/pdf-to-ppt" -X POST "$API_BASE/api/pdf/pdf-to-ppt" -F "file=@$PDF" || true
request "POST /api/pdf/pdf-to-excel" -X POST "$API_BASE/api/pdf/pdf-to-excel" -F "file=@$PDF" || true
request "POST /api/pdf/redact" -X POST "$API_BASE/api/pdf/redact" -F "file=@$PDF" -F "text=REDACTED" || true
request "POST /api/pdf/compare" -X POST "$API_BASE/api/pdf/compare" -F "files=@$PDF" -F "files=@$PDF2" || true
request "POST /api/pdf/flatten" -X POST "$API_BASE/api/pdf/flatten" -F "file=@$PDF" || true
request "POST /api/pdf/scan-to-pdf" -X POST "$API_BASE/api/pdf/scan-to-pdf" -F "files=@$PNG" || true

if echo "$HEALTH_TOOLS_JSON" | grep -q '"ocrmypdf":true'; then
  request "POST /api/pdf/pdf-to-pdfa" -X POST "$API_BASE/api/pdf/pdf-to-pdfa" -F "file=@$PDF" || true
  request "POST /api/pdf/ocr" -X POST "$API_BASE/api/pdf/ocr" -F "file=@$PDF" || true
else
  echo "ℹ️  OCR/PDF-A checks skipped (ocrmypdf not available)."
fi

if [ "$FAILURES" -gt 0 ]; then
  echo "⚠️ Conversion smoke tests completed with $FAILURES failure(s)."
  exit 1
fi

echo "✅ Conversion smoke tests complete."
