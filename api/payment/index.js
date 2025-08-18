import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { paymentSecurity } from '../../serverless/src/paymentSecurity.js';

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo') || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '676a0e3c6c9a2b2d8e9c4c5e';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[PAYMENT AUTH] 演示模式：跳过 JWT 验证，接受任何 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[PAYMENT AUTH] Token 验证失败:', error);

    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[PAYMENT AUTH] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    return null;
  }
}

// 创建支付宝支付
async function createAlipayPayment(orderId, amount, subject, userId) {
  if (isDemoMode) {
    // 演示模式：返回模拟支付信息
    console.log(`[PAYMENT] 演示模式：创建支付宝支付 订单=${orderId} 金额=${amount}`);
    
    return {
      success: true,
      paymentMethod: 'ALIPAY',
      paymentId: `alipay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      qrCode: `https://qr.alipay.com/mock_${orderId}`,
      paymentUrl: `https://openapi.alipaydev.com/gateway.do?mock_order=${orderId}`,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟后过期
    };
  } else {
    // 生产模式：使用真实支付宝API
    try {
      const { AlipayService, AlipayConfigFactory, AlipayUtils } = await import('../../serverless/src/alipayService.js');
      
      const config = AlipayConfigFactory.createConfig(process.env.NODE_ENV);
      const alipayService = new AlipayService(config);

      const request = {
        outTradeNo: orderId,
        totalAmount: AlipayUtils.formatAmount(amount),
        subject: subject,
        body: `用户${userId}的积分充值订单`,
        timeoutExpress: '30m',
        productCode: 'QUICK_WAP_WAY', // 手机网站支付
        passbackParams: JSON.stringify({ userId, orderId }),
      };

      const response = await alipayService.createTrade(request);
      
      if (response.code === '10000') {
        return {
          success: true,
          paymentMethod: 'ALIPAY',
          paymentId: response.tradeNo,
          qrCode: response.qrCode,
          paymentUrl: `${config.gatewayUrl}?${new URLSearchParams(request).toString()}`,
          expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
      } else {
        return {
          success: false,
          message: response.msg || '创建支付失败',
          code: response.code,
        };
      }
    } catch (error) {
      console.error('[PAYMENT] 生产模式创建支付宝支付失败:', error);
      return {
        success: false,
        message: '创建支付失败，请稍后重试',
      };
    }
  }
}

// 查询支付状态
async function queryPaymentStatus(orderId, paymentId) {
  if (isDemoMode) {
    // 演示模式：模拟支付状态查询
    console.log(`[PAYMENT] 演示模式：查询支付状态 订单=${orderId} 支付ID=${paymentId}`);
    
    // 模拟随机支付状态
    const statuses = ['WAIT_BUYER_PAY', 'TRADE_SUCCESS', 'TRADE_CLOSED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      success: true,
      orderId,
      paymentId,
      status: randomStatus,
      paidAmount: randomStatus === 'TRADE_SUCCESS' ? '9.99' : null,
      paidTime: randomStatus === 'TRADE_SUCCESS' ? new Date().toISOString() : null,
    };
  } else {
    // 生产模式：查询真实支付状态
    try {
      const { AlipayService, AlipayConfigFactory } = await import('../../serverless/src/alipayService.js');
      
      const config = AlipayConfigFactory.createConfig(process.env.NODE_ENV);
      const alipayService = new AlipayService(config);

      const response = await alipayService.queryTrade(orderId);
      
      if (response.code === '10000') {
        return {
          success: true,
          orderId: response.outTradeNo,
          paymentId: response.tradeNo,
          status: response.tradeStatus,
          paidAmount: response.buyerPayAmount,
          paidTime: response.gmtPayment,
        };
      } else {
        return {
          success: false,
          message: response.msg || '查询支付状态失败',
        };
      }
    } catch (error) {
      console.error('[PAYMENT] 生产模式查询支付状态失败:', error);
      return {
        success: false,
        message: '查询支付状态失败，请稍后重试',
      };
    }
  }
}

// 幂等性缓存（生产环境应使用Redis）
const processedNotifications = new Map();

// 处理支付宝回调通知
async function handleAlipayNotify(notifyData, headers) {
  try {
    console.log('[PAYMENT] 收到支付宝回调通知:', notifyData);

    const { out_trade_no, trade_status, total_amount, trade_no, notify_id } = notifyData;

    if (!out_trade_no || !trade_status) {
      return { success: false, message: '缺少必要参数' };
    }

    // 安全检查：IP白名单验证
    const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'] || headers['remote-addr'] || 'unknown';
    if (!paymentSecurity.verifyIPWhitelist(clientIP)) {
      console.error('[PAYMENT] IP白名单验证失败:', clientIP);
      return { success: false, message: 'IP not allowed' };
    }

    // 安全检查：频率限制
    if (!paymentSecurity.checkRateLimit(clientIP, 50, 60000)) {
      console.error('[PAYMENT] 频率限制触发:', clientIP);
      return { success: false, message: 'Rate limit exceeded' };
    }

    // 幂等性检查：使用 notify_id 或 trade_no + trade_status 组合
    const idempotencyKey = notify_id || `${trade_no}_${trade_status}`;
    if (processedNotifications.has(idempotencyKey)) {
      console.log('[PAYMENT] 重复通知，已处理过:', idempotencyKey);
      return { success: true, message: 'success' };
    }

    if (isDemoMode) {
      // 演示模式：直接处理通知
      console.log('[PAYMENT] 演示模式：处理支付宝通知');
    } else {
      // 生产模式：验证签名
      const { AlipayService, AlipayConfigFactory } = await import('../../serverless/src/alipayService.js');

      const config = AlipayConfigFactory.createConfig(process.env.NODE_ENV);
      const alipayService = new AlipayService(config);

      // 验证签名
      const isValid = alipayService.verifyNotify(notifyData);
      if (!isValid) {
        console.error('[PAYMENT] 支付宝通知签名验证失败');
        return { success: false, message: 'invalid signature' };
      }
      console.log('[PAYMENT] 生产模式：签名验证成功');
    }

    // 调用订单API更新状态
    const orderNotifyData = {
      orderId: out_trade_no,
      status: trade_status === 'TRADE_SUCCESS' ? 'PAID' : 'FAILED',
      paymentId: trade_no,
      amount: total_amount,
      timestamp: Date.now(),
      notifyId: notify_id,
    };

    try {
      // 调用订单API的通知处理端点
      const orderApiUrl = `${headers.origin || 'http://localhost:3000'}/api/orders?action=notify`;
      const orderResponse = await fetch(orderApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Source': 'alipay',
        },
        body: JSON.stringify(orderNotifyData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error('[PAYMENT] 订单API调用失败:', orderResponse.status, errorData);

        // 记录失败的回调以便重试
        const failedId = paymentSecurity.recordFailedCallback(
          out_trade_no,
          notifyData,
          `订单API调用失败: ${orderResponse.status} ${JSON.stringify(errorData)}`
        );

        return { success: false, message: 'order update failed' };
      }

      const orderResult = await orderResponse.json();
      console.log('[PAYMENT] 订单状态更新成功:', orderResult);

      // 标记为已处理（幂等性）
      processedNotifications.set(idempotencyKey, {
        orderId: out_trade_no,
        processedAt: Date.now(),
        status: trade_status,
      });

      // 清理过期的幂等性记录（保留1小时）
      setTimeout(() => {
        processedNotifications.delete(idempotencyKey);
      }, 60 * 60 * 1000);

      return { success: true, message: 'success' };
    } catch (error) {
      console.error('[PAYMENT] 调用订单API失败:', error);

      // 记录失败的回调以便重试
      const failedId = paymentSecurity.recordFailedCallback(
        out_trade_no,
        notifyData,
        `订单API调用异常: ${error.message}`
      );

      return { success: false, message: 'order api error' };
    }
  } catch (error) {
    console.error('[PAYMENT] 处理支付宝回调失败:', error);
    return { success: false, message: 'internal error' };
  }
}

export default async function handler(req, res) {
  // 检查是否是测试支付请求
  const action = req.query.action || req.body?.action;

  if (action === 'test') {
    return await handleTestPayment(req, res);
  }

  // 原有的支付处理逻辑
  try {
    console.log('[PAYMENT] 请求:', req.method, req.url);
    console.log('[PAYMENT] 演示模式状态:', isDemoMode);

    const { action } = req.query;

    switch (action) {
      case 'create':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 验证用户身份
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);
        const userId = await verifyToken(token);

        if (!userId) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        const { orderId, amount, subject } = req.body;
        if (!orderId || !amount || !subject) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }

        const paymentResult = await createAlipayPayment(orderId, amount, subject, userId);
        return res.status(200).json(paymentResult);

      case 'query':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { orderId: queryOrderId, paymentId } = req.query;
        if (!queryOrderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }

        const statusResult = await queryPaymentStatus(queryOrderId, paymentId);
        return res.status(200).json(statusResult);

      case 'notify':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const notifyResult = await handleAlipayNotify(req.body, req.headers);
        
        // 支付宝要求返回 "success" 字符串
        if (notifyResult.success) {
          return res.status(200).send('success');
        } else {
          return res.status(400).send('fail');
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[PAYMENT] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 处理测试支付请求（合并自test-payment/index.js）
async function handleTestPayment(req, res) {
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
          amount: 9.99,
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
      message: `模拟支付${action === 'pay' ? '成功' : '失败'}`,
      notificationData,
      notifyResult,
    });

  } catch (error) {
    console.error('[TEST PAYMENT] 模拟支付失败:', error);
    return res.status(500).json({
      error: 'Test payment failed',
      message: error.message
    });
  }
}
