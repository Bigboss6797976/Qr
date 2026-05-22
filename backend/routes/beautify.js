const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { merchants } = require('../models/db');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const STYLE_TEMPLATES = {
  gradient: { name: '渐变蓝', type: 'gradient', colors: ['#1677FF', '#00D4FF'], bgColor: '#FFFFFF', dotStyle: 'square', eyeStyle: 'square', hasBorder: true, borderText: '扫码支付' },
  rounded: { name: '圆润风格', type: 'rounded', colors: ['#52C41A'], bgColor: '#F6FFED', dotStyle: 'rounded', eyeStyle: 'rounded', hasBorder: false },
  neon: { name: '霓虹科技', type: 'neon', colors: ['#00FF88'], bgColor: '#0A0A0A', dotStyle: 'circle', eyeStyle: 'circle', hasBorder: true, borderText: 'PAY NOW', glow: true, glowColor: '#00FF88' },
  minimal: { name: '极简黑白', type: 'minimal', colors: ['#000000'], bgColor: '#FFFFFF', dotStyle: 'square', eyeStyle: 'square', hasBorder: false },
  gold: { name: '奢华金', type: 'gradient', colors: ['#FFD700', '#FFA500'], bgColor: '#1A1A1A', dotStyle: 'diamond', eyeStyle: 'rounded', hasBorder: true, borderText: 'VIP PAY' },
  pink: { name: '樱花粉', type: 'gradient', colors: ['#FF69B4', '#FFB6C1'], bgColor: '#FFF0F5', dotStyle: 'circle', eyeStyle: 'rounded', hasBorder: false }
};

router.get('/templates', (req, res) => {
  res.json(STYLE_TEMPLATES);
});

router.post('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = merchants.findById(merchantId);
    if (!merchant) return res.status(404).json({ error: '商户不存在' });
    const payUrl = `${BASE_URL}/pay/${merchantId}`;
    res.json({ success: true, merchantId, payUrl, message: '美化功能暂时维护中，请使用基础二维码', preview: null, config: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message || '美化失败' });
  }
});

router.post('/preview/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = merchants.findById(merchantId);
    if (!merchant) return res.status(404).json({ error: '商户不存在' });
    const payUrl = `${BASE_URL}/pay/${merchantId}`;
    res.json({ preview: null, payUrl, message: '预览功能暂时维护中' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
