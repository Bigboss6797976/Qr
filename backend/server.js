const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件目录
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/styled-urls', express.static(path.join(__dirname, '../styled-urls')));

// 模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

global.roundRobinIndex = 0;

// 数据库目录
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// ==================== 诊断路由（先加，方便排查） ====================
app.get('/debug', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public/index.html');
    const exists = fs.existsSync(indexPath);
    let contentPreview = '';
    let contentLength = 0;
    if (exists) {
        const content = fs.readFileSync(indexPath, 'utf8');
        contentLength = content.length;
        contentPreview = content.substring(0, 500);
    }
    res.send(`
        <h1>🔍 诊断信息</h1>
        <p><strong>__dirname:</strong> ${__dirname}</p>
        <p><strong>查找路径:</strong> ${indexPath}</p>
        <p><strong>文件是否存在:</strong> ${exists ? '✅ 是' : '❌ 否'}</p>
        <p><strong>文件大小:</strong> ${contentLength} 字节</p>
        <p><strong>内容预览 (前500字符):</strong></p>
        <pre style="background:#f4f4f4;padding:10px;overflow:auto;">${contentPreview || '(文件为空或不存在)'}</pre>
        <hr>
        <p>如果文件不存在，请检查你的项目目录结构是否正确。</p>
    `);
});

// ==================== 正常路由 ====================
// 根路由 - 返回首页
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`Index not found at: ${indexPath}`);
    }
});

// 商户页面
app.get('/merchant', (req, res) => {
    const merchantPath = path.join(__dirname, '../frontend/public/merchant.html');
    if (fs.existsSync(merchantPath)) {
        res.sendFile(merchantPath);
    } else {
        res.status(404).send(`Merchant page not found at: ${merchantPath}`);
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/upload', require('./routes/upload'));
app.use('/api/beautify', require('./routes/beautify'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/order', require('./routes/order'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/pay', require('./routes/paypage'));
app.use('/admin', require('./routes/admin'));

// 404 兜底
app.use((req, res) => {
    res.status(404).send(`Route ${req.path} not found`);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`QR Payment System running on ${BASE_URL}`);
    console.log(`Upload directory: ${path.join(__dirname, '../uploads')}`);
    console.log(`Styled QR directory: ${path.join(__dirname, '../styled-urls')}`);
});

module.exports = app;
