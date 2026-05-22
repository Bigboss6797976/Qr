const express = require('express');
const router = express.Router();
const { merchants } = require('../models/db');

// 获取商户列表
router.get('/', (req, res) => {
  const all = merchants.findAll();
  // 脱敏处理
  const safe = all.map(m => ({
    id: m.id,
    name: m.name,
    payType: m.payType,
    status: m.status,
    allowRefund: m.allowRefund,
    styledQrUrl: m.styledQrUrl,
    payUrl: m.payUrl,
    createdAt: m.createdAt
  }));
  res.json(safe);
});

// 获取单个商户
router.get('/:merchantId', (req, res) => {
  const merchant = merchants.findById(req.params.merchantId);
  if (!merchant) return res.status(404).json({ error: '商户不存在' });

  const { qrContent, rawQrPath, alipayUserId, channels, ...safe } = merchant;
  // 返回通道基本信息（脱敏）
  safe.channelInfo = (channels || []).map(c => ({
    id: c.id,
    type: c.type,
    weight: c.weight,
    status: c.status,
    dailyLimit: c.dailyLimit,
    todayAmount: c.todayAmount
  }));

  res.json(safe);
});

// 更新商户配置
router.put('/:merchantId', (req, res) => {
  const { merchantId } = req.params;
  const merchant = merchants.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: '商户不存在' });

  const allowedUpdates = [
    'name', 'avatar', 'allowRefund', 'allowCustomAmount',
    'defaultAmount', 'allowRemark', 'routingStrategy'
  ];

  const updates = {};
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  // 特殊处理：添加新通道（一码多付）
  if (req.body.newChannel) {
    const channels = merchant.channels || [];
    const newId = (channels.length + 1).toString();
    channels.push({
      id: newId,
      ...req.body.newChannel,
      todayAmount: 0,
      status: 'active'
    });
    updates.channels = channels;
  }

  const updated = merchants.update(merchantId, updates);
  res.json({ success: true, merchant: updated });
});

// 删除商户
router.delete('/:merchantId', (req, res) => {
  const result = merchants.delete(req.params.merchantId);
  if (!result) return res.status(404).json({ error: '商户不存在' });
  res.json({ success: true, message: '商户已删除' });
});

module.exports = router;
