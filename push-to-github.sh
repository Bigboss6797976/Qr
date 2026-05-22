#!/bin/bash

# QR支付系统 - GitHub 推送脚本
# 使用方法: ./push-to-github.sh [你的GitHub用户名]

set -e

GITHUB_USER=${1:-"your-username"}
REPO_NAME="qr-payment-system"
REMOTE_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo "🚀 推送到 GitHub: $REMOTE_URL"

# 检查 git
if ! command -v git &> /dev/null; then
    echo "❌ 未安装 Git"
    echo "💡 macOS: brew install git"
    echo "💡 Ubuntu: sudo apt install git"
    echo "💡 Windows: https://git-scm.com/download/win"
    exit 1
fi

# 检查 GitHub CLI (可选)
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI 已安装"
    HAS_GH=true
else
    echo "⚠️ 建议安装 GitHub CLI: https://cli.github.com/"
    HAS_GH=false
fi

# 初始化 git 仓库
if [ ! -d .git ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git branch -M main
fi

# 配置 git (如果未配置)
if [ -z "$(git config user.name)" ]; then
    echo "⚙️ 配置 Git 用户名..."
    git config user.name "Your Name"
fi
if [ -z "$(git config user.email)" ]; then
    echo "⚙️ 配置 Git 邮箱..."
    git config user.email "your.email@example.com"
fi

# 添加远程仓库
echo "🔗 添加远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

# 检查远程连接
echo "🔍 检查远程仓库..."
if git ls-remote --exit-code origin &>/dev/null; then
    echo "✅ 远程仓库可访问"
else
    echo "⚠️ 远程仓库不存在或无法访问"
    if [ "$HAS_GH" = true ]; then
        echo "🆕 使用 GitHub CLI 创建仓库..."
        gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
        exit 0
    else
        echo "💡 请先在 GitHub 创建仓库: https://github.com/new"
        echo "   仓库名: $REPO_NAME"
        echo "   然后运行此脚本"
        exit 1
    fi
fi

# 添加文件
echo "📁 添加文件到暂存区..."
git add -A

# 检查是否有变更
if git diff --cached --quiet; then
    echo "⚠️ 没有需要提交的变更"
    exit 0
fi

# 提交
echo "💾 提交变更..."
git commit -m "feat: 初始化 QR支付系统 - 三端通用版

- 支持 iOS/Android/电脑/Web 四端
- 收款码上传与美化
- 一码多付聚合支付
- 订单管理与退款控制
- 自动构建 CI/CD"

# 推送
echo "📤 推送到 GitHub..."
git push -u origin main

echo "🎉 推送完成!"
echo ""
echo "📎 仓库地址: $REMOTE_URL"
echo ""
echo "🔧 后续操作:"
echo "   1. 访问 GitHub 仓库设置 Secrets"
echo "   2. 配置 Android 签名密钥 (SIGNING_KEY_BASE64)"
echo "   3. 配置 iOS 证书 (需要手动在 Xcode 中设置)"
echo "   4. 推送 tag 触发自动发布: git tag v1.0.0 && git push origin v1.0.0"
