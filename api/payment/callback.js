// 语言: JavaScript
// 说明: 支付回调API接口，模拟微信/支付宝的异步通知处理

import { verifyJWT } from '../../lib/auth.js';

// 环境变量配置
const instanceName = process.env.TABLESTORE_INSTANCE_NAME || 'whimsy-brush-dev';
const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[PAYMENT CALLBACK] 收到支付回调请求:', req.method, req.url);
    console.log('[PAYMENT CALLBACK] 请求体:', req.body);

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: '仅支持POST请求'
      });
    }

    // 解析回调参数
    const { 
      orderId, 
      paymentId, 
      paymentMethod = 'ALIPAY',
      status = 'SUCCESS',
      amount,
      timestamp = Date.now(),
      signature = 'mock_signature' // 模拟签名
    } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：orderId 或 paymentId'
      });
    }

    console.log('[PAYMENT CALLBACK] 处理支付回调:', {
      orderId,
      paymentId,
      paymentMethod,
      status,
      amount
    });

    // 导入必要的服务
    const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
    const { CreditsService } = await import('../../serverless/src/creditsService.js');

    const ordersRepo = new OrdersRepository(instanceName);
    const creditsService = new CreditsService(instanceName);

    // 获取订单信息
    const order = await ordersRepo.getOrder(orderId);
    if (!order) {
      console.error('[PAYMENT CALLBACK] 订单不存在:', orderId);
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证支付ID匹配
    if (order.paymentId !== paymentId) {
      console.error('[PAYMENT CALLBACK] 支付ID不匹配:', {
        orderPaymentId: order.paymentId,
        callbackPaymentId: paymentId
      });
      return res.status(400).json({
        success: false,
        message: '支付ID不匹配'
      });
    }

    // 检查订单状态，避免重复处理
    if (order.status !== 'PENDING') {
      console.log('[PAYMENT CALLBACK] 订单状态非待支付，跳过处理:', order.status);
      return res.status(200).json({
        success: true,
        message: '订单已处理',
        status: order.status
      });
    }

    // 处理支付结果
    if (status === 'SUCCESS') {
      console.log('[PAYMENT CALLBACK] 处理支付成功回调');
      
      // 更新订单状态为已支付
      const updateSuccess = await ordersRepo.updateOrderStatus(
        orderId, 
        'PAID',
        {
          paymentMethod: paymentMethod.toUpperCase(),
          paidAt: timestamp
        }
      );

      if (!updateSuccess) {
        console.error('[PAYMENT CALLBACK] 更新订单状态失败');
        return res.status(500).json({
          success: false,
          message: '更新订单状态失败'
        });
      }

      // 发放积分给用户
      const creditsGranted = await creditsService.grantPurchaseCredits(
        order.userId,
        order.totalCredits,
        orderId
      );

      if (!creditsGranted) {
        console.error('[PAYMENT CALLBACK] 积分发放失败');
        // 即使积分发放失败，也不回滚订单状态，而是记录错误
        await ordersRepo.updateOrderStatus(orderId, 'PAID', {
          failureReason: '积分发放失败，请联系客服'
        });
      } else {
        // 标记积分已发放
        await ordersRepo.markCreditsGranted(orderId);
        console.log('[PAYMENT CALLBACK] 积分发放成功:', order.totalCredits);
      }

      // 记录支付日志
      await recordPaymentLog(ordersRepo, {
        orderId,
        userId: order.userId,
        action: 'NOTIFY',
        paymentMethod: paymentMethod.toUpperCase(),
        paymentId,
        requestData: JSON.stringify(req.body),
        responseData: JSON.stringify({ success: true, creditsGranted }),
        status: 'SUCCESS',
        processingTime: Date.now() - timestamp,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      console.log('[PAYMENT CALLBACK] 支付成功处理完成');
      
      return res.status(200).json({
        success: true,
        message: '支付成功',
        orderId,
        creditsGranted,
        totalCredits: order.totalCredits
      });

    } else {
      console.log('[PAYMENT CALLBACK] 处理支付失败回调');
      
      // 更新订单状态为支付失败
      await ordersRepo.updateOrderStatus(
        orderId, 
        'FAILED',
        {
          failureReason: `支付失败: ${status}`
        }
      );

      // 记录支付日志
      await recordPaymentLog(ordersRepo, {
        orderId,
        userId: order.userId,
        action: 'NOTIFY',
        paymentMethod: paymentMethod.toUpperCase(),
        paymentId,
        requestData: JSON.stringify(req.body),
        responseData: JSON.stringify({ success: false, reason: status }),
        status: 'FAILED',
        errorMessage: `支付失败: ${status}`,
        processingTime: Date.now() - timestamp,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      console.log('[PAYMENT CALLBACK] 支付失败处理完成');
      
      return res.status(200).json({
        success: true,
        message: '支付失败已记录',
        orderId,
        status: 'FAILED'
      });
    }

  } catch (error) {
    console.error('[PAYMENT CALLBACK] 处理支付回调失败:', error);
    return res.status(500).json({
      success: false,
      message: '处理支付回调失败',
      error: error.message
    });
  }
}

// 记录支付日志的辅助函数
async function recordPaymentLog(ordersRepo, logData) {
  try {
    // 这里可以调用 ordersRepo 的日志记录方法
    // 由于当前 ordersRepo 没有日志记录方法，我们先简单记录到控制台
    console.log('[PAYMENT LOG]', JSON.stringify(logData, null, 2));
    return true;
  } catch (error) {
    console.error('[PAYMENT LOG] 记录支付日志失败:', error);
    return false;
  }
}
