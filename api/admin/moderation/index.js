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

// 管理员用户ID列表（演示模式）
const DEMO_ADMIN_USERS = ['demo-user', 'admin-user'];

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[ADMIN AUTH] 演示模式：跳过 JWT 验证，接受任何 token');
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
    // 演示模式：允许特定用户或所有用户
    return DEMO_ADMIN_USERS.includes(userId) || userId.startsWith('user-');
  }
  
  // 生产模式：检查真实的管理员权限
  // 这里应该查询数据库或配置文件
  return false;
}

// 获取待审核内容列表
async function getModerationItems(filters = {}) {
  const { status = 'all', type = 'all', search = '', limit = 50, offset = 0 } = filters;

  if (isDemoMode) {
    // 演示模式：返回模拟数据
    const mockItems = [
      {
        id: '1',
        type: 'artwork',
        title: '美丽的风景视频',
        content: '这是一个关于自然风景的视频作品，展示了大自然的美丽景色。',
        author: '用户123',
        authorId: 'user123',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reportCount: 2,
        reportReasons: ['不当内容', '版权问题'],
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Landscape',
        videoUrl: 'https://example.com/video1.mp4',
      },
      {
        id: '2',
        type: 'comment',
        title: '评论内容',
        content: '这个视频真的很棒，我很喜欢！感谢分享这么好的内容。',
        author: '用户456',
        authorId: 'user456',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        reportCount: 1,
        reportReasons: ['垃圾信息'],
        artworkId: '1',
      },
      {
        id: '3',
        type: 'artwork',
        title: '创意动画作品',
        content: '使用AI生成的创意动画，展示了未来科技的可能性。',
        author: '创作者789',
        authorId: 'user789',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        reportCount: 0,
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Animation',
        videoUrl: 'https://example.com/video3.mp4',
      },
      {
        id: '4',
        type: 'artwork',
        title: '不当内容示例',
        content: '这是一个包含不当内容的示例',
        author: '违规用户',
        authorId: 'user999',
        status: 'REJECTED',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        reportCount: 5,
        reportReasons: ['不当内容', '违反社区规定', '垃圾信息'],
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Rejected',
      },
    ];

    // 应用筛选条件
    let filteredItems = mockItems;

    if (status !== 'all') {
      filteredItems = filteredItems.filter(item =>
        item.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (type !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.author.toLowerCase().includes(searchLower)
      );
    }

    // 分页
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      hasMore: offset + limit < total,
    };
  } else {
    // 生产模式：从 TableStore 查询
    try {
      const { ModerationRepository } = await import('../../../serverless/src/moderationRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const moderationRepo = new ModerationRepository(instanceName);

      // 获取待审核内容
      const contentType = type === 'all' ? undefined : type.toUpperCase();
      let items = await moderationRepo.getPendingModerationItems(contentType, limit * 2); // 获取更多以便过滤

      // 应用状态筛选
      if (status !== 'all') {
        items = items.filter(item => item.status.toLowerCase() === status.toLowerCase());
      }

      // 应用搜索筛选
      if (search) {
        const searchLower = search.toLowerCase();
        items = items.filter(item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower) ||
          item.author.toLowerCase().includes(searchLower)
        );
      }

      // 分页
      const total = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('[ADMIN MODERATION] 生产模式查询失败:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
      };
    }
  }
}

// 更新内容审核状态
async function updateModerationStatus(itemId, itemType, status, reason = '', moderatorId = 'admin', moderatorName = '管理员') {
  if (isDemoMode) {
    // 演示模式：模拟更新
    console.log(`[ADMIN MODERATION] 演示模式：更新 ${itemType} ${itemId} 状态为 ${status}`);
    if (reason) {
      console.log(`[ADMIN MODERATION] 拒绝原因: ${reason}`);
    }
    return { success: true };
  } else {
    // 生产模式：更新 TableStore
    try {
      const { ModerationRepository } = await import('../../../serverless/src/moderationRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const moderationRepo = new ModerationRepository(instanceName);

      // 更新内容审核状态
      const success = await moderationRepo.updateContentModerationStatus(
        itemType.toUpperCase(),
        itemId,
        status.toUpperCase(),
        moderatorId,
        moderatorName,
        reason
      );

      if (success) {
        // 创建审核记录
        await moderationRepo.createModerationRecord({
          contentType: itemType.toUpperCase(),
          contentId: itemId,
          contentTitle: `${itemType} ${itemId}`,
          contentBody: reason || '',
          authorId: 'unknown',
          authorName: '未知用户',
          moderatorId,
          moderatorName,
          action: status.toUpperCase(),
          previousStatus: 'PENDING',
          newStatus: status.toUpperCase(),
          reason,
          reportCount: 0,
          autoModerated: false,
          processingTime: Date.now(),
        });

        return { success: true };
      } else {
        return { success: false, message: '更新失败' };
      }
    } catch (error) {
      console.error('[ADMIN MODERATION] 生产模式更新失败:', error);
      return { success: false, message: '更新失败' };
    }
  }
}

// 获取审核统计信息
async function getModerationStats() {
  if (isDemoMode) {
    return {
      pending: 2,
      approved: 1,
      rejected: 1,
      total: 4,
      todayProcessed: 3,
      avgProcessingTime: 120000, // 2分钟
    };
  } else {
    // 生产模式：从 TableStore 统计
    try {
      const { ModerationRepository } = await import('../../../serverless/src/moderationRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const moderationRepo = new ModerationRepository(instanceName);

      const stats = await moderationRepo.getModerationStats();
      return stats;
    } catch (error) {
      console.error('[ADMIN MODERATION] 获取统计信息失败:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        todayProcessed: 0,
        avgProcessingTime: 0,
      };
    }
  }
}

// 创建举报
async function createContentReport(reportData, reporterId, reporterName) {
  if (isDemoMode) {
    // 演示模式：模拟创建举报
    console.log(`[ADMIN MODERATION] 演示模式：创建举报`, reportData);
    return { success: true, reportId: `demo_report_${Date.now()}` };
  } else {
    // 生产模式：创建举报记录
    try {
      const { ModerationRepository } = await import('../../../serverless/src/moderationRepo.js');
      const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
      const moderationRepo = new ModerationRepository(instanceName);

      const reportId = await moderationRepo.createContentReport({
        contentType: reportData.contentType.toUpperCase(),
        contentId: reportData.contentId,
        reporterId,
        reporterName,
        reason: reportData.reason.toUpperCase(),
        description: reportData.description || '',
        ipAddress: reportData.ipAddress,
        userAgent: reportData.userAgent,
      });

      if (reportId) {
        return { success: true, reportId };
      } else {
        return { success: false, message: '创建举报失败' };
      }
    } catch (error) {
      console.error('[ADMIN MODERATION] 创建举报失败:', error);
      return { success: false, message: '创建举报失败' };
    }
  }
}

// 获取举报列表
async function getReportsList(filters = {}) {
  const { status = 'all', limit = 50, offset = 0 } = filters;

  if (isDemoMode) {
    // 演示模式：返回模拟举报数据
    const mockReports = [
      {
        id: 'report_1',
        contentType: 'artwork',
        contentId: '1',
        contentTitle: '美丽的风景视频',
        reporterId: 'user456',
        reporterName: '用户456',
        reason: 'INAPPROPRIATE',
        description: '内容不当，包含敏感信息',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'report_2',
        contentType: 'comment',
        contentId: '2',
        contentTitle: '评论内容',
        reporterId: 'user789',
        reporterName: '用户789',
        reason: 'SPAM',
        description: '垃圾评论，重复发送',
        status: 'REVIEWED',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        reviewerName: '管理员',
        reviewNote: '已处理',
      },
    ];

    // 应用筛选
    let filteredReports = mockReports;
    if (status !== 'all') {
      filteredReports = filteredReports.filter(report =>
        report.status.toLowerCase() === status.toLowerCase()
      );
    }

    // 分页
    const total = filteredReports.length;
    const paginatedReports = filteredReports.slice(offset, offset + limit);

    return {
      reports: paginatedReports,
      total,
      hasMore: offset + limit < total,
    };
  } else {
    // 生产模式：从 TableStore 查询举报
    // 这里需要实现举报查询逻辑
    return {
      reports: [],
      total: 0,
      hasMore: false,
    };
  }
}

export default async function handler(req, res) {
  try {
    console.log('[ADMIN MODERATION] 请求:', req.method, req.url);
    console.log('[ADMIN MODERATION] 演示模式状态:', isDemoMode);

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
      case 'list':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const filters = {
          status: req.query.status || 'all',
          type: req.query.type || 'all',
          search: req.query.search || '',
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0,
        };
        
        const result = await getModerationItems(filters);
        return res.status(200).json({ success: true, ...result });

      case 'update':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const { itemId, itemType, status, reason } = req.body;
        if (!itemId || !itemType || !status) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const updateResult = await updateModerationStatus(itemId, itemType, status, reason);
        return res.status(200).json(updateResult);

      case 'stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const stats = await getModerationStats();
        return res.status(200).json({ success: true, stats });

      case 'report':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { contentType, contentId, reason: reportReason, description } = req.body;
        if (!contentType || !contentId || !reportReason) {
          return res.status(400).json({ error: 'Missing required parameters' });
        }

        const reportResult = await createContentReport(
          {
            contentType,
            contentId,
            reason: reportReason,
            description,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
          },
          userId,
          `用户${userId.slice(-8)}`
        );

        return res.status(200).json(reportResult);

      case 'reports':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const reportFilters = {
          status: req.query.status || 'all',
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0,
        };

        const reportsResult = await getReportsList(reportFilters);
        return res.status(200).json({ success: true, ...reportsResult });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[ADMIN MODERATION] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
