const express = require('express');
const router = express.Router();
const { merchants, orders, sessions } = require('../models/db');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 分流算法
function selectChannel(channels, strategy = 'round-robin') {
  const available = channels.filter(c => 
    c.status === 'active' && 
    (c.dailyLimit === 0 || c.todayAmount < c.dailyLimit)
  );

  if (available.length === 0) return null;

  switch(strategy) {
    case 'round-robin':
      global.roundRobinIndex = (global.roundRobinIndex || 0) + 1;
      return available[global.roundRobinIndex % available.length];
    case 'random':
      return available[Math.floor(Math.random() * available.length)];
    case 'weight':
      const totalWeight = available.reduce((sum, c) => sum + (c.weight || 100), 0);
      let random = Math.random() * totalWeight;
      for (const c of available) {
        random -= (c.weight || 100);
        if (random <= 0) return c;
      }
      return available[0];
    case 'least-loaded':
      return available.sort((a, b) => (a.todayAmount || 0) - (b.todayAmount || 0))[0];
    default:
      return available[0];
  }
}

// 中间页路由 - 扫码后打开的页面
router.get('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = merchants.findById(merchantId);

    if (!merchant || merchant.status !== 'active') {
      return res.status(404).render('error', { 
        message: '收款码不存在或已停用',
        code: 404 
      });
    }

    // 选择支付通道（一码多付）
    const channel = selectChannel(
      merchant.channels || [], 
      merchant.routingStrategy || 'round-robin'
    );

    if (!channel) {
      return res.status(503).render('error', {
        message: '当前支付通道繁忙，请稍后重试',
        code: 503
      });
    }

    // 创建支付会话
    const session = sessions.create({
      merchantId: merchant.id,
      channelId: channel.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分钟过期
    });

    // 渲染支付页面
    res.render('payment', {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        avatar: merchant.avatar || '/default-avatar.png'
      },
      sessionId: session.id,
      channelType: channel.type,
      // 支付宝：嵌入userId用于跳转
      alipayUserId: channel.type === 'alipay' ? channel.userId : null,
      // 微信：显示收款码内容（用户需长按识别）
      wechatQrContent: channel.type === 'wechat' ? channel.qrContent : null,
      // 支付宝原始收款码链接（备用方案）
      alipayQrUrl: channel.type === 'alipay' ? channel.qrContent : null,
      // 商户配置
      allowCustomAmount: merchant.allowCustomAmount !== false,
      defaultAmount: merchant.defaultAmount || '',
      allowRemark: merchant.allowRemark !== false
    });

  } catch (error) {
    console.error('Paypage error:', error);
    res.status(500).render('error', { 
      message: '系统错误，请稍后重试',
      code: 500 
    });
  }
});

module.exports = router;
