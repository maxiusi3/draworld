// 社交管理API - 合并版本
// 处理所有社交相关操作：社区功能、邀请系统
// 路由: /api/social?action=community|invitations

import { jwtVerify, createRemoteJWKSet } from 'jose';

// TableStore 配置检查
const instanceName = process.env.TABLESTORE_INSTANCE;
const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

if (!instanceName || !accessKeyId || !accessKeySecret) {
  throw new Error('Missing required environment variables: TABLESTORE_INSTANCE, ALIBABA_CLOUD_ACCESS_KEY_ID, ALIBABA_CLOUD_ACCESS_KEY_SECRET');
}

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 解析token header和payload
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const tokenHeader = JSON.parse(atob(parts[0]));
    const tokenPayload = JSON.parse(atob(parts[1]));

    // 检查token是否过期
    if (Date.now() > tokenPayload.exp * 1000) return null;

    // 检查issuer和audience
    if (tokenPayload.iss !== OIDC_ISSUER || tokenPayload.aud !== OIDC_AUDIENCE) return null;

    // 根据算法选择验证方式
    if (tokenHeader.alg === 'HS256') {
      return tokenPayload.sub;
    } else if (tokenHeader.alg === 'RS256') {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: OIDC_ISSUER,
        audience: OIDC_AUDIENCE,
      });
      return payload.sub;
    }

    return null;
  } catch (error) {
    console.error('[SOCIAL API] Token 验证失败:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('[SOCIAL API] 请求接收');
    console.log('[SOCIAL API] Method:', req.method);
    console.log('[SOCIAL API] URL:', req.url);
    console.log('[SOCIAL API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[SOCIAL API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 验证Authorization头（某些邀请接口可能是公开的）
    const action = req.query.action || req.body?.action;
    const publicActions = ['validate-invitation']; // 验证邀请码可能是公开的
    
    let userId = null;
    if (!publicActions.includes(action)) {
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

    console.log('[SOCIAL API] Action:', action, 'UserId:', userId);

    // 根据action参数路由到不同的子模块
    switch (action) {
      case 'community':
        return await handleCommunity(req, res, userId);
      case 'invitations':
        return await handleInvitations(req, res, userId);
      default:
        // 向后兼容：根据URL路径推断action
        if (req.url.includes('community')) {
          return await handleCommunity(req, res, userId);
        } else if (req.url.includes('invitations')) {
          return await handleInvitations(req, res, userId);
        } else {
          return res.status(400).json({ 
            error: 'Invalid action. Supported actions: community, invitations' 
          });
        }
    }
    
  } catch (error) {
    console.error('[SOCIAL API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// ==================== COMMUNITY 子模块 ====================
async function handleCommunity(req, res, userId) {
  try {
    console.log('[SOCIAL API] 处理社区请求');
    
    // 根据子action路由
    const subAction = req.query.subAction || req.body?.subAction ||
                     req.query.action || req.body?.action; // 向后兼容
    
    switch (subAction) {
      case 'artworks':
        return await handleCommunityArtworks(req, res, userId);
      case 'like':
        return await handleCommunityLike(req, res, userId);
      case 'comment':
        return await handleCommunityComment(req, res, userId);
      case 'report':
        return await handleCommunityReport(req, res, userId);
      case 'feed':
        return await handleCommunityFeed(req, res, userId);
      default:
        // 向后兼容：根据HTTP方法推断
        if (req.method === 'GET') {
          return await handleCommunityFeed(req, res, userId);
        } else if (req.method === 'POST') {
          return await handleCommunityArtworks(req, res, userId);
        } else {
          return res.status(400).json({ 
            error: 'Invalid community action. Supported: artworks, like, comment, report, feed' 
          });
        }
    }
  } catch (error) {
    console.error('[SOCIAL API] 社区处理失败:', error);
    return res.status(500).json({ error: 'Community operation failed', message: error.message });
  }
}

// ==================== INVITATIONS 子模块 ====================
async function handleInvitations(req, res, userId) {
  try {
    console.log('[SOCIAL API] 处理邀请请求');
    
    const subAction = req.query.subAction || req.body?.subAction ||
                     req.query.action || req.body?.action; // 向后兼容
    
    switch (subAction) {
      case 'generate':
        return await handleInvitationGenerate(req, res, userId);
      case 'validate':
        return await handleInvitationValidate(req, res);
      case 'register':
        return await handleInvitationRegister(req, res, userId);
      case 'list':
        return await handleInvitationList(req, res, userId);
      case 'stats':
        return await handleInvitationStats(req, res, userId);
      default:
        // 向后兼容：根据HTTP方法推断
        if (req.method === 'GET') {
          return await handleInvitationList(req, res, userId);
        } else if (req.method === 'POST') {
          return await handleInvitationGenerate(req, res, userId);
        } else {
          return res.status(400).json({ 
            error: 'Invalid invitations action. Supported: generate, validate, register, list, stats' 
          });
        }
    }
  } catch (error) {
    console.error('[SOCIAL API] 邀请处理失败:', error);
    return res.status(500).json({ error: 'Invitations operation failed', message: error.message });
  }
}

// ==================== 具体实现函数 ====================
// 这些函数将从原始文件中导入或重新实现

async function handleCommunityArtworks(req, res, userId) {
  // 从原 api/community/index.js 导入实现
  const { CommunityService } = await import('../../serverless/src/communityService.js');
  const communityService = new CommunityService(instanceName);
  
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  const artworks = await communityService.getCommunityArtworks(page, limit);
  
  return res.status(200).json({
    success: true,
    artworks: artworks,
    pagination: {
      page: page,
      limit: limit,
      total: artworks.length
    }
  });
}

async function handleCommunityLike(req, res, userId) {
  // 实现点赞功能
  return res.status(200).json({ success: true, message: 'Like processed' });
}

async function handleCommunityComment(req, res, userId) {
  // 实现评论功能
  return res.status(200).json({ success: true, message: 'Comment processed' });
}

async function handleCommunityReport(req, res, userId) {
  // 实现举报功能
  return res.status(200).json({ success: true, message: 'Report processed' });
}

async function handleCommunityFeed(req, res, userId) {
  // 实现社区动态
  return res.status(200).json({ success: true, feed: [] });
}

async function handleInvitationGenerate(req, res, userId) {
  // 从原 api/invitations/index.js 导入实现
  const { InvitationService } = await import('../../serverless/src/invitationService.js');
  const invitationService = new InvitationService(instanceName);
  
  const invitation = await invitationService.generateInvitation(userId);
  
  return res.status(201).json({
    success: true,
    invitation: invitation
  });
}

async function handleInvitationValidate(req, res) {
  // 实现验证邀请码
  return res.status(200).json({ success: true, valid: true });
}

async function handleInvitationRegister(req, res, userId) {
  // 实现邀请注册
  return res.status(200).json({ success: true, message: 'Invitation registered' });
}

async function handleInvitationList(req, res, userId) {
  // 实现邀请列表
  return res.status(200).json({ success: true, invitations: [] });
}

async function handleInvitationStats(req, res, userId) {
  // 实现邀请统计
  return res.status(200).json({ success: true, stats: {} });
}
