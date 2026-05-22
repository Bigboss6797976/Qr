# 贡献指南

感谢您对 QR支付系统 的兴趣！

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/your-username/qr-payment-system.git
cd qr-payment-system

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
backend/      # Node.js 后端 API
frontend/     # Web 前端（三端共用）
ios/          # iOS 原生项目（Capacitor）
android/      # Android 原生项目（Capacitor）
electron/     # 桌面端项目（Electron）
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具

## 提交 PR

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交变更 (`git commit -m 'feat: 添加某功能'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

## 代码规范

- 使用 2 空格缩进
- 字符串使用单引号
- 行尾不使用分号（可选）
- 添加必要的注释
