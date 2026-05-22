<div align="center">

# 🔷 QR支付系统 v1.0

[![CI/CD](https://github.com/xuyang/qr-payment-system/actions/workflows/build.yml/badge.svg)](https://github.com/xuyang/qr-payment-system/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Win%20%7C%20Mac%20%7C%20Linux-blue)](https://github.com/xuyang/qr-payment-system)

**个人收款码美化聚合支付系统 - 苹果/安卓/电脑 三端通用**

[下载 APK](https://github.com/xuyang/qr-payment-system/releases) · [使用文档](#快速开始) · [报告问题](../../issues)

</div>

---



## 三端支持

| 平台 | 技术方案 | 打包方式 | 特性 |
|------|----------|----------|------|
| **iOS** | Capacitor + WKWebView + Swift | Xcode Archive | 原生相机、系统分享、状态栏主题 |
| **Android** | Capacitor + WebView + Java | Android Studio / Gradle | 支付宝唤起、相册保存、权限管理 |
| **电脑** | Electron + Node.js | electron-builder | Win/Mac/Linux、拖拽上传、本地服务 |
| **Web** | 纯浏览器 | 直接访问 | 零安装、即开即用 |

---

## 功能特性

- **用户上传收款码**：支持支付宝、微信个人收款码上传
- **二维码美化引擎**：6种预设模板 + 自定义颜色/形状/Logo
- **一码多付**：多人同时扫码，自动分流到不同收款账户
- **中间页支付**：扫码后输入金额，跳转官方APP完成支付
- **退款控制**：默认关闭退款，后台可手动处理
- **订单管理**：完整的订单记录和统计
- **三端通用**：一套代码，同时支持iOS/Android/电脑

---

## 快速开始

### Web 模式（所有平台通用）

```bash
npm install
npm start
# 访问 http://localhost:3000
```

### iOS App 打包

**前置要求**：macOS + Xcode 14+ + Apple Developer 账号

```bash
# 1. 安装依赖
npm install

# 2. 同步 iOS 项目
npx cap sync ios

# 3. 安装 CocoaPods
cd ios/App && pod install

# 4. 打开 Xcode 打包
npx cap open ios
# 或运行: ./build-ios.sh
```

### Android App 打包

**前置要求**：Android Studio + JDK 17 + Android SDK

```bash
# 1. 安装依赖
npm install

# 2. 同步 Android 项目
npx cap sync android

# 3. 打开 Android Studio
npx cap open android

# 4. 构建 APK
# Build -> Build Bundle(s) / APK(s) -> Build APK(s)
# 或命令行:
cd android
./gradlew assembleRelease
```

### 电脑端打包

**前置要求**：Node.js 16+

```bash
# 1. 安装依赖
npm install
cd electron && npm install

# 2. 打包 Windows
npm run dist:win

# 3. 打包 Mac
npm run dist:mac

# 4. 打包 Linux
npm run dist:linux

# 或全部打包
npm run build:all
```

---

## 三端特有功能

### iOS 端
- 原生相机扫描二维码
- iOS 系统分享面板
- 保存图片到系统相册
- 紫色沉浸式状态栏
- 支付宝 URL Scheme 唤起

### Android 端
- 支付宝/微信安装检测
- 原生权限申请（相机/存储）
- Android 分享意图
- 自适应图标和启动屏
- 后台返回状态刷新

### 电脑端 (Win/Mac/Linux)
- 本地 Express 后端服务
- 系统文件选择对话框
- 拖拽文件上传
- 系统浏览器跳转支付
- 窗口化操作体验

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (HTML/CSS/JS)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   iOS App   │  │ Android App │  │   Electron Desktop  │ │
│  │  Capacitor  │  │  Capacitor  │  │    (Win/Mac/Linux)  │ │
│  │   + Swift   │  │   + Java    │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         ↑                ↑                    ↑               │
│    ┌────┴────────────────┴────────────────────┴────┐        │
│    │              Node.js Express 后端              │        │
│    │  - 收款码上传/解析                              │        │
│    │  - 二维码美化引擎 (Canvas)                      │        │
│    │  - 订单/退款管理                                │        │
│    │  - JSON文件数据库                               │        │
│    └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## API接口

### 上传收款码
```
POST /api/upload
Content-Type: multipart/form-data

merchantName: 商户名称
payType: alipay | wechat
qrImage: 收款码图片文件
```

### 美化二维码
```
POST /api/beautify/:merchantId
Content-Type: application/json

{
  "style": "gradient",
  "customColors": ["#1677FF", "#00D4FF"],
  "dotStyle": "rounded",
  "eyeStyle": "circle",
  "logoUrl": "https://..."
}
```

### 发起支付
```
POST /api/payment/initiate
{
  "merchantId": "xxx",
  "amount": 100,
  "payType": "alipay",
  "remark": "订单备注"
}
```

---

## 重要说明

### 关于免密支付
本系统**不调用任何支付API**，完全基于用户上传的个人收款码。扫码后跳转到支付宝/微信官方APP，由用户手动输入金额和密码完成支付。因此无法实现真正的免密支付。

### 关于退款
- 默认关闭退款功能
- 商户可在后台开启"允许退款"
- 退款仅标记状态，实际转账需商户手动操作
- 支持同意/拒绝退款申请

### 关于一码多付
支持配置多个支付通道，系统根据策略自动分流：
- `round-robin`: 轮询
- `random`: 随机
- `weight`: 按权重
- `least-loaded`: 最少收款优先

### 各平台支付跳转差异
| 平台 | 支付宝 | 微信 |
|------|--------|------|
| iOS | URL Scheme唤起APP | 显示收款码，长按识别 |
| Android | Intent唤起APP | 显示收款码，长按识别 |
| 电脑 | 打开系统浏览器 | 显示收款码，手机扫码 |
| Web | 跳转/新开标签 | 显示收款码，长按识别 |

---

## 技术栈

- **后端**: Node.js + Express + EJS
- **数据库**: JSON文件存储（零配置）
- **二维码**: qrcode + canvas + jsQR
- **前端**: 原生HTML/CSS/JS（响应式）
- **iOS**: Capacitor 6 + WKWebView + Swift
- **Android**: Capacitor 6 + WebView + Java
- **桌面**: Electron 28 + Node.js

---

## 目录结构

```
qr-payment-system/
├── backend/              # Node.js 后端API
│   ├── server.js
│   ├── routes/
│   ├── models/
│   └── views/
├── frontend/public/      # Web前端（三端共用）
│   ├── index.html        # 管理后台
│   └── merchant.html     # 商户详情
├── ios/                  # iOS原生项目
│   └── App/
│       ├── App/
│       │   ├── AppDelegate.swift
│       │   ├── MainViewController.swift
│       │   └── Info.plist
│       ├── App.xcodeproj/
│       └── Podfile
├── android/              # Android原生项目
│   └── app/src/main/
│       ├── java/com/xuyang/qrpay/
│       │   ├── MainActivity.java
│       │   ├── AlipayPlugin.java
│       │   └── QRScannerPlugin.java
│       ├── AndroidManifest.xml
│       └── res/
├── electron/             # 桌面端项目
│   ├── src/
│   │   ├── main.js       # 主进程
│   │   └── preload.js    # 预加载脚本
│   └── package.json
├── uploads/              # 原始收款码
├── styled-qr/            # 美化后二维码
├── database/             # JSON数据文件
├── capacitor.config.json # Capacitor配置
├── build-ios.sh          # iOS打包脚本
└── package.json
```

---

## 注意事项

1. **风控风险**：个人码频繁收款可能触发平台风控，建议分散多个账户
2. **二维码识别**：美化后的二维码必须保持H级30%容错率才能加Logo
3. **支付宝跳转**：依赖支付宝URL Scheme，可能因版本更新失效
4. **微信限制**：微信不支持URL Scheme跳转，需显示收款码让用户长按识别
5. **数据持久化**：当前使用JSON文件存储，生产环境建议迁移到MongoDB/PostgreSQL
6. **iOS签名**：真机测试和发布需要Apple Developer账号（$99/年）
7. **Android签名**：发布到应用商店需要生成签名密钥
8. **桌面端**：Electron打包体积较大（约150MB），建议提供Web版作为轻量替代

---

## License

MIT
