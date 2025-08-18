import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') ||
                   supabaseServiceKey.includes('demo') ||
                   !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   !process.env.DASHSCOPE_API_KEY;

// 演示模式：内存存储
const demoOrders = new Map();

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[AUTH] 演示模式：跳过 JWT 验证，接受任何 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[AUTH] Token 验证失败:', error);

    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[AUTH] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    return null;
  }
}

// 订单状态枚举
const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// 积分套餐配置
const CREDIT_PACKAGES = [
  { id: 'package_100', name: '基础套餐', credits: 100, priceYuan: 1.99, bonusCredits: 0 },
  { id: 'package_550', name: '超值套餐', credits: 550, priceYuan: 9.99, bonusCredits: 50 },
  { id: 'package_2900', name: '豪华套餐', credits: 2900, priceYuan: 49.99, bonusCredits: 400 },
  { id: 'package_6000', name: '至尊套餐', credits: 6000, priceYuan: 99.99, bonusCredits: 1000 },
];

// 生成订单ID
function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 生成幂等键
function generateIdempotencyKey(userId, packageId) {
  const timestamp = Math.floor(Date.now() / 1000); // 秒级时间戳
  return `${userId}_${packageId}_${timestamp}`;
}

// 创建订单
async function createOrder(userId, packageId, req) {
  const package_ = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!package_) {
    return { success: false, message: '套餐不存在' };
  }

  const orderId = generateOrderId();
  const order = {
    id: orderId,
    userId,
    packageId: package_.id,
    packageName: package_.name,
    credits: package_.credits,
    bonusCredits: package_.bonusCredits,
    totalCredits: package_.credits + package_.bonusCredits,
    priceYuan: package_.priceYuan,
    status: ORDER_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isDemoMode) {
    demoOrders.set(orderId, order);
    
    // 演示模式：创建支付宝支付（模拟）
    try {
      const paymentResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/payment?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || 'Bearer demo-token',
        },
        body: JSON.stringify({
          orderId,
          amount: package_.priceYuan,
          subject: `积分充值 - ${package_.name}`,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResult.success) {
        order.paymentUrl = paymentResult.paymentUrl;
        order.paymentId = paymentResult.paymentId;
        order.qrCode = paymentResult.qrCode;
        demoOrders.set(orderId, order);

        console.log(`[ORDERS API] 演示模式：支付创建成功，订单 ${orderId}`);
      } else {
        console.error(`[ORDERS API] 演示模式：支付创建失败，订单 ${orderId}:`, paymentResult.message);
      }
    } catch (error) {
      console.error(`[ORDERS API] 演示模式：创建支付失败，订单 ${orderId}:`, error);
    }

    // 演示模式：模拟支付成功（延迟3秒）
    setTimeout(async () => {
      const demoOrder = demoOrders.get(orderId);
      if (demoOrder && demoOrder.status === ORDER_STATUS.PENDING) {
        // 更新订单状态为已支付
        demoOrder.status = ORDER_STATUS.PAID;
        demoOrder.paidAt = new Date().toISOString();
        demoOrder.updatedAt = new Date().toISOString();
        demoOrders.set(orderId, demoOrder);

        // 发放积分（演示模式）
        const creditsAwarded = await awardPurchaseCredits(userId, demoOrder.totalCredits, orderId);
        if (creditsAwarded) {
          console.log(`[ORDERS API] 演示模式：订单 ${orderId} 积分发放成功`);
        } else {
          console.error(`[ORDERS API] 演示模式：订单 ${orderId} 积分发放失败`);
        }
      }
    }, 3000);
  } else {
    // 生产模式：写入 TableStore
    try {
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const idempotencyKey = generateIdempotencyKey(userId, packageId);

      const orderData = {
        userId,
        packageId: package_.id,
        packageName: package_.name,
        credits: package_.credits,
        bonusCredits: package_.bonusCredits,
        totalCredits: package_.credits + package_.bonusCredits,
        priceYuan: package_.priceYuan,
        idempotencyKey,
      };

      const createdOrder = await repo.createOrder(orderData);
      if (!createdOrder) {
        return { success: false, message: '创建订单失败' };
      }

      // 创建支付宝支付
      try {
        const paymentResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/payment?action=create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || 'Bearer demo-token',
          },
          body: JSON.stringify({
            orderId: createdOrder.orderId,
            amount: createdOrder.priceYuan,
            subject: `积分充值 - ${createdOrder.packageName}`,
          }),
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResult.success) {
          // 更新订单支付信息
          await repo.updateOrderStatus(createdOrder.orderId, 'PENDING', {
            paymentMethod: 'ALIPAY',
            paymentId: paymentResult.paymentId,
            paymentUrl: paymentResult.paymentUrl,
          });

          console.log(`[ORDERS API] 生产模式：支付创建成功，订单 ${createdOrder.orderId}`);
        } else {
          console.error(`[ORDERS API] 生产模式：支付创建失败，订单 ${createdOrder.orderId}:`, paymentResult.message);
        }
      } catch (error) {
        console.error(`[ORDERS API] 生产模式：创建支付失败，订单 ${createdOrder.orderId}:`, error);
      }

      order = {
        id: createdOrder.orderId,
        userId: createdOrder.userId,
        packageId: createdOrder.packageId,
        packageName: createdOrder.packageName,
        credits: createdOrder.credits,
        bonusCredits: createdOrder.bonusCredits,
        totalCredits: createdOrder.totalCredits,
        priceYuan: createdOrder.priceYuan,
        status: createdOrder.status,
        createdAt: new Date(createdOrder.createdAt).toISOString(),
        updatedAt: new Date(createdOrder.updatedAt).toISOString(),
      };
    } catch (error) {
      console.error('[ORDERS API] 创建订单失败:', error);
      return { success: false, message: '创建订单失败' };
    }
  }

  return {
    success: true,
    order,
    paymentInfo: {
      orderId,
      amount: package_.priceYuan,
      currency: 'CNY',
      // 演示模式返回模拟支付信息
      paymentUrl: isDemoMode ? `https://demo-payment.com/pay?order=${orderId}` : null,
    },
  };
}

// 发放购买积分（带幂等性保护）
async function awardPurchaseCredits(userId, credits, orderId) {
  try {
    if (isDemoMode) {
      // 演示模式：检查是否已经发放过积分
      const order = demoOrders.get(orderId);
      if (order && order.creditsGranted) {
        console.log(`[ORDERS API] 演示模式：订单 ${orderId} 积分已发放，跳过重复发放`);
        return true;
      }

      // 调用前端积分 API
      console.log(`[ORDERS API] 演示模式：为用户 ${userId} 发放 ${credits} 积分，订单 ${orderId}`);

      // 标记积分已发放
      if (order) {
        order.creditsGranted = true;
        demoOrders.set(orderId, order);
      }

      return true;
    } else {
      // 生产模式：检查订单状态，防止重复发放
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const order = await repo.getOrder(orderId);
      if (!order) {
        console.error(`[ORDERS API] 订单 ${orderId} 不存在`);
        return false;
      }

      if (order.creditsGranted) {
        console.log(`[ORDERS API] 订单 ${orderId} 积分已发放，跳过重复发放`);
        return true;
      }

      // 直接调用 creditsService
      const { CreditsService } = await import('../../serverless/src/creditsService.js');
      const creditsService = new CreditsService(instanceName);

      const success = await creditsService.grantPurchaseCredits(userId, credits, orderId);

      if (success) {
        // 标记积分已发放
        await repo.markCreditsGranted(orderId);
      }

      return success;
    }
  } catch (error) {
    console.error('[ORDERS API] 发放购买积分失败:', error);
    return false;
  }
}

// 取消订单
async function cancelOrder(userId, orderId) {
  if (isDemoMode) {
    const order = demoOrders.get(orderId);
    if (!order || order.userId !== userId) {
      return {
        success: false,
        message: '订单不存在或无权限操作',
      };
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return {
        success: false,
        message: '只能取消待支付的订单',
      };
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.updatedAt = new Date().toISOString();
    demoOrders.set(orderId, order);

    return {
      success: true,
      message: '订单已取消',
      order,
    };
  } else {
    // 生产模式：使用 TableStore
    try {
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const order = await repo.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return {
          success: false,
          message: '订单不存在或无权限操作',
        };
      }

      if (order.status !== 'PENDING') {
        return {
          success: false,
          message: '只能取消待支付的订单',
        };
      }

      const success = await repo.updateOrderStatus(orderId, 'CANCELLED');
      if (!success) {
        return {
          success: false,
          message: '取消订单失败',
        };
      }

      return {
        success: true,
        message: '订单已取消',
        order: {
          id: order.orderId,
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[ORDERS API] 取消订单失败:', error);
      return {
        success: false,
        message: '取消订单失败，请稍后重试',
      };
    }
  }
}

// 获取订单状态
async function getOrderStatus(userId, orderId) {
  const order = await getOrder(userId, orderId);
  if (!order) {
    return {
      success: false,
      message: '订单不存在',
    };
  }

  return {
    success: true,
    order: {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
    },
  };
}

// 处理支付通知（模拟第三方支付平台回调）
async function handlePaymentNotification(notificationData, headers) {
  try {
    const { orderId, status, paymentId, amount, timestamp } = notificationData;

    if (!orderId || !status) {
      return {
        success: false,
        message: '缺少必要参数',
      };
    }

    console.log(`[ORDERS API] 收到支付通知: 订单=${orderId}, 状态=${status}, 支付ID=${paymentId}`);

    if (isDemoMode) {
      // 演示模式：直接处理通知
      const order = demoOrders.get(orderId);
      if (!order) {
        return {
          success: false,
          message: '订单不存在',
        };
      }

      if (order.status !== ORDER_STATUS.PENDING) {
        return {
          success: true,
          message: '订单状态已更新，忽略重复通知',
        };
      }

      // 更新订单状态
      if (status === 'SUCCESS' || status === 'PAID') {
        order.status = ORDER_STATUS.PAID;
        order.paidAt = new Date().toISOString();
        order.paymentId = paymentId;
      } else if (status === 'FAILED') {
        order.status = ORDER_STATUS.FAILED;
        order.failureReason = notificationData.failureReason || '支付失败';
      }

      order.updatedAt = new Date().toISOString();
      demoOrders.set(orderId, order);

      // 如果支付成功，发放积分
      if (order.status === ORDER_STATUS.PAID) {
        const creditsAwarded = await awardPurchaseCredits(order.userId, order.totalCredits, orderId);
        if (creditsAwarded) {
          console.log(`[ORDERS API] 支付通知处理：订单 ${orderId} 积分发放成功`);
        } else {
          console.error(`[ORDERS API] 支付通知处理：订单 ${orderId} 积分发放失败`);
        }
      }

      return {
        success: true,
        message: '支付通知处理成功',
      };
    } else {
      // 生产模式：使用 TableStore
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const order = await repo.getOrder(orderId);
      if (!order) {
        return {
          success: false,
          message: '订单不存在',
        };
      }

      if (order.status !== 'PENDING') {
        return {
          success: true,
          message: '订单状态已更新，忽略重复通知',
        };
      }

      // 更新订单状态
      let newStatus;
      let updateData = {};

      if (status === 'SUCCESS' || status === 'PAID') {
        newStatus = 'PAID';
        updateData.paidAt = Date.now();
        updateData.paymentId = paymentId;
      } else if (status === 'FAILED') {
        newStatus = 'FAILED';
        updateData.failureReason = notificationData.failureReason || '支付失败';
      } else {
        return {
          success: false,
          message: '不支持的支付状态',
        };
      }

      const updateSuccess = await repo.updateOrderStatus(orderId, newStatus, updateData);
      if (!updateSuccess) {
        return {
          success: false,
          message: '更新订单状态失败',
        };
      }

      // 如果支付成功，发放积分
      if (newStatus === 'PAID') {
        const creditsAwarded = await awardPurchaseCredits(order.userId, order.totalCredits, orderId);
        if (creditsAwarded) {
          // 标记积分已发放
          await repo.markCreditsGranted(orderId);
          console.log(`[ORDERS API] 支付通知处理：订单 ${orderId} 积分发放成功`);
        } else {
          console.error(`[ORDERS API] 支付通知处理：订单 ${orderId} 积分发放失败`);
        }
      }

      // 记录支付日志
      await repo.logPaymentAction({
        orderId,
        userId: order.userId,
        action: 'NOTIFY',
        paymentId,
        requestData: JSON.stringify(notificationData),
        status: 'SUCCESS',
        processingTime: Date.now() - (timestamp || Date.now()),
        ipAddress: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
        userAgent: headers['user-agent'] || 'unknown',
      });

      return {
        success: true,
        message: '支付通知处理成功',
      };
    }
  } catch (error) {
    console.error('[ORDERS API] 处理支付通知失败:', error);
    return {
      success: false,
      message: '处理支付通知失败',
    };
  }
}

// 获取订单详情
async function getOrder(userId, orderId) {
  if (isDemoMode) {
    const order = demoOrders.get(orderId);
    if (!order || order.userId !== userId) {
      return null;
    }
    return order;
  } else {
    // 生产模式：从 TableStore 查询
    try {
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const order = await repo.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return null;
      }

      return {
        id: order.orderId,
        userId: order.userId,
        packageId: order.packageId,
        packageName: order.packageName,
        credits: order.credits,
        bonusCredits: order.bonusCredits,
        totalCredits: order.totalCredits,
        priceYuan: order.priceYuan,
        status: order.status,
        createdAt: new Date(order.createdAt).toISOString(),
        updatedAt: new Date(order.updatedAt).toISOString(),
        paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : null,
      };
    } catch (error) {
      console.error('[ORDERS API] 查询订单失败:', error);
      return null;
    }
  }
}

// 获取用户订单列表
async function getUserOrders(userId, limit = 20, offset = 0) {
  if (isDemoMode) {
    const userOrders = Array.from(demoOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);
    
    return {
      orders: userOrders,
      total: userOrders.length,
      hasMore: false,
    };
  } else {
    // 生产模式：从 TableStore 查询
    try {
      const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const repo = new OrdersRepository(instanceName);

      const orders = await repo.getUserOrders(userId, limit + 1); // 多查一个判断是否有更多
      const hasMore = orders.length > limit;
      const resultOrders = hasMore ? orders.slice(0, limit) : orders;

      return {
        orders: resultOrders.map(order => ({
          id: order.orderId,
          userId: order.userId,
          packageId: order.packageId,
          packageName: order.packageName,
          credits: order.credits,
          bonusCredits: order.bonusCredits,
          totalCredits: order.totalCredits,
          priceYuan: order.priceYuan,
          status: order.status,
          createdAt: new Date(order.createdAt).toISOString(),
          updatedAt: new Date(order.updatedAt).toISOString(),
          paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : null,
        })),
        total: resultOrders.length,
        hasMore,
      };
    } catch (error) {
      console.error('[ORDERS API] 查询订单列表失败:', error);
      return { orders: [], total: 0, hasMore: false };
    }
  }
}

export default async function handler(req, res) {
  try {
    console.log('[ORDERS API] 请求:', req.method, req.url);
    console.log('[ORDERS API] 演示模式状态:', isDemoMode);

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

    const { action } = req.query;

    switch (action) {
      case 'packages':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        return res.status(200).json({ success: true, packages: CREDIT_PACKAGES });

      case 'create':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { packageId } = req.body;
        if (!packageId) {
          return res.status(400).json({ error: 'Package ID is required' });
        }
        const createResult = await createOrder(userId, packageId, req);
        return res.status(200).json(createResult);

      case 'get':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId } = req.query;
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        const order = await getOrder(userId, orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json({ success: true, order });

      case 'list':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const ordersData = await getUserOrders(userId, limit, offset);
        return res.status(200).json({ success: true, ...ordersData });

      case 'cancel':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId: cancelOrderId } = req.body;
        if (!cancelOrderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        const cancelResult = await cancelOrder(userId, cancelOrderId);
        return res.status(200).json(cancelResult);

      case 'status':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { orderId: statusOrderId } = req.query;
        if (!statusOrderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        const statusResult = await getOrderStatus(userId, statusOrderId);
        return res.status(200).json(statusResult);

      case 'notify':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        // 支付通知回调（模拟第三方支付平台回调）
        const notifyResult = await handlePaymentNotification(req.body, req.headers);
        return res.status(200).json(notifyResult);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[ORDERS API] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
