#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$ROOT_DIR/services/api"
OUT_DIR="$API_DIR/out"
ZIP_PATH="$API_DIR/api.zip"

RG="rg-convertix"
APP_NAME="convertix"

echo "🔍 Pre-deployment checks starting..."
echo "----------------------------------"

echo "➡️ Checking Azure login..."
az account show > /dev/null
echo "✅ Azure login OK"

echo "➡️ Checking App Service..."
az webapp show \
  --resource-group "$RG" \
  --name "$APP_NAME" > /dev/null
echo "✅ App Service exists"

echo "➡️ Checking required app settings..."
REQUIRED_SETTINGS=("JWT_KEY" "AZURE_SQL_CONNECTION" "KEY_VAULT_URI")

for setting in "${REQUIRED_SETTINGS[@]}"; do
  if ! az webapp config appsettings list \
    --resource-group "$RG" \
    --name "$APP_NAME" \
    --query "[?name=='$setting']" -o tsv | grep -q "$setting"; then
    echo "❌ Missing app setting: $setting"
    exit 1
  fi
done
echo "✅ App settings OK"

if [[ ! -d "$OUT_DIR" ]]; then
  echo "❌ Build output directory missing: $OUT_DIR"
  echo "ℹ️ Run deploy-prod.sh to build"
  exit 1
fi

echo "✅ Pre-deployment checks passed"
