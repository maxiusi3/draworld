// 测试支付通知的模拟端点
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, action = 'pay' } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`[TEST PAYMENT] 模拟支付操作: ${action} for order ${orderId}`);

    // 模拟支付通知数据
    let notificationData;
    
    switch (action) {
      case 'pay':
        notificationData = {
          orderId,
          status: 'SUCCESS',
          paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: 9.99, // 模拟金额
          timestamp: Date.now(),
          paymentMethod: 'ALIPAY',
        };
        break;
        
      case 'fail':
        notificationData = {
          orderId,
          status: 'FAILED',
          failureReason: '余额不足',
          timestamp: Date.now(),
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action. Use "pay" or "fail"' });
    }

    // 调用订单API的支付通知处理
    const notifyResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/orders?action=notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': req.headers['x-forwarded-for'] || '127.0.0.1',
        'user-agent': req.headers['user-agent'] || 'test-payment-simulator',
      },
      body: JSON.stringify(notificationData),
    });

    const notifyResult = await notifyResponse.json();

    return res.status(200).json({
      success: true,
      message: `模拟${action === 'pay' ? '支付成功' : '支付失败'}通知已发送`,
      notificationData,
      notifyResult,
    });

  } catch (error) {
    console.error('[TEST PAYMENT] 模拟支付失败:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
