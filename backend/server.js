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
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/styled-qr', express.static(path.join(__dirname, '../styled-qr')));

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 全局变量
global.roundRobinIndex = 0;

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// 路由
app.use('/api/upload', require('./routes/upload'));
app.use('/api/beautify', require('./routes/beautify'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/order', require('./routes/order'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/pay', require('./routes/paypage'));
app.use('/admin', require('./routes/admin'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 前端主页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// 商户管理页面
app.get('/merchant', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/merchant.html'));
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 QR Payment System running on ${BASE_URL}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
  console.log(`🎨 Styled QR directory: ${path.join(__dirname, '../styled-qr')}`);
});

module.exports = app;
