import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

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
      console.log('[REPORTS AUTH] 演示模式：跳过 JWT 验证，接受任何 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[REPORTS AUTH] Token 验证失败:', error);

    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[REPORTS AUTH] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    return null;
  }
}

// 举报原因映射
const REPORT_REASONS = {
  'spam': 'SPAM',
  'inappropriate': 'INAPPROPRIATE', 
  'copyright': 'COPYRIGHT',
  'harassment': 'HARASSMENT',
  'other': 'OTHER',
};

// 内容类型映射
const CONTENT_TYPES = {
  'artwork': 'ARTWORK',
  'comment': 'COMMENT',
};

// 创建举报
async function createReport(reportData, userId) {
  try {
    // 验证参数
    const { contentType, contentId, reason, description = '' } = reportData;
    
    if (!CONTENT_TYPES[contentType]) {
      return { success: false, message: '无效的内容类型' };
    }
    
    if (!REPORT_REASONS[reason]) {
      return { success: false, message: '无效的举报原因' };
    }

    if (isDemoMode) {
      // 演示模式：模拟创建举报
      console.log(`[REPORTS] 演示模式：用户 ${userId} 举报 ${contentType} ${contentId}，原因：${reason}`);
      
      const reportId = `demo_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        reportId,
        message: '举报已提交，我们会尽快处理',
      };
    } else {
      // 生产模式：创建真实举报
      const { ModerationRepository } = await import('../../serverless/src/moderationRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const moderationRepo = new ModerationRepository(instanceName);

      const reportId = await moderationRepo.createContentReport({
        contentType: CONTENT_TYPES[contentType],
        contentId,
        reporterId: userId,
        reporterName: `用户${userId.slice(-8)}`,
        reason: REPORT_REASONS[reason],
        description,
        ipAddress: reportData.ipAddress,
        userAgent: reportData.userAgent,
      });

      if (reportId) {
        return {
          success: true,
          reportId,
          message: '举报已提交，我们会尽快处理',
        };
      } else {
        return {
          success: false,
          message: '举报提交失败，请稍后重试',
        };
      }
    }
  } catch (error) {
    console.error('[REPORTS] 创建举报失败:', error);
    return {
      success: false,
      message: '举报提交失败，请稍后重试',
    };
  }
}

// 获取用户的举报历史
async function getUserReports(userId, limit = 20, offset = 0) {
  try {
    if (isDemoMode) {
      // 演示模式：返回模拟数据
      const mockReports = [
        {
          id: 'demo_report_1',
          contentType: 'artwork',
          contentId: 'artwork_123',
          reason: 'INAPPROPRIATE',
          description: '内容不当',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo_report_2',
          contentType: 'comment',
          contentId: 'comment_456',
          reason: 'SPAM',
          description: '垃圾评论',
          status: 'REVIEWED',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const total = mockReports.length;
      const paginatedReports = mockReports.slice(offset, offset + limit);

      return {
        success: true,
        reports: paginatedReports,
        total,
        hasMore: offset + limit < total,
      };
    } else {
      // 生产模式：查询用户举报历史
      // 这里需要实现查询逻辑
      return {
        success: true,
        reports: [],
        total: 0,
        hasMore: false,
      };
    }
  } catch (error) {
    console.error('[REPORTS] 获取用户举报历史失败:', error);
    return {
      success: false,
      message: '获取举报历史失败',
    };
  }
}

// 频率限制检查
const reportLimits = new Map(); // 简单的内存限制，生产环境应使用Redis

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimits = reportLimits.get(userId) || { count: 0, resetTime: now + 60 * 60 * 1000 }; // 1小时窗口

  // 重置计数器
  if (now > userLimits.resetTime) {
    userLimits.count = 0;
    userLimits.resetTime = now + 60 * 60 * 1000;
  }

  // 检查限制（每小时最多5次举报）
  if (userLimits.count >= 5) {
    return false;
  }

  // 增加计数
  userLimits.count++;
  reportLimits.set(userId, userLimits);
  
  return true;
}

export default async function handler(req, res) {
  try {
    console.log('[REPORTS] 请求:', req.method, req.url);
    console.log('[REPORTS] 演示模式状态:', isDemoMode);

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
      case 'create':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 频率限制检查
        if (!checkRateLimit(userId)) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            message: '举报过于频繁，请稍后再试'
          });
        }

        const { contentType, contentId, reason, description } = req.body;
        if (!contentType || !contentId || !reason) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }

        const reportData = {
          contentType,
          contentId,
          reason,
          description,
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        };

        const createResult = await createReport(reportData, userId);
        return res.status(200).json(createResult);

      case 'list':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const listResult = await getUserReports(userId, limit, offset);
        return res.status(200).json(listResult);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[REPORTS] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
