#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Production deployment starting..."
echo "----------------------------------"

# Run predeploy checks
"$SCRIPT_DIR/predeploy.sh"

# Variables
RG="rg-convertix"
APP_NAME="convertix"
API_DIR="$ROOT_DIR/services/api"
OUT_DIR="$API_DIR/out"
ZIP_PATH="$API_DIR/api.zip"

echo "➡️ Building API..."
dotnet publish "$API_DIR/PdfEditor.Api.csproj" \
  -c Release \
  -o "$OUT_DIR"

echo "➡️ Creating deployment zip..."
cd "$OUT_DIR"
zip -r "$ZIP_PATH" . > /dev/null
cd "$ROOT_DIR"

echo "➡️ Deploying to Azure App Service..."
az webapp deploy \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --src-path "$ZIP_PATH" \
  --type zip

echo "➡️ Restarting App Service..."
az webapp restart \
  --resource-group "$RG" \
  --name "$APP_NAME"

echo "✅ Deployment completed successfully"
