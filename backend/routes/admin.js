const express = require('express');
const router = express.Router();
const { merchants, orders, refunds } = require('../models/db');

// 管理后台首页
router.get('/', (req, res) => {
  res.sendFile(require('path').join(__dirname, '../../frontend/public/admin.html'));
});

// 获取仪表盘数据
router.get('/dashboard', (req, res) => {
  const allOrders = orders.findAll();
  const allRefunds = refunds.findAll();

  res.json({
    stats: {
      totalMerchants: merchants.findAll().length,
      totalOrders: allOrders.length,
      totalAmount: allOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      pendingRefunds: allRefunds.filter(r => r.status === 'pending').length,
      todayOrders: allOrders.filter(o => {
        const today = new Date().toDateString();
        return new Date(o.createdAt).toDateString() === today;
      }).length
    },
    recentOrders: allOrders.slice(-10).reverse(),
    pendingRefundList: allRefunds.filter(r => r.status === 'pending')
  });
});

module.exports = router;
