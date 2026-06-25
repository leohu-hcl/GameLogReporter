#!/usr/bin/env bash
# 把 SDK 子目录同步到 upm 分支（包根=仓库根，UPM 干净 URL）并推送到 GitHub。
# 用法：./scripts/publish-upm.sh
set -euo pipefail

PREFIX="unity-client/Assets/GameLogReporter"
cd "$(git rev-parse --show-toplevel)"

git subtree split --prefix="$PREFIX" -b upm
git push origin upm

echo "upm 已同步并推送到 origin(GitHub)。"
# ponytail: split 每次重建 upm 分支即可，无需维护单独的包仓库
