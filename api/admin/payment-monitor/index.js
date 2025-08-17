import { jwtVerify, createRemoteJWKSet } from 'jose';
import { paymentSecurity } from '../../../serverless/src/paymentSecurity.js';

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '676a0e3c6c9a2b2d8e9c4c5e';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 检查是否为演示模式
const isDemoMode = !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('demo');

// 管理员用户ID列表（演示模式）
const DEMO_ADMIN_USERS = ['demo-user', 'admin-user'];

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    if (isDemoMode) {
      console.log('[PAYMENT MONITOR] 演示模式：跳过 JWT 验证');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[PAYMENT MONITOR] Token 验证失败:', error);
    
    if (isDemoMode) {
      console.log('[PAYMENT MONITOR] 演示模式：验证失败后仍接受 token');
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

// 获取支付安全统计
async function getPaymentSecurityStats() {
  try {
    const failedCallbackStats = paymentSecurity.getFailedCallbackStats();
    
    // 模拟其他统计数据
    const stats = {
      failedCallbacks: failedCallbackStats,
      security: {
        ipWhitelistChecks: {
          total: 1250,
          blocked: 15,
          allowed: 1235,
        },
        rateLimitChecks: {
          total: 1250,
          blocked: 8,
          allowed: 1242,
        },
        signatureVerifications: {
          total: 1242,
          failed: 2,
          passed: 1240,
        },
      },
      notifications: {
        total: 1240,
        processed: 1235,
        failed: 5,
        retried: 3,
        abandoned: 2,
      },
      performance: {
        avgProcessingTime: 125, // ms
        maxProcessingTime: 850,
        minProcessingTime: 45,
      },
      alerts: [
        {
          id: 'alert_1',
          type: 'WARNING',
          message: '支付回调失败率较高',
          count: 5,
          lastOccurred: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'alert_2',
          type: 'INFO',
          message: 'IP白名单阻止了可疑请求',
          count: 15,
          lastOccurred: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
      ],
    };

    return {
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PAYMENT MONITOR] 获取统计失败:', error);
    return {
      success: false,
      message: '获取统计失败',
    };
  }
}

// 手动重试失败的回调
async function retryFailedCallbacks() {
  try {
    console.log('[PAYMENT MONITOR] 手动触发重试失败回调');
    await paymentSecurity.retryFailedCallbacks();
    
    return {
      success: true,
      message: '重试任务已执行',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PAYMENT MONITOR] 手动重试失败:', error);
    return {
      success: false,
      message: '重试失败',
      error: error.message,
    };
  }
}

// 获取安全日志
async function getSecurityLogs(filters = {}) {
  try {
    const { type = 'all', limit = 50, offset = 0 } = filters;
    
    // 模拟安全日志数据
    const mockLogs = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'IP_BLOCKED',
        severity: 'WARNING',
        message: 'IP地址不在白名单中',
        details: {
          ip: '192.168.1.100',
          userAgent: 'curl/7.68.0',
          endpoint: '/api/payment?action=notify',
        },
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        type: 'RATE_LIMIT',
        severity: 'WARNING',
        message: '频率限制触发',
        details: {
          ip: '203.119.24.15',
          requestCount: 51,
          timeWindow: '60s',
        },
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'SIGNATURE_FAILED',
        severity: 'ERROR',
        message: '签名验证失败',
        details: {
          orderId: 'order_123456',
          ip: '203.119.24.20',
          signatureLength: 344,
        },
      },
      {
        id: 'log_4',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        type: 'CALLBACK_RETRY',
        severity: 'INFO',
        message: '回调重试成功',
        details: {
          orderId: 'order_123457',
          attempt: 2,
          processingTime: 156,
        },
      },
    ];

    // 应用筛选
    let filteredLogs = mockLogs;
    if (type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }

    // 分页
    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      success: true,
      logs: paginatedLogs,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error('[PAYMENT MONITOR] 获取安全日志失败:', error);
    return {
      success: false,
      message: '获取安全日志失败',
    };
  }
}

// 清理过期数据
async function cleanupExpiredData() {
  try {
    console.log('[PAYMENT MONITOR] 执行数据清理');
    paymentSecurity.cleanup();
    
    return {
      success: true,
      message: '数据清理完成',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PAYMENT MONITOR] 数据清理失败:', error);
    return {
      success: false,
      message: '数据清理失败',
      error: error.message,
    };
  }
}

export default async function handler(req, res) {
  try {
    console.log('[PAYMENT MONITOR] 请求:', req.method, req.url);

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

    // 检查管理员权限
    if (!checkAdminPermission(userId)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { action } = req.query;

    switch (action) {
      case 'stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const statsResult = await getPaymentSecurityStats();
        return res.status(200).json(statsResult);

      case 'retry':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const retryResult = await retryFailedCallbacks();
        return res.status(200).json(retryResult);

      case 'logs':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const logFilters = {
          type: req.query.type || 'all',
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0,
        };
        
        const logsResult = await getSecurityLogs(logFilters);
        return res.status(200).json(logsResult);

      case 'cleanup':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const cleanupResult = await cleanupExpiredData();
        return res.status(200).json(cleanupResult);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[PAYMENT MONITOR] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
