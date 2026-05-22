const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/styled-urls', express.static(path.join(__dirname, '../styled-urls')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

global.roundRobinIndex = 0;

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// 根路由：直接读取并返回 index.html
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public/index.html');
    try {
        const html = fs.readFileSync(indexPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(`Error reading index.html: ${err.message}`);
    }
});

app.get('/merchant', (req, res) => {
    const merchantPath = path.join(__dirname, '../frontend/public/merchant.html');
    if (fs.existsSync(merchantPath)) {
        res.sendFile(merchantPath);
    } else {
        res.status(404).send(`Merchant page not found at: ${merchantPath}`);
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/public/index.html');
    const exists = fs.existsSync(indexPath);
    let contentPreview = '';
    if (exists) {
        const content = fs.readFileSync(indexPath, 'utf8');
        contentPreview = content.substring(0, 500);
    }
    res.send(`
        <h1>Diagnostic</h1>
        <p>__dirname: ${__dirname}</p>
        <p>Index path: ${indexPath}</p>
        <p>Exists: ${exists}</p>
        <p>Content preview: <pre>${contentPreview}</pre></p>
    `);
});

app.use('/api/upload', require('./routes/upload'));
app.use('/api/beautify', require('./routes/beautify'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/order', require('./routes/order'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/pay', require('./routes/paypage'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
    res.status(404).send(`Route ${req.path} not found`);
});

app.listen(PORT, () => {
    console.log(`QR Payment System running on ${BASE_URL}`);
    console.log(`Upload directory: ${path.join(__dirname, '../uploads')}`);
    console.log(`Styled QR directory: ${path.join(__dirname, '../styled-urls')}`);
});

module.exports = app;
