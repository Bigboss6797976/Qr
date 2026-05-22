const express = require('express');
const router = express.Router();
const { merchants, orders, sessions } = require('../models/db');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 发起支付 - 返回跳转URL
router.post('/initiate', async (req, res) => {
  try {
    const { merchantId, amount, payType, remark, sessionId } = req.body;

    if (!merchantId || !amount || amount <= 0) {
      return res.status(400).json({ error: '参数错误：缺少商户ID或金额' });
    }

    const merchant = merchants.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: '商户不存在' });
    }

    // 验证会话
    const session = sessions.findById(sessionId);
    if (!session || session.status !== 'pending') {
      return res.status(400).json({ error: '会话已过期或无效' });
    }

    // 生成唯一订单号
    const orderNo = `XY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 创建订单记录
    const order = orders.create({
      orderNo,
      merchantId,
      amount: parseFloat(amount),
      payType,
      remark: remark || '',
      sessionId,
      status: 'pending', // 等待用户实际支付
      createdAt: new Date().toISOString()
    });

    // 更新会话
    sessions.update(sessionId, {
      orderNo,
      amount: parseFloat(amount),
      status: 'paying'
    });

    let redirectUrl = null;
    let fallbackHtml = null;

    if (payType === 'alipay') {
      // 支付宝跳转方案
      const channel = merchant.channels?.find(c => c.type === 'alipay');

      if (channel && channel.userId) {
        // 方案1: 直接转账到指定用户（需要userId）
        // 注意：此URL唤起支付宝APP，用户输入密码完成支付
        redirectUrl = `alipays://platformapi/startapp?appId=20000123&actionType=toAccount&goBack=YES&amount=${amount}&userId=${channel.userId}&memo=${encodeURIComponent(remark || orderNo)}`;
      } else if (channel && channel.qrContent) {
        // 方案2: 使用扫一扫打开收款码
        redirectUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=${encodeURIComponent(channel.qrContent)}`;
      }

      // 备用H5链接
      fallbackHtml = `
        <div style="text-align:center;padding:40px 20px;">
          <p style="font-size:18px;color:#666;margin-bottom:20px;">如果支付宝未自动打开，请保存下方二维码手动扫码</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(channel?.qrContent || '')}" style="max-width:280px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <p style="margin-top:20px;color:#999;font-size:14px;">金额：¥${amount}</p>
        </div>
      `;

    } else if (payType === 'wechat') {
      // 微信：无法直接URL跳转，返回收款码内容
      const channel = merchant.channels?.find(c => c.type === 'wechat');

      if (channel && channel.qrContent) {
        fallbackHtml = `
          <div style="text-align:center;padding:40px 20px;">
            <p style="font-size:18px;color:#666;margin-bottom:20px;">请长按识别下方二维码完成支付</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(channel.qrContent)}" style="max-width:280px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <p style="margin-top:20px;color:#999;font-size:14px;">金额：¥${amount}</p>
            <p style="margin-top:10px;color:#07C160;font-size:14px;">请在微信中打开此页面</p>
          </div>
        `;
      }
    }

    res.json({
      success: true,
      orderNo,
      redirectUrl,
      fallbackHtml,
      amount,
      merchantName: merchant.name,
      message: '请确认支付'
    });

  } catch (error) {
    console.error('Initiate pay error:', error);
    res.status(500).json({ error: error.message || '发起支付失败' });
  }
});

// 查询订单状态
router.get('/order/:orderNo', async (req, res) => {
  const order = orders.findOne({ orderNo: req.params.orderNo });
  if (!order) return res.status(404).json({ error: '订单不存在' });

  res.json({
    orderNo: order.orderNo,
    status: order.status,
    amount: order.amount,
    payType: order.payType,
    createdAt: order.createdAt,
    paidAt: order.paidAt || null
  });
});

// 支付成功回调（用户手动确认）
router.post('/confirm/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  const order = orders.findOne({ orderNo });

  if (!order) return res.status(404).json({ error: '订单不存在' });

  // 更新订单为已支付（仅标记，不验证真实性）
  orders.update(order.id, {
    status: 'paid',
    paidAt: new Date().toISOString()
  });

  // 更新通道今日金额
  const merchant = merchants.findById(order.merchantId);
  if (merchant && merchant.channels) {
    const channel = merchant.channels.find(c => c.type === order.payType);
    if (channel) {
      channel.todayAmount = (channel.todayAmount || 0) + order.amount;
      merchants.update(merchant.id, { channels: merchant.channels });
    }
  }

  res.json({ success: true, message: '支付已确认' });
});

module.exports = router;
