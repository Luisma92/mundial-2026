#!/usr/bin/env bash
# Build + sync + reload. Run from anywhere.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NUC="${NUC_HOST:-nuc}"
REMOTE_DIR="/home/luisma/mundial-2026/site"

cd "$PROJECT_DIR"

echo "==> Building $PROJECT_DIR"
pnpm build

echo "==> Syncing dist/ → ${NUC}:${REMOTE_DIR}"
rsync -avz --delete "$PROJECT_DIR/dist/" "${NUC}:${REMOTE_DIR}/"

echo "==> Reloading nginx"
ssh "$NUC" "docker exec nginx nginx -s reload"

echo "==> Done. Open https://mundial.nuc/"
