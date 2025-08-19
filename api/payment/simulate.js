// 语言: JavaScript
// 说明: 模拟支付接口，用于测试支付流程

// 不需要导入JWT库，使用简单的解析方式

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[SIMULATE PAYMENT] 收到模拟支付请求:', req.method, req.url);

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: '仅支持POST请求'
      });
    }

    // 验证用户身份（可选，用于测试时跳过）
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // 简化的JWT解析，仅用于测试
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
        console.log('[SIMULATE PAYMENT] 用户身份验证成功:', userId);
      } catch (error) {
        console.log('[SIMULATE PAYMENT] 用户身份验证失败，使用匿名模式');
      }
    }

    // 解析请求参数
    const { 
      orderId, 
      paymentId, 
      paymentMethod = 'ALIPAY',
      simulateResult = 'SUCCESS', // SUCCESS, FAILED, TIMEOUT
      delaySeconds = 2 // 模拟支付延迟
    } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：orderId 或 paymentId'
      });
    }

    console.log('[SIMULATE PAYMENT] 模拟支付参数:', {
      orderId,
      paymentId,
      paymentMethod,
      simulateResult,
      delaySeconds
    });

    // 模拟支付处理延迟
    if (delaySeconds > 0) {
      console.log(`[SIMULATE PAYMENT] 模拟支付延迟 ${delaySeconds} 秒...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }

    // 准备回调数据
    const callbackData = {
      orderId,
      paymentId,
      paymentMethod,
      status: simulateResult,
      timestamp: Date.now(),
      signature: 'mock_signature_' + Math.random().toString(36).substr(2, 9)
    };

    // 调用支付回调接口
    const callbackUrl = `${req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000'}/api/payment/callback`;
    
    console.log('[SIMULATE PAYMENT] 调用支付回调接口:', callbackUrl);
    
    try {
      const callbackResponse = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callbackData)
      });

      const callbackResult = await callbackResponse.json();
      
      console.log('[SIMULATE PAYMENT] 回调接口响应:', callbackResult);

      return res.status(200).json({
        success: true,
        message: '模拟支付完成',
        simulateResult,
        callbackResult,
        paymentData: {
          orderId,
          paymentId,
          paymentMethod,
          status: simulateResult,
          processedAt: new Date().toISOString()
        }
      });

    } catch (callbackError) {
      console.error('[SIMULATE PAYMENT] 调用回调接口失败:', callbackError);
      
      return res.status(500).json({
        success: false,
        message: '模拟支付失败：回调接口调用失败',
        error: callbackError.message,
        paymentData: {
          orderId,
          paymentId,
          paymentMethod,
          status: 'CALLBACK_FAILED',
          processedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('[SIMULATE PAYMENT] 模拟支付失败:', error);
    return res.status(500).json({
      success: false,
      message: '模拟支付失败',
      error: error.message
    });
  }
}
