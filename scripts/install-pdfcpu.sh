#!/usr/bin/env bash
set -euo pipefail

PDFCPU_VERSION="${PDFCPU_VERSION:-0.8.2}"
PUBLISH_DIR="${PUBLISH_DIR:-services/api/out}"
TOOLS_DIR="${TOOLS_DIR:-${PUBLISH_DIR}/tools}"
PDFCPU_PINNED_URL="${PDFCPU_PINNED_URL:-}"

release_url="https://api.github.com/repos/pdfcpu/pdfcpu/releases"

if [[ "${PDFCPU_VERSION}" == "latest" ]]; then
  release_url+="/latest"
else
  release_url+="/tags/v${PDFCPU_VERSION}"
fi

echo "🔎 Resolving pdfcpu release metadata from:"
echo "${release_url}"

release_json=""
if ! release_json="$(curl -fsSL "${release_url}")"; then
  echo "⚠️ Failed to fetch release metadata from GitHub API." >&2
fi

asset_url=""
if [[ -n "${release_json}" ]]; then
  export RELEASE_JSON="${release_json}"
  asset_url="$(
    python3 - <<'PY'
import json, os, re, sys

release = json.loads(os.environ['RELEASE_JSON'])
message = release.get('message', '')
if 'rate limit' in message.lower():
    print('__RATE_LIMIT__')
    sys.exit(0)

assets = release.get('assets', [])
patterns = [
    re.compile(r'linux_amd64.*\\.tar\\.gz$', re.I),
    re.compile(r'linux_x86_64.*\\.tar\\.gz$', re.I),
]

for asset in assets:
    name = asset.get('name', '')
    for pat in patterns:
        if pat.search(name):
            print(asset.get('browser_download_url', ''))
            sys.exit(0)

print('', end='')
PY
  )"
fi

if [[ "${asset_url}" == "__RATE_LIMIT__" ]]; then
  echo "⚠️ GitHub API rate limit hit; falling back to pinned asset URL." >&2
  asset_url=""
fi

if [[ -z "${asset_url}" ]]; then
  if [[ -n "${PDFCPU_PINNED_URL}" ]]; then
    asset_url="${PDFCPU_PINNED_URL}"
  else
    asset_url="https://github.com/pdfcpu/pdfcpu/releases/download/v${PDFCPU_VERSION}/pdfcpu_${PDFCPU_VERSION}_linux_amd64.tar.gz"
  fi
  echo "⚠️ Using fallback asset URL:" >&2
  echo "${asset_url}" >&2
fi

if [[ -z "${asset_url}" ]]; then
  echo "❌ Could not resolve a download URL for pdfcpu ${PDFCPU_VERSION}." >&2
  if [[ -n "${release_json}" ]]; then
    echo "Available assets:" >&2
    RELEASE_JSON="${release_json}" python3 - <<'PY'
import json, os
release = json.loads(os.environ.get('RELEASE_JSON', '{}'))
for asset in release.get('assets', []):
    print(f"- {asset.get('name','')} ({asset.get('browser_download_url','')})")
PY
  fi
  exit 1
fi

echo "⬇️ Downloading pdfcpu from:"
echo "${asset_url}"

mkdir -p "${TOOLS_DIR}"

curl -fL "${asset_url}" -o /tmp/pdfcpu.tar.gz

echo "📦 Extracting pdfcpu..."
rm -rf /tmp/pdfcpu
mkdir -p /tmp/pdfcpu

tar -xzf /tmp/pdfcpu.tar.gz -C /tmp/pdfcpu

bin_path="$(find /tmp/pdfcpu -type f -name pdfcpu -perm -111 | head -1)"

if [[ -z "${bin_path}" ]]; then
  echo "❌ pdfcpu binary not found in archive." >&2
  exit 1
fi

echo "📁 Installing binary..."
cp "${bin_path}" "${TOOLS_DIR}/pdfcpu"
chmod +x "${TOOLS_DIR}/pdfcpu"

echo "✅ pdfcpu installed:"
"${TOOLS_DIR}/pdfcpu" version
