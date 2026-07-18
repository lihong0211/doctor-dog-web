#!/usr/bin/env bash
# 部署脚本：本地构建全部子应用 -> 提交构建产物 -> push -> SSH 到服务器 git pull + 重启 nginx。
#
# 之前在服务器上跑 pnpm build 把服务器内存跑爆了，现在只在本地构建；
# dist 产物直接提交进 git（本来就没有被 .gitignore 排除），服务器只需要
# git pull 拿到最新的 dist 文件，nginx 直接从 repo 里的 dist 目录读取
# 静态文件（见 deploy/nginx/nginx.conf），reload 一下确保生效。
#
# 用法：./deploy/deploy.sh
# 配置（DEPLOY_HOST/DEPLOY_USER/DEPLOY_PASSWORD/DEPLOY_PATH）读取自 deploy/.env
# （已加入 .gitignore，不会被提交到 git 历史；改 IP/密码直接编辑 deploy/.env，
# 可参考 deploy/.env.example）。
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="deploy/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "缺少 $ENV_FILE，请参考 deploy/.env.example 配置 DEPLOY_HOST / DEPLOY_USER / DEPLOY_PASSWORD / DEPLOY_PATH" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

: "${DEPLOY_HOST:?.env 缺少 DEPLOY_HOST}"
: "${DEPLOY_USER:?.env 缺少 DEPLOY_USER}"
: "${DEPLOY_PASSWORD:?.env 缺少 DEPLOY_PASSWORD}"
: "${DEPLOY_PATH:?.env 缺少 DEPLOY_PATH}"

if ! command -v sshpass >/dev/null 2>&1; then
  echo "缺少 sshpass（密码方式非交互 SSH 需要），先执行：brew install sshpass" >&2
  exit 1
fi

DEPLOY_TIMEOUT="${DEPLOY_TIMEOUT:-120}"
TIMEOUT_BIN="$(command -v timeout || command -v gtimeout || true)"
if [ -z "$TIMEOUT_BIN" ]; then
  echo "缺少 timeout/gtimeout（超时兜底需要），先执行：brew install coreutils" >&2
  exit 1
fi

echo "==> 本地构建全部子应用（home / blog / en / ai）"
pnpm build

# 只提交各 app 的构建产物，不动其他未跟踪文件（比如仓库根目录下临时的笔记/草稿）
DIST_PATHS=(
  apps/home/dist
  apps/blog/docs/.vitepress/dist
  apps/en/dist
  apps/ai/dist
)
echo "==> 提交构建产物：${DIST_PATHS[*]}"
git add -- "${DIST_PATHS[@]}"
if git diff --cached --quiet; then
  echo "==> 构建产物没有变化，跳过 commit"
else
  git commit -m "build: 更新生产构建产物"
fi

echo "==> 推送到 origin"
git push

echo "==> 连接 ${DEPLOY_USER}@${DEPLOY_HOST}，拉取代码并重启 nginx（超时 ${DEPLOY_TIMEOUT}s）"
set +e
"$TIMEOUT_BIN" "$DEPLOY_TIMEOUT" sshpass -p "$DEPLOY_PASSWORD" \
  ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 \
  "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<REMOTE_SCRIPT
set -e
# 关掉 git 的交互式凭据提示：需要输入用户名/密码或确认 host key 时直接失败，
# 而不是在没有 TTY 的非交互 shell 里挂住等一个永远不会来的输入
export GIT_TERMINAL_PROMPT=0
export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=15"
cd "${DEPLOY_PATH}"
echo "==> git pull"
git pull
echo "==> 重启 nginx"
nginx -t && nginx -s reload
REMOTE_SCRIPT
STATUS=$?
set -e

if [ "$STATUS" -eq 124 ]; then
  echo "==> 部署超时（${DEPLOY_TIMEOUT}s），已中止。可能卡在网络或需要交互输入，请登录服务器手动排查" >&2
  exit 124
elif [ "$STATUS" -ne 0 ]; then
  echo "==> 部署失败，退出码 $STATUS" >&2
  exit "$STATUS"
fi

echo "==> 部署完成"
