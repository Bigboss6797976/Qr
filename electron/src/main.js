const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// 启动后端服务
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

let mainWindow;
let server;
const PORT = 3000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'QR支付系统',
        icon: path.join(__dirname, '../build/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        show: false,
        backgroundColor: '#667eea'
    });

    // 加载本地服务
    mainWindow.loadURL(`http://localhost:${PORT}`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // 开发模式打开开发者工具
        // mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 处理新窗口请求（支付宝/微信跳转）
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.includes('alipays://') || url.includes('weixin://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    // 拦截导航，处理支付跳转
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.includes('alipays://') || url.includes('weixin://') || url.includes('upwallet://')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}

function startBackend() {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

    // 静态资源
    app.use(express.static(path.join(__dirname, '../../frontend/public')));
    app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
    app.use('/styled-qr', express.static(path.join(__dirname, '../../styled-qr')));

    // API路由
    app.use('/api/upload', require('../../backend/routes/upload'));
    app.use('/api/beautify', require('../../backend/routes/beautify'));
    app.use('/api/payment', require('../../backend/routes/payment'));
    app.use('/api/order', require('../../backend/routes/order'));
    app.use('/api/merchant', require('../../backend/routes/merchant'));
    app.use('/pay', require('../../backend/routes/paypage'));
    app.use('/admin', require('../../backend/routes/admin'));

    app.set('views', path.join(__dirname, '../../backend/views'));
    app.set('view engine', 'ejs');

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
    });

    app.get('/merchant', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/public/merchant.html'));
    });

    server = app.listen(PORT, () => {
        console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
    });
}

// IPC 通信
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
        ]
    });
    return result.filePaths;
});

ipcMain.handle('save-file', async (event, { data, filename }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [
            { name: 'PNG图片', extensions: ['png'] }
        ]
    });
    if (!result.canceled && result.filePath) {
        const base64Data = data.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
    return { success: true };
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (server) server.close();
});
