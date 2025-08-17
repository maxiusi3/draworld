// Vercel API路由：获取用户作品列表
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || 
                   supabaseServiceKey.includes('demo') || 
                   !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   process.env.NODE_ENV === 'development';

// 演示模式：内存存储
const demoUserArtworks = new Map();

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '676a0e3c6c9a2b2d8e9c4c5e';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[USER ARTWORKS API] 演示模式：跳过 JWT 验证');
      const userId = token.includes('new-user-token') ? 'new-user' : 
                    token.includes('demo-token') ? 'demo-user' : 
                    `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[USER ARTWORKS API] Token 验证失败:', error);
    
    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[USER ARTWORKS API] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('new-user-token') ? 'new-user' : 
                    token.includes('demo-token') ? 'demo-user' : 
                    `user-${token.slice(-8)}`;
      return userId;
    }
    
    return null;
  }
}

// 获取用户作品列表
async function getUserArtworks(userId, page = 1, limit = 20) {
  if (isDemoMode) {
    console.log('[USER ARTWORKS API] 演示模式：从内存获取用户作品');
    
    // 从内存存储获取用户作品
    const userArtworks = demoUserArtworks.get(userId) || [];
    
    // 按创建时间排序（最新的在前）
    const sortedArtworks = userArtworks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArtworks = sortedArtworks.slice(startIndex, endIndex);
    
    return {
      artworks: paginatedArtworks,
      total: userArtworks.length,
      page,
      limit,
      hasMore: endIndex < userArtworks.length
    };
  }

  // 生产模式：从 TableStore 获取
  try {
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new CommunityRepository(instanceName);

    const artworks = await repo.getUserArtworks(userId, limit, (page - 1) * limit);
    
    return {
      artworks: artworks || [],
      total: artworks ? artworks.length : 0,
      page,
      limit,
      hasMore: artworks && artworks.length === limit
    };
  } catch (error) {
    console.error('[USER ARTWORKS API] 生产模式获取用户作品失败:', error);
    throw error;
  }
}

// 添加作品到用户作品列表（演示模式）
function addArtworkToUser(userId, artwork) {
  if (!isDemoMode) return;
  
  if (!demoUserArtworks.has(userId)) {
    demoUserArtworks.set(userId, []);
  }
  
  const userArtworks = demoUserArtworks.get(userId);
  userArtworks.unshift(artwork); // 添加到开头（最新的）
  
  console.log(`[USER ARTWORKS API] 为用户 ${userId} 添加作品: ${artwork.title}`);
}

// 导出函数供其他模块使用
export { addArtworkToUser };

export default async function handler(req, res) {
  try {
    console.log('[USER ARTWORKS API] 用户作品列表请求');
    console.log('[USER ARTWORKS API] Method:', req.method);
    console.log('[USER ARTWORKS API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[USER ARTWORKS API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[USER ARTWORKS API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[USER ARTWORKS API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[USER ARTWORKS API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证token
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.log('[USER ARTWORKS API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[USER ARTWORKS API] 用户ID:', userId);

    // 获取查询参数
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 最大100条

    console.log('[USER ARTWORKS API] 分页参数:', { page, limit });

    // 获取用户作品列表
    const result = await getUserArtworks(userId, page, limit);

    console.log('[USER ARTWORKS API] 返回结果:', {
      total: result.total,
      count: result.artworks.length,
      page: result.page,
      hasMore: result.hasMore
    });

    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[USER ARTWORKS API] 获取用户作品列表失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
