#!/bin/bash

# QR支付系统 iOS 打包脚本
# 使用方法: ./build-ios.sh [development|ad-hoc|app-store]

set -e

BUILD_TYPE=${1:-development}
echo "🚀 开始打包 iOS App - 模式: $BUILD_TYPE"

# 1. 检查环境
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi

if ! command -v xcodebuild &> /dev/null; then
    echo "❌ 错误: 未安装 Xcode"
    exit 1
fi

if ! command -v pod &> /dev/null; then
    echo "❌ 错误: 未安装 CocoaPods"
    echo "💡 运行: sudo gem install cocoapods"
    exit 1
fi

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 同步 Capacitor
echo "🔄 同步 Capacitor..."
npx cap sync ios

# 4. 安装 Pods
echo "🍫 安装 CocoaPods..."
cd ios/App
pod install --repo-update
cd ../..

# 5. 构建
echo "🔨 构建项目..."
cd ios/App

if [ "$BUILD_TYPE" = "development" ]; then
    # 开发模式 - 直接安装到连接的设备
    xcodebuild -workspace App.xcworkspace         -scheme App         -configuration Debug         -destination "platform=iOS,name=iPhone"         build
    echo "✅ 构建完成，请在Xcode中运行到设备"

elif [ "$BUILD_TYPE" = "ad-hoc" ]; then
    # Ad Hoc 分发
    xcodebuild -workspace App.xcworkspace         -scheme App         -configuration Release         -destination "generic/platform=iOS"         archive -archivePath build/App.xcarchive

    xcodebuild -exportArchive         -archivePath build/App.xcarchive         -exportPath build/ipa         -exportOptionsPlist exportOptions.plist

    echo "✅ IPA 已导出到: ios/App/build/ipa/"

elif [ "$BUILD_TYPE" = "app-store" ]; then
    # App Store 发布
    xcodebuild -workspace App.xcworkspace         -scheme App         -configuration Release         -destination "generic/platform=iOS"         archive -archivePath build/App.xcarchive

    xcodebuild -exportArchive         -archivePath build/App.xcarchive         -exportPath build/appstore         -exportOptionsPlist exportOptions-appstore.plist

    echo "✅ App Store 包已导出到: ios/App/build/appstore/"
fi

echo "🎉 打包完成!"
