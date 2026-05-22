const express = require('express');
const router = express.Router();
const { orders, merchants, refunds } = require('../models/db');

// 获取商户订单列表
router.get('/merchant/:merchantId', async (req, res) => {
  const { merchantId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  const merchant = merchants.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: '商户不存在' });

  let query = { merchantId };
  if (status) query.status = status;

  const allOrders = orders.find(query);
  const start = (page - 1) * limit;
  const paginated = allOrders.slice(start, start + parseInt(limit));

  res.json({
    total: allOrders.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginated
  });
});

// 申请退款（用户端）
router.post('/refund/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  const { reason } = req.body;

  const order = orders.findOne({ orderNo });
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const merchant = merchants.findById(order.merchantId);

  // 检查商户是否允许退款
  if (!merchant.allowRefund) {
    return res.status(403).json({ 
      error: '该商户不支持退款，如有疑问请联系商户',
      refundPolicy: 'disabled'
    });
  }

  // 检查订单状态
  if (order.status !== 'paid') {
    return res.status(400).json({ error: '订单未支付或已退款' });
  }

  // 创建退款申请
  const refund = refunds.create({
    orderNo,
    merchantId: order.merchantId,
    amount: order.amount,
    reason: reason || '用户申请退款',
    status: 'pending', // pending / approved / rejected / completed
    requestedAt: new Date().toISOString()
  });

  // 更新订单状态
  orders.update(order.id, {
    status: 'refund_pending',
    refundId: refund.id
  });

  res.json({
    success: true,
    refundId: refund.id,
    status: 'pending',
    message: '退款申请已提交，等待商户处理'
  });
});

// 商户处理退款（后台）
router.post('/refund/handle/:refundId', async (req, res) => {
  const { refundId } = req.params;
  const { action, rejectReason } = req.body; // action: 'approve' | 'reject'

  const refund = refunds.findById(refundId);
  if (!refund) return res.status(404).json({ error: '退款记录不存在' });

  if (refund.status !== 'pending') {
    return res.status(400).json({ error: '退款已处理' });
  }

  const order = orders.findOne({ orderNo: refund.orderNo });

  if (action === 'approve') {
    // 同意退款 - 仅标记状态，实际退款需商户手动操作
    refunds.update(refundId, {
      status: 'approved',
      approvedAt: new Date().toISOString()
    });

    orders.update(order.id, {
      status: 'refund_approved'
    });

    res.json({
      success: true,
      status: 'approved',
      message: '退款已同意，请手动完成转账退款',
      orderNo: refund.orderNo,
      amount: refund.amount
    });

  } else if (action === 'reject') {
    // 拒绝退款
    refunds.update(refundId, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectReason: rejectReason || '商户拒绝退款'
    });

    orders.update(order.id, {
      status: 'paid', // 恢复为已支付
      refundId: null
    });

    res.json({
      success: true,
      status: 'rejected',
      message: '退款已拒绝'
    });
  } else {
    res.status(400).json({ error: '无效的操作' });
  }
});

// 获取退款列表（商户后台）
router.get('/refunds/:merchantId', async (req, res) => {
  const { merchantId } = req.params;
  const { status } = req.query;

  const merchant = merchants.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: '商户不存在' });

  let query = { merchantId };
  if (status) query.status = status;

  const refundList = refunds.find(query);

  res.json({
    total: refundList.length,
    data: refundList
  });
});

// 获取订单统计
router.get('/stats/:merchantId', async (req, res) => {
  const { merchantId } = req.params;

  const merchantOrders = orders.find({ merchantId });

  const stats = {
    totalOrders: merchantOrders.length,
    totalAmount: merchantOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
    paidOrders: merchantOrders.filter(o => o.status === 'paid').length,
    paidAmount: merchantOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0),
    pendingRefunds: merchantOrders.filter(o => o.status === 'refund_pending').length,
    todayOrders: merchantOrders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }).length
  };

  res.json(stats);
});

module.exports = router;
