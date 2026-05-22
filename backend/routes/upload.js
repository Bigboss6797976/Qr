const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const Jimp = require('jimp');
const router = express.Router();
const { merchants } = require('../models/db');

// 配置上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式'));
  }
});

// 解析二维码内容
async function decodeQR(imagePath) {
  try {
    const image = await Jimp.read(imagePath);
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height
    };
    
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      return {
        content: code.data,
        type: detectPayType(code.data),
        location: code.location
      };
    }
    return null;
  } catch (e) {
    console.error('QR decode error:', e);
    return null;
  }
}

// 检测支付类型
function detectPayType(content) {
  if (content.includes('qr.alipay.com') || content.includes('alipays://')) return 'alipay';
  if (content.includes('wxp://') || content.includes('weixin://') || content.includes('payapp.wechatpay.cn')) return 'wechat';
  if (content.includes('upwallet://') || content.includes('95516.com')) return 'unionpay';
  return 'unknown';
}

// 提取支付宝用户ID
function extractAlipayUserId(content) {
  // 支付宝收款码格式: https://qr.alipay.com/xxxxxx
  // 或 alipays://platformapi/startapp?saId=10000007&qrcode=xxx
  const match = content.match(/qr\.alipay\.com\/(\w+)/);
  if (match) return match[1];

  // 尝试从URL参数提取
  try {
    const url = new URL(content);
    return url.searchParams.get('userId') || url.searchParams.get('uid');
  } catch {
    return null;
  }
}

// 上传收款码接口
router.post('/', upload.single('qrImage'), async (req, res) => {
  try {
    const { merchantName, payType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '请上传收款码图片' });
    }

    // 解析二维码
    const qrData = await decodeQR(req.file.path);

    if (!qrData) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '无法识别二维码，请上传清晰的收款码图片' });
    }

    // 检测到的类型与声明的类型对比
    const detectedType = qrData.type;
    const declaredType = payType || detectedType;

    if (detectedType !== 'unknown' && detectedType !== declaredType) {
      return res.status(400).json({ 
        error: `检测到二维码类型为${detectedType}，与您选择的${declaredType}不匹配`,
        detectedType,
        declaredType
      });
    }

    // 提取关键信息
    let extraData = {};
    if (declaredType === 'alipay') {
      extraData.alipayUserId = extractAlipayUserId(qrData.content);
    }

    // 创建商户记录
    const merchant = merchants.create({
      name: merchantName || '未命名商户',
      payType: declaredType,
      rawQrPath: req.file.path,
      qrContent: qrData.content,
      detectedType,
      ...extraData,
      status: 'active',
      allowRefund: false, // 默认关闭退款
      channels: [{
        id: '1',
        type: declaredType,
        qrContent: qrData.content,
        userId: extraData.alipayUserId,
        weight: 100,
        dailyLimit: 0,
        todayAmount: 0,
        status: 'active'
      }]
    });

    res.json({
      success: true,
      merchantId: merchant.id,
      name: merchant.name,
      payType: declaredType,
      qrContent: qrData.content,
      message: '收款码上传成功，请进行美化设置'
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || '上传失败' });
  }
});

// 获取商户信息
router.get('/:merchantId', async (req, res) => {
  const merchant = merchants.findById(req.params.merchantId);
  if (!merchant) return res.status(404).json({ error: '商户不存在' });

  // 不返回敏感信息
  const { qrContent, rawQrPath, alipayUserId, ...safe } = merchant;
  res.json(safe);
});

module.exports = router;
