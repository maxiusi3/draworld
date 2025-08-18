// Orders API - 处理订单相关的所有操作
// 支持: packages (获取套餐), create (创建订单), list (订单列表), status (订单状态)

import { jwtVerify, createRemoteJWKSet } from 'jose';

// TableStore 配置检查
const instanceName = process.env.TABLESTORE_INSTANCE;
const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

if (!instanceName || !accessKeyId || !accessKeySecret) {
  throw new Error('Missing required environment variables: TABLESTORE_INSTANCE, ALIBABA_CLOUD_ACCESS_KEY_ID, ALIBABA_CLOUD_ACCESS_KEY_SECRET');
}

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';

// 创建 JWKS 客户端
const jwks = createRemoteJWKSet(new URL(OIDC_JWKS_URI));

// 积分套餐配置
const CREDIT_PACKAGES = [
  {
    id: 'basic',
    name: '基础套餐',
    credits: 100,
    bonusCredits: 0,
    totalCredits: 100,
    price: 9.9,
    currency: 'CNY',
    description: '适合偶尔使用的用户',
    popular: false
  },
  {
    id: 'standard',
    name: '标准套餐',
    credits: 300,
    bonusCredits: 50,
    totalCredits: 350,
    price: 29.9,
    currency: 'CNY',
    description: '最受欢迎的选择',
    popular: true
  },
  {
    id: 'premium',
    name: '高级套餐',
    credits: 600,
    bonusCredits: 150,
    totalCredits: 750,
    price: 59.9,
    currency: 'CNY',
    description: '适合重度用户',
    popular: false
  },
  {
    id: 'enterprise',
    name: '企业套餐',
    credits: 1500,
    bonusCredits: 500,
    totalCredits: 2000,
    price: 149.9,
    currency: 'CNY',
    description: '企业级用户首选',
    popular: false
  }
];

export default async function handler(req, res) {
  try {
    console.log('[ORDERS API] 请求:', req.method, req.url);

    // 验证用户身份（除了获取套餐列表）
    const action = req.query.action || req.body?.action;
    let userId = null;

    if (action !== 'packages') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);
      userId = await verifyToken(token);

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    console.log('[ORDERS API] Action:', action, 'UserId:', userId);

    switch (action) {
      case 'packages':
        return await handlePackages(req, res);
      case 'create':
        return await handleCreateOrder(req, res, userId);
      case 'list':
        return await handleOrderList(req, res, userId);
      case 'status':
        return await handleOrderStatus(req, res, userId);
      default:
        // 如果没有指定action，根据HTTP方法推断
        if (req.method === 'GET') {
          return await handleOrderList(req, res, userId);
        } else if (req.method === 'POST') {
          return await handleCreateOrder(req, res, userId);
        } else {
          return res.status(400).json({ 
            error: 'Invalid request. Please specify action parameter.' 
          });
        }
    }
    
  } catch (error) {
    console.error('[ORDERS API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    console.log('[ORDERS AUTH] 开始验证JWT token');

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });

    console.log('[ORDERS AUTH] JWT验证成功，用户ID:', payload.sub);
    return payload.sub;
  } catch (error) {
    console.error('[ORDERS AUTH] JWT验证失败:', error);
    return null;
  }
}

// 处理获取套餐列表
async function handlePackages(req, res) {
  try {
    console.log('[ORDERS] 获取积分套餐列表');

    return res.status(200).json({
      success: true,
      packages: CREDIT_PACKAGES
    });

  } catch (error) {
    console.error('[ORDERS] 获取套餐列表失败:', error);
    return res.status(500).json({
      error: 'Failed to get packages',
      message: error.message
    });
  }
}

// 处理创建订单
async function handleCreateOrder(req, res, userId) {
  try {
    console.log('[ORDERS] 创建订单，用户ID:', userId);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { packageId, paymentMethod } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Missing packageId' });
    }

    // 查找套餐
    const package_ = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!package_) {
      return res.status(400).json({ error: 'Invalid packageId' });
    }

    // 使用 TableStore OrdersRepository
    const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
    const ordersRepo = new OrdersRepository(instanceName);

    // 创建订单数据
    const orderData = {
      userId: userId,
      packageId: packageId,
      packageName: package_.name,
      credits: package_.credits,
      bonusCredits: package_.bonusCredits,
      totalCredits: package_.totalCredits,
      priceYuan: package_.price,
      paymentMethod: paymentMethod || 'ALIPAY',
      idempotencyKey: `${userId}_${packageId}_${Date.now()}`
    };

    // 保存到 TableStore
    const order = await ordersRepo.createOrder(orderData);

    if (!order) {
      throw new Error('Failed to create order in TableStore');
    }

    // 生成支付信息（模拟）
    const paymentInfo = {
      paymentId: `pay_${Date.now()}`,
      paymentUrl: `https://example.com/pay/${order.orderId}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      expiredAt: new Date(order.expiredAt).toISOString()
    };

    return res.status(201).json({
      success: true,
      order: {
        id: order.orderId,
        user_id: order.userId,
        package_id: order.packageId,
        package_name: order.packageName,
        credits: order.credits,
        bonus_credits: order.bonusCredits,
        total_credits: order.totalCredits,
        price: order.priceYuan,
        currency: order.currency,
        status: order.status,
        payment_method: order.paymentMethod,
        created_at: new Date(order.createdAt).toISOString(),
        updated_at: new Date(order.updatedAt).toISOString()
      },
      paymentInfo: paymentInfo,
      message: '订单创建成功'
    });

  } catch (error) {
    console.error('[ORDERS] 创建订单失败:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
}

// 处理订单列表查询
async function handleOrderList(req, res, userId) {
  try {
    console.log('[ORDERS] 查询订单列表，用户ID:', userId);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // 使用 TableStore OrdersRepository
    const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
    const ordersRepo = new OrdersRepository(instanceName);

    // 从 TableStore 查询用户订单
    const orders = await ordersRepo.getUserOrders(userId, limit);

    // 转换为API响应格式
    const formattedOrders = orders.map(order => ({
      id: order.orderId,
      user_id: order.userId,
      package_id: order.packageId,
      package_name: order.packageName,
      credits: order.credits,
      bonus_credits: order.bonusCredits,
      total_credits: order.totalCredits,
      price: order.priceYuan,
      currency: order.currency,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_id: order.paymentId,
      created_at: new Date(order.createdAt).toISOString(),
      updated_at: new Date(order.updatedAt).toISOString(),
      paid_at: order.paidAt ? new Date(order.paidAt).toISOString() : null,
      expired_at: order.expiredAt ? new Date(order.expiredAt).toISOString() : null
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        page: page,
        limit: limit,
        total: formattedOrders.length,
        totalPages: Math.ceil(formattedOrders.length / limit),
        hasNext: formattedOrders.length === limit,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('[ORDERS] 查询订单列表失败:', error);
    return res.status(500).json({
      error: 'Failed to get order list',
      message: error.message
    });
  }
}

// 处理订单状态查询
async function handleOrderStatus(req, res, userId) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    console.log('[ORDERS] 查询订单状态，订单ID:', orderId, '用户ID:', userId);

    // 使用 TableStore OrdersRepository
    const { OrdersRepository } = await import('../../serverless/src/ordersRepo.js');
    const ordersRepo = new OrdersRepository(instanceName);

    // 从 TableStore 查询订单
    const order = await ordersRepo.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 验证订单属于当前用户
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 转换为API响应格式
    const formattedOrder = {
      id: order.orderId,
      user_id: order.userId,
      package_id: order.packageId,
      package_name: order.packageName,
      credits: order.credits,
      bonus_credits: order.bonusCredits,
      total_credits: order.totalCredits,
      price: order.priceYuan,
      currency: order.currency,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_id: order.paymentId,
      created_at: new Date(order.createdAt).toISOString(),
      updated_at: new Date(order.updatedAt).toISOString(),
      paid_at: order.paidAt ? new Date(order.paidAt).toISOString() : null,
      expired_at: order.expiredAt ? new Date(order.expiredAt).toISOString() : null
    };

    return res.status(200).json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('[ORDERS] 查询订单状态失败:', error);
    return res.status(500).json({
      error: 'Failed to get order status',
      message: error.message
    });
  }
}
