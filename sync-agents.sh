#!/usr/bin/env bash
# 同步 AGENTS.md 到各 AI 平台特定的 markdown 文件中
set -e

# 确保在项目根目录执行
cd "$(dirname "$0")"

echo "🔄 正在同步 AGENTS.md..."

cp AGENTS.md CLAUDE.md
cp AGENTS.md GEMINI.md

echo "✅ 成功! AGENTS.md 已同步至 CLAUDE.md 和 GEMINI.md"
