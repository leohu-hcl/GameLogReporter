#!/usr/bin/env bash
# 把 SDK 子目录同步到 upm 分支（包根=仓库根，UPM 干净 URL）并推送到 GitHub。
# 用法：./scripts/publish-upm.sh
set -euo pipefail

PREFIX="unity-client/Assets/GameLogReporter"
cd "$(git rev-parse --show-toplevel)"

# split 输出包根 commit；用 update-ref 覆盖已存在的 upm（-b 无法更新已有分支），
# 故对远端用 force push——upm 是从 main 派生的发布分支，被覆盖是预期行为。
SPLIT=$(git subtree split --prefix="$PREFIX")
git update-ref refs/heads/upm "$SPLIT"
git push origin upm --force

echo "upm 已同步并推送到 origin(GitHub)：$SPLIT"
# ponytail: split 每次重建 upm 分支即可，无需维护单独的包仓库
