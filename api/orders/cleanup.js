// 语言: JavaScript
// 说明: 订单清理和超时处理API接口

import { verifyJWT } from '../../lib/auth.js';

// 环境变量配置
const instanceName = process.env.TABLESTORE_INSTANCE_NAME || 'whimsy-brush-dev';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[ORDER CLEANUP] 开始订单清理任务');

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: '仅支持POST请求'
      });
    }

    // 验证管理员权限（可选，用于定时任务调用）
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = await verifyJWT(token);
        // 这里可以添加管理员权限检查
        isAdmin = true;
        console.log('[ORDER CLEANUP] 管理员权限验证成功');
      } catch (error) {
        console.log('[ORDER CLEANUP] 权限验证失败，使用系统调用模式');
      }
    }

    // 导入订单服务
    const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
    const ordersRepo = new OrdersRepository(instanceName);

    const now = Date.now();
    const cleanupResults = {
      expiredOrders: 0,
      failedOrders: 0,
      processedOrders: [],
      errors: []
    };

    try {
      // 获取所有待支付订单（这里需要实现一个获取所有订单的方法）
      // 由于当前 OrdersRepository 没有获取所有订单的方法，我们先模拟处理
      console.log('[ORDER CLEANUP] 开始扫描过期订单...');

      // 模拟处理逻辑 - 在实际实现中，这里应该扫描所有 PENDING 状态的订单
      const mockExpiredOrderIds = req.body.orderIds || [];
      
      for (const orderId of mockExpiredOrderIds) {
        try {
          const order = await ordersRepo.getOrder(orderId);
          
          if (!order) {
            cleanupResults.errors.push(`订单不存在: ${orderId}`);
            continue;
          }

          // 检查订单是否过期
          if (order.status === 'PENDING' && order.expiredAt && now > order.expiredAt) {
            console.log(`[ORDER CLEANUP] 处理过期订单: ${orderId}`);
            
            const success = await ordersRepo.updateOrderStatus(
              orderId, 
              'CANCELLED',
              {
                failureReason: '订单超时自动取消'
              }
            );

            if (success) {
              cleanupResults.expiredOrders++;
              cleanupResults.processedOrders.push({
                orderId,
                action: 'EXPIRED_CANCELLED',
                timestamp: now
              });
            } else {
              cleanupResults.errors.push(`取消过期订单失败: ${orderId}`);
            }
          }
          
          // 检查长时间失败的订单
          else if (order.status === 'FAILED' && order.updatedAt && (now - order.updatedAt) > 24 * 60 * 60 * 1000) {
            console.log(`[ORDER CLEANUP] 清理失败订单: ${orderId}`);
            
            // 这里可以添加失败订单的清理逻辑，比如发送通知、记录日志等
            cleanupResults.failedOrders++;
            cleanupResults.processedOrders.push({
              orderId,
              action: 'FAILED_PROCESSED',
              timestamp: now
            });
          }
        } catch (orderError) {
          console.error(`[ORDER CLEANUP] 处理订单失败 ${orderId}:`, orderError);
          cleanupResults.errors.push(`处理订单失败 ${orderId}: ${orderError.message}`);
        }
      }

      console.log('[ORDER CLEANUP] 订单清理完成:', cleanupResults);

      return res.status(200).json({
        success: true,
        message: '订单清理完成',
        results: cleanupResults,
        processedAt: new Date().toISOString()
      });

    } catch (cleanupError) {
      console.error('[ORDER CLEANUP] 订单清理过程失败:', cleanupError);
      return res.status(500).json({
        success: false,
        message: '订单清理过程失败',
        error: cleanupError.message,
        results: cleanupResults
      });
    }

  } catch (error) {
    console.error('[ORDER CLEANUP] 订单清理失败:', error);
    return res.status(500).json({
      success: false,
      message: '订单清理失败',
      error: error.message
    });
  }
}

// 辅助函数：发送用户通知
async function sendUserNotification(userId, type, data) {
  try {
    console.log(`[NOTIFICATION] 发送通知给用户 ${userId}:`, { type, data });
    
    // 这里可以集成邮件、短信、站内信等通知方式
    // 目前只记录日志
    
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] 发送通知失败:', error);
    return false;
  }
}

// 辅助函数：记录清理日志
async function recordCleanupLog(action, orderId, result, error = null) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      orderId,
      result,
      error: error?.message || null
    };
    
    console.log('[CLEANUP LOG]', JSON.stringify(logEntry));
    return true;
  } catch (logError) {
    console.error('[CLEANUP LOG] 记录日志失败:', logError);
    return false;
  }
}
