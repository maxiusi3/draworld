// 合并的Admin API - 处理管理员相关的所有操作
// 支持: moderation (内容审核), payment-monitor (支付监控)

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

// 管理员用户ID列表（演示模式）
const DEMO_ADMIN_USERS = ['demo-user', 'admin-user'];

// 创建 Supabase 客户端
const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    console.log('[ADMIN API] 请求接收');
    console.log('[ADMIN API] Method:', req.method);
    console.log('[ADMIN API] URL:', req.url);
    console.log('[ADMIN API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[ADMIN API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 检查管理员权限
    if (!checkAdminPermission(userId)) {
      return res.status(403).json({ error: 'Admin permission required' });
    }

    // 根据查询参数或请求体中的action来路由
    const action = req.query.action || req.body?.action;
    
    console.log('[ADMIN API] Action:', action, 'UserId:', userId);

    switch (action) {
      case 'moderation':
        return await handleModeration(req, res, userId);
      case 'payment-monitor':
        return await handlePaymentMonitor(req, res, userId);
      default:
        return res.status(400).json({ 
          error: 'Invalid request. Please specify action parameter (moderation or payment-monitor).' 
        });
    }
    
  } catch (error) {
    console.error('[ADMIN API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[ADMIN AUTH] 演示模式：跳过 JWT 验证');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[ADMIN AUTH] Token 验证失败:', error);

    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[ADMIN AUTH] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    return null;
  }
}

// 检查管理员权限
function checkAdminPermission(userId) {
  if (isDemoMode) {
    return DEMO_ADMIN_USERS.includes(userId) || userId.startsWith('user-');
  }
  
  // 生产模式：检查真实的管理员权限
  return false;
}

// 处理内容审核
async function handleModeration(req, res, userId) {
  try {
    console.log('[MODERATION] 内容审核请求，管理员ID:', userId);

    const { action: subAction } = req.query;

    switch (subAction) {
      case 'list':
        return await getModerationList(req, res);
      case 'approve':
        return await approveContent(req, res);
      case 'reject':
        return await rejectContent(req, res);
      default:
        return await getModerationList(req, res);
    }

  } catch (error) {
    console.error('[MODERATION] 内容审核失败:', error);
    return res.status(500).json({ 
      error: 'Moderation failed',
      message: error.message
    });
  }
}

// 处理支付监控
async function handlePaymentMonitor(req, res, userId) {
  try {
    console.log('[PAYMENT MONITOR] 支付监控请求，管理员ID:', userId);

    const { action: subAction } = req.query;

    switch (subAction) {
      case 'stats':
        return await getPaymentStats(req, res);
      case 'transactions':
        return await getPaymentTransactions(req, res);
      case 'alerts':
        return await getPaymentAlerts(req, res);
      default:
        return await getPaymentStats(req, res);
    }

  } catch (error) {
    console.error('[PAYMENT MONITOR] 支付监控失败:', error);
    return res.status(500).json({ 
      error: 'Payment monitor failed',
      message: error.message
    });
  }
}

// 获取审核列表
async function getModerationList(req, res) {
  if (isDemoMode) {
    const mockData = [
      {
        id: 'content-1',
        type: 'video',
        userId: 'user-123',
        status: 'pending',
        createdAt: new Date().toISOString(),
        content: '用户上传的视频内容'
      },
      {
        id: 'content-2',
        type: 'image',
        userId: 'user-456',
        status: 'pending',
        createdAt: new Date().toISOString(),
        content: '用户上传的图片内容'
      }
    ];

    return res.status(200).json({
      success: true,
      data: mockData,
      total: mockData.length
    });
  }

  // 真实模式：从数据库查询
  const { data, error } = await supabase
    .from('content_moderation')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data: data,
    total: data.length
  });
}

// 批准内容
async function approveContent(req, res) {
  const { contentId } = req.body;

  if (!contentId) {
    return res.status(400).json({ error: 'Content ID is required' });
  }

  if (isDemoMode) {
    return res.status(200).json({
      success: true,
      message: '内容已批准（演示模式）',
      contentId: contentId
    });
  }

  // 真实模式：更新数据库
  const { data, error } = await supabase
    .from('content_moderation')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', contentId)
    .select();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    message: '内容已批准',
    data: data[0]
  });
}

// 拒绝内容
async function rejectContent(req, res) {
  const { contentId, reason } = req.body;

  if (!contentId) {
    return res.status(400).json({ error: 'Content ID is required' });
  }

  if (isDemoMode) {
    return res.status(200).json({
      success: true,
      message: '内容已拒绝（演示模式）',
      contentId: contentId,
      reason: reason
    });
  }

  // 真实模式：更新数据库
  const { data, error } = await supabase
    .from('content_moderation')
    .update({ 
      status: 'rejected', 
      rejection_reason: reason,
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', contentId)
    .select();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    message: '内容已拒绝',
    data: data[0]
  });
}

// 获取支付统计
async function getPaymentStats(req, res) {
  if (isDemoMode) {
    const mockStats = {
      totalRevenue: 12580.50,
      todayRevenue: 458.30,
      totalTransactions: 1247,
      todayTransactions: 23,
      successRate: 98.5,
      averageAmount: 10.09
    };

    return res.status(200).json({
      success: true,
      stats: mockStats
    });
  }

  // 真实模式：从数据库查询统计数据
  // 这里需要实现真实的统计查询逻辑
  return res.status(200).json({
    success: true,
    stats: {
      totalRevenue: 0,
      todayRevenue: 0,
      totalTransactions: 0,
      todayTransactions: 0,
      successRate: 0,
      averageAmount: 0
    }
  });
}

// 获取支付交易记录
async function getPaymentTransactions(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (isDemoMode) {
    const mockTransactions = [
      {
        id: 'tx-1',
        orderId: 'order-123',
        amount: 9.99,
        status: 'success',
        paymentMethod: 'alipay',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-2',
        orderId: 'order-124',
        amount: 19.99,
        status: 'success',
        paymentMethod: 'wechat',
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      transactions: mockTransactions,
      pagination: {
        page: page,
        limit: limit,
        total: mockTransactions.length,
        totalPages: 1
      }
    });
  }

  // 真实模式：从数据库查询交易记录
  return res.status(200).json({
    success: true,
    transactions: [],
    pagination: {
      page: page,
      limit: limit,
      total: 0,
      totalPages: 0
    }
  });
}

// 获取支付警报
async function getPaymentAlerts(req, res) {
  if (isDemoMode) {
    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'high_failure_rate',
        message: '支付失败率过高',
        severity: 'warning',
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      alerts: mockAlerts
    });
  }

  // 真实模式：从数据库查询警报
  return res.status(200).json({
    success: true,
    alerts: []
  });
}
