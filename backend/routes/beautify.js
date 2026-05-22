const express = require('express');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { merchants } = require('../models/db');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 美化配置模板
const STYLE_TEMPLATES = {
  gradient: {
    name: '渐变蓝',
    type: 'gradient',
    colors: ['#1677FF', '#00D4FF'],
    bgColor: '#FFFFFF',
    dotStyle: 'square',
    eyeStyle: 'square',
    hasBorder: true,
    borderText: '扫码支付'
  },
  rounded: {
    name: '圆润风格',
    type: 'rounded',
    colors: ['#52C41A'],
    bgColor: '#F6FFED',
    dotStyle: 'rounded',
    eyeStyle: 'rounded',
    hasBorder: false
  },
  neon: {
    name: '霓虹科技',
    type: 'neon',
    colors: ['#00FF88'],
    bgColor: '#0A0A0A',
    dotStyle: 'circle',
    eyeStyle: 'circle',
    hasBorder: true,
    borderText: 'PAY NOW',
    glow: true,
    glowColor: '#00FF88'
  },
  minimal: {
    name: '极简黑白',
    type: 'minimal',
    colors: ['#000000'],
    bgColor: '#FFFFFF',
    dotStyle: 'square',
    eyeStyle: 'square',
    hasBorder: false
  },
  gold: {
    name: '奢华金',
    type: 'gradient',
    colors: ['#FFD700', '#FFA500'],
    bgColor: '#1A1A1A',
    dotStyle: 'diamond',
    eyeStyle: 'rounded',
    hasBorder: true,
    borderText: 'VIP PAY'
  },
  pink: {
    name: '樱花粉',
    type: 'gradient',
    colors: ['#FF69B4', '#FFB6C1'],
    bgColor: '#FFF0F5',
    dotStyle: 'circle',
    eyeStyle: 'rounded',
    hasBorder: false
  }
};

// 生成美化二维码
async function generateStyledQR(options) {
  const {
    content,
    style = 'gradient',
    colors = ['#1677FF', '#00D4FF'],
    bgColor = '#FFFFFF',
    logoUrl = null,
    dotStyle = 'square',
    eyeStyle = 'square',
    hasBorder = true,
    borderText = '扫码支付',
    glow = false,
    glowColor = '#00FF88',
    size = 800
  } = options;

  const canvas = createCanvas(size, size + (hasBorder ? 80 : 0));
  const ctx = canvas.getContext('2d');
  const qrSize = size;

  // 1. 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size + (hasBorder ? 80 : 0));

  // 2. 生成基础二维码数据
  const qrCanvas = createCanvas(qrSize, qrSize);
  await QRCode.toCanvas(qrCanvas, content, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: qrSize,
    color: {
      dark: '#000000',
      light: '#FFFFFF00' // 透明背景
    }
  });

  // 获取二维码图像数据
  const qrCtx = qrCanvas.getContext('2d');
  const qrImageData = qrCtx.getImageData(0, 0, qrSize, qrSize);
  const data = qrImageData.data;

  // 计算模块大小
  const moduleCount = 33; // QR版本3 ~ 33x33
  const moduleSize = qrSize / (moduleCount + 4); // 含margin
  const offset = moduleSize * 2;

  // 3. 绘制自定义码点
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const x = Math.floor((col + 2) * moduleSize);
      const y = Math.floor((row + 2) * moduleSize);

      // 检查是否是定位图案区域
      const isFinder = (
        (row < 7 && col < 7) ||
        (row < 7 && col >= moduleCount - 7) ||
        (row >= moduleCount - 7 && col < 7)
      );

      // 检查是否是深色模块
      const centerX = Math.floor(x + moduleSize / 2);
      const centerY = Math.floor(y + moduleSize / 2);
      const pixelIndex = (centerY * qrSize + centerX) * 4;
      const isDark = data[pixelIndex] < 128;

      if (isDark) {
        ctx.save();

        // 设置颜色
        if (colors.length > 1) {
          const gradient = ctx.createLinearGradient(x, y, x + moduleSize, y + moduleSize);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0];
        }

        // 发光效果
        if (glow) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10;
        }

        if (isFinder) {
          // 定位图案使用eyeStyle
          drawFinderModule(ctx, x, y, moduleSize, eyeStyle);
        } else {
          // 数据码点使用dotStyle
          drawDataModule(ctx, x, y, moduleSize, dotStyle);
        }

        ctx.restore();
      }
    }
  }

  // 4. 叠加Logo
  if (logoUrl) {
    try {
      const logoSize = qrSize * 0.20; // 20%大小，H级容错允许30%
      const logoX = (qrSize - logoSize) / 2;
      const logoY = (qrSize - logoSize) / 2;

      // 白底圆形保护背景
      ctx.save();
      ctx.beginPath();
      ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.restore();

      // 绘制Logo
      const logo = await loadImage(logoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      // 绘制圆形边框
      ctx.save();
      ctx.beginPath();
      ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } catch (e) {
      console.error('Logo load error:', e);
    }
  }

  // 5. 底部文字
  if (hasBorder && borderText) {
    ctx.font = 'bold 32px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillStyle = colors[0];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(borderText, size / 2, size + 40);
  }

  return canvas.toBuffer('image/png');
}

// 绘制数据码点
function drawDataModule(ctx, x, y, size, style) {
  const padding = size * 0.1;
  const drawSize = size - padding * 2;

  switch (style) {
    case 'rounded':
      roundRect(ctx, x + padding, y + padding, drawSize, drawSize, drawSize * 0.3);
      ctx.fill();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, drawSize / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + padding);
      ctx.lineTo(x + size - padding, y + size / 2);
      ctx.lineTo(x + size / 2, y + size - padding);
      ctx.lineTo(x + padding, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'leaf':
      ctx.beginPath();
      ctx.ellipse(x + size / 2, y + size / 2, drawSize / 2, drawSize / 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    default: // square
      ctx.fillRect(x + padding, y + padding, drawSize, drawSize);
  }
}

// 绘制定位图案
function drawFinderModule(ctx, x, y, size, style) {
  const padding = size * 0.05;

  if (style === 'circle') {
    // 外圆
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - padding, 0, Math.PI * 2);
    ctx.fill();
    // 内圆白
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // 中心圆
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 6, 0, Math.PI * 2);
    ctx.fillStyle = ctx.fillStyle; // 恢复颜色
    ctx.fill();
  } else if (style === 'rounded') {
    roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, size * 0.2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x + size * 0.25, y + size * 0.25, size * 0.5, size * 0.5, size * 0.15);
    ctx.fill();
    ctx.fillStyle = ctx.fillStyle;
    roundRect(ctx, x + size * 0.4, y + size * 0.4, size * 0.2, size * 0.2, size * 0.1);
    ctx.fill();
  } else {
    // square - 标准定位图案
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
    ctx.fillStyle = ctx.fillStyle;
    ctx.fillRect(x + size * 0.35, y + size * 0.35, size * 0.3, size * 0.3);
  }
}

// 圆角矩形辅助函数
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 获取样式模板
router.get('/templates', (req, res) => {
  res.json(STYLE_TEMPLATES);
});

// 美化二维码接口
router.post('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = merchants.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({ error: '商户不存在' });
    }

    const {
      style = 'gradient',
      customColors,
      logoUrl,
      dotStyle,
      eyeStyle,
      hasBorder,
      borderText,
      glow,
      glowColor
    } = req.body;

    // 获取模板配置
    const template = STYLE_TEMPLATES[style] || STYLE_TEMPLATES.gradient;

    // 构建中间页URL（一码多付入口）
    const payUrl = `${BASE_URL}/pay/${merchantId}`;

    // 合并配置
    const config = {
      content: payUrl,
      style: template.type,
      colors: customColors || template.colors,
      bgColor: req.body.bgColor || template.bgColor,
      logoUrl: logoUrl || merchant.logoUrl,
      dotStyle: dotStyle || template.dotStyle,
      eyeStyle: eyeStyle || template.eyeStyle,
      hasBorder: hasBorder !== undefined ? hasBorder : template.hasBorder,
      borderText: borderText || template.borderText,
      glow: glow !== undefined ? glow : (template.glow || false),
      glowColor: glowColor || template.glowColor,
      size: 800
    };

    // 生成美化二维码
    const buffer = await generateStyledQR(config);

    // 保存文件
    const fileName = `styled_${merchantId}_${Date.now()}.png`;
    const filePath = path.join(__dirname, '../../styled-qr', fileName);
    fs.writeFileSync(filePath, buffer);

    // 更新商户记录
    const styledQrUrl = `/styled-qr/${fileName}`;
    merchants.update(merchantId, {
      styledQrPath: filePath,
      styledQrUrl,
      styleConfig: config,
      payUrl
    });

    // 转换为base64预览
    const base64 = buffer.toString('base64');

    res.json({
      success: true,
      merchantId,
      qrUrl: styledQrUrl,
      payUrl,
      preview: `data:image/png;base64,${base64}`,
      config
    });

  } catch (error) {
    console.error('Beautify error:', error);
    res.status(500).json({ error: error.message || '美化失败' });
  }
});

// 预览接口（不保存）
router.post('/preview/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = merchants.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({ error: '商户不存在' });
    }

    const config = req.body;
    const payUrl = `${BASE_URL}/pay/${merchantId}`;

    const buffer = await generateStyledQR({
      content: payUrl,
      ...config,
      size: 600 // 预览用小尺寸
    });

    const base64 = buffer.toString('base64');
    res.json({
      preview: `data:image/png;base64,${base64}`,
      config
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
