#!/bin/bash
# L2 API 检测轮询器启动脚本
# 用法: bash scripts/poller.sh
# 或使用 pm2: pm2 start pm2.pollers.json

cd "$(dirname "$0")/.."
exec npx tsx scripts/poller.ts >> /tmp/poller-l2.log 2>&1
