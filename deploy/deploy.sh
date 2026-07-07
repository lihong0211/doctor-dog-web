#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST to the target ssh host, e.g. user@1.2.3.4}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Building all apps"
cd "$ROOT_DIR"
pnpm -r --if-present run build

echo "==> Syncing home"
rsync -avz --delete "$ROOT_DIR/apps/home/" "$DEPLOY_HOST:/lihong/home/"

echo "==> Syncing blog"
rsync -avz --delete "$ROOT_DIR/apps/blog/docs/.vitepress/dist/" "$DEPLOY_HOST:/lihong/blog/docs/.vitepress/dist/"

echo "==> Syncing en"
rsync -avz --delete "$ROOT_DIR/apps/en/dist/" "$DEPLOY_HOST:/lihong/en/dist/"

echo "==> Syncing ai"
rsync -avz --delete "$ROOT_DIR/apps/ai/dist/" "$DEPLOY_HOST:/lihong/ai/dist/"

echo "==> Reloading nginx"
ssh "$DEPLOY_HOST" "sudo nginx -t && sudo nginx -s reload"

echo "==> Done"
