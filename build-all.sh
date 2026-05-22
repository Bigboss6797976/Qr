#!/bin/bash

# QR支付系统 - 三端通用构建脚本
# 使用方法: ./build-all.sh [ios|android|electron|all]

set -e

PLATFORM=${1:-all}
echo "🚀 QR支付系统 - 构建平台: $PLATFORM"

# 检查环境
check_env() {
    if ! command -v node &> /dev/null; then
        echo "❌ 错误: 未安装 Node.js"
        exit 1
    fi
    echo "✅ Node.js: $(node -v)"
}

# 安装依赖
install_deps() {
    echo "📦 安装依赖..."
    npm install
    if [ "$PLATFORM" = "electron" ] || [ "$PLATFORM" = "all" ]; then
        cd electron && npm install && cd ..
    fi
}

# 构建 iOS
build_ios() {
    echo "🍎 构建 iOS..."
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo "⚠️ iOS构建需要 macOS 系统，跳过"
        return
    fi

    if ! command -v xcodebuild &> /dev/null; then
        echo "❌ 未安装 Xcode"
        return
    fi

    npx cap sync ios
    cd ios/App
    pod install --repo-update
    cd ../..

    echo "✅ iOS 项目已同步"
    echo "💡 运行 'npx cap open ios' 打开 Xcode 打包"
}

# 构建 Android
build_android() {
    echo "🤖 构建 Android..."
    if ! command -v java &> /dev/null; then
        echo "❌ 未安装 Java"
        return
    fi

    npx cap sync android
    cd android
    ./gradlew assembleRelease
    cd ..

    echo "✅ Android APK: android/app/build/outputs/apk/release/"
}

# 构建 Electron
build_electron() {
    echo "💻 构建桌面端..."
    cd electron

    # 检测平台
    if [[ "$OSTYPE" == "darwin"* ]]; then
        npm run dist:mac
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        npm run dist:win
    else
        npm run dist:linux
    fi

    cd ..
    echo "✅ 桌面端安装包已生成"
}

# 主流程
check_env
install_deps

case $PLATFORM in
    ios)
        build_ios
        ;;
    android)
        build_android
        ;;
    electron)
        build_electron
        ;;
    all)
        build_ios
        build_android
        build_electron
        ;;
    *)
        echo "用法: ./build-all.sh [ios|android|electron|all]"
        exit 1
        ;;
esac

echo "🎉 构建完成!"
