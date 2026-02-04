#!/usr/bin/env bash
set -euo pipefail

# Local-only helper. Not intended for CI; keep pipeline smooth and fast.

files=(scripts/*.sh)

for file in "${files[@]}"; do
  if [[ ! -f "${file}" ]]; then
    echo "❌ Missing shell script: ${file}" >&2
    exit 1
  fi
  bash -n "${file}"

  if command -v shellcheck >/dev/null 2>&1; then
    shellcheck "${file}"
  else
    echo "ℹ️ shellcheck not installed; skipped ${file}" >&2
  fi
done

echo "✅ Shell scripts linted"
