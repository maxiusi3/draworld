// 用户管理API - 合并版本
// 处理所有用户相关操作：认证调试、用户作品管理
// 路由: /api/user?action=auth-debug|artworks

import { jwtVerify, createRemoteJWKSet } from 'jose';

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';

// 创建 JWKS 客户端
const jwks = createRemoteJWKSet(new URL(OIDC_JWKS_URI));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    console.log('[USER API] 开始验证JWT token');

    // 解析token header和payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[USER API] Token格式无效');
      return null;
    }

    const tokenHeader = JSON.parse(atob(parts[0]));
    const tokenPayload = JSON.parse(atob(parts[1]));

    console.log('[USER API] Token算法:', tokenHeader.alg);

    // 检查token是否过期
    if (Date.now() > tokenPayload.exp * 1000) {
      console.error('[USER API] Token已过期');
      return null;
    }

    // 检查issuer和audience
    if (tokenPayload.iss !== OIDC_ISSUER || tokenPayload.aud !== OIDC_AUDIENCE) {
      console.error('[USER API] Token issuer或audience不匹配');
      return null;
    }

    // 根据算法选择验证方式
    if (tokenHeader.alg === 'HS256') {
      console.log('[USER API] 使用HS256验证');
      return tokenPayload.sub;
    } else if (tokenHeader.alg === 'RS256') {
      console.log('[USER API] 使用RS256验证');
      const { payload } = await jwtVerify(token, jwks, {
        issuer: OIDC_ISSUER,
        audience: OIDC_AUDIENCE,
      });
      return payload.sub;
    } else {
      console.error('[USER API] 不支持的算法:', tokenHeader.alg);
      return null;
    }
  } catch (error) {
    console.error('[USER API] Token 验证失败:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('[USER API] 请求接收');
    console.log('[USER API] Method:', req.method);
    console.log('[USER API] URL:', req.url);
    console.log('[USER API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[USER API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 根据action参数路由到不同的子模块
    const action = req.query.action || req.body?.action;
    console.log('[USER API] Action:', action);

    switch (action) {
      case 'auth-debug':
        return await handleAuthDebug(req, res);
      case 'artworks':
        return await handleUserArtworks(req, res);
      default:
        // 向后兼容：根据URL路径推断action
        if (req.url.includes('auth-debug')) {
          return await handleAuthDebug(req, res);
        } else if (req.url.includes('artworks') || req.url.includes('me')) {
          return await handleUserArtworks(req, res);
        } else {
          return res.status(400).json({ 
            error: 'Invalid action. Supported actions: auth-debug, artworks' 
          });
        }
    }
    
  } catch (error) {
    console.error('[USER API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// ==================== AUTH DEBUG 子模块 ====================
async function handleAuthDebug(req, res) {
  try {
    console.log('[USER API] 处理认证调试请求');
    
    // 检查Authorization header
    const authHeader = req.headers.authorization;
    console.log('[USER API] Authorization header:', authHeader ? 'present' : 'missing');

    if (!authHeader) {
      return res.status(400).json({
        error: 'Missing authorization header',
        debug: {
          headers: req.headers,
          expectedFormat: 'Bearer <token>'
        }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: 'Invalid authorization header format',
        debug: {
          received: authHeader.substring(0, 20) + '...',
          expectedFormat: 'Bearer <token>'
        }
      });
    }

    const token = authHeader.substring(7);
    console.log('[USER API] Token extracted, length:', token.length);
    console.log('[USER API] Token preview:', token.substring(0, 50) + '...');

    // 解析token结构（不验证签名）
    let tokenStructure = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        tokenStructure = {
          header,
          payload: {
            iss: payload.iss,
            aud: payload.aud,
            sub: payload.sub,
            exp: payload.exp,
            iat: payload.iat,
            phone_number: payload.phone_number,
            email: payload.email,
            name: payload.name
          },
          isExpired: Date.now() > payload.exp * 1000,
          expiresAt: new Date(payload.exp * 1000).toISOString()
        };
      }
    } catch (parseError) {
      console.error('[USER API] Token parsing error:', parseError);
      tokenStructure = { error: parseError.message };
    }

    // 验证配置
    const config = {
      OIDC_JWKS_URI,
      OIDC_ISSUER,
      OIDC_AUDIENCE,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AUTHING_OIDC_ISSUER: process.env.AUTHING_OIDC_ISSUER,
        AUTHING_OIDC_AUDIENCE: process.env.AUTHING_OIDC_AUDIENCE
      }
    };

    console.log('[USER API] Configuration:', config);

    // 尝试验证JWT
    let verificationResult = null;
    try {
      console.log('[USER API] 开始验证JWT token');
      console.log('[USER API] 使用issuer:', OIDC_ISSUER);
      console.log('[USER API] 使用audience:', OIDC_AUDIENCE);

      const { payload } = await jwtVerify(token, jwks, {
        issuer: OIDC_ISSUER,
        audience: OIDC_AUDIENCE,
      });

      console.log('[USER API] JWT验证成功');
      console.log('[USER API] Payload:', JSON.stringify(payload, null, 2));

      verificationResult = {
        success: true,
        payload: {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
          phone_number: payload.phone_number,
          email: payload.email,
          name: payload.name
        }
      };

    } catch (verifyError) {
      console.error('[USER API] JWT验证失败:', verifyError);
      verificationResult = {
        success: false,
        error: verifyError.message,
        code: verifyError.code,
        claim: verifyError.claim
      };
    }

    // 测试JWKS端点可访问性
    let jwksTest = null;
    try {
      const jwksResponse = await fetch(OIDC_JWKS_URI);
      jwksTest = {
        accessible: jwksResponse.ok,
        status: jwksResponse.status,
        statusText: jwksResponse.statusText
      };
      
      if (jwksResponse.ok) {
        const jwksData = await jwksResponse.json();
        jwksTest.keysCount = jwksData.keys ? jwksData.keys.length : 0;
      }
    } catch (jwksError) {
      jwksTest = {
        accessible: false,
        error: jwksError.message
      };
    }

    return res.status(200).json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        config,
        tokenStructure,
        verificationResult,
        jwksTest,
        summary: {
          tokenPresent: !!token,
          tokenValid: verificationResult?.success || false,
          jwksAccessible: jwksTest?.accessible || false,
          configurationOk: !!(OIDC_ISSUER && OIDC_AUDIENCE && OIDC_JWKS_URI)
        }
      }
    });

  } catch (error) {
    console.error('[USER API] 认证调试失败:', error);
    return res.status(500).json({ error: 'Auth debug failed', message: error.message });
  }
}

// ==================== USER ARTWORKS 子模块 ====================
async function handleUserArtworks(req, res) {
  try {
    console.log('[USER API] 处理用户作品请求');
    
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

    // 根据HTTP方法处理不同操作
    switch (req.method) {
      case 'GET':
        return await getUserArtworks(req, res, userId);
      case 'POST':
        return await createUserArtwork(req, res, userId);
      case 'PUT':
        return await updateUserArtwork(req, res, userId);
      case 'DELETE':
        return await deleteUserArtwork(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[USER API] 用户作品处理失败:', error);
    return res.status(500).json({ error: 'User artworks operation failed', message: error.message });
  }
}

// ==================== 具体实现函数 ====================

async function getUserArtworks(req, res, userId) {
  // 实现获取用户作品列表
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  // 这里应该从数据库获取用户作品
  const artworks = []; // 临时空数组
  
  return res.status(200).json({
    success: true,
    artworks: artworks,
    pagination: {
      page: page,
      limit: limit,
      total: artworks.length,
      totalPages: Math.ceil(artworks.length / limit),
      hasNext: artworks.length === limit,
      hasPrev: page > 1
    }
  });
}

async function createUserArtwork(req, res, userId) {
  // 实现创建用户作品
  return res.status(201).json({ success: true, message: 'User artwork created', userId });
}

async function updateUserArtwork(req, res, userId) {
  // 实现更新用户作品
  return res.status(200).json({ success: true, message: 'User artwork updated', userId });
}

async function deleteUserArtwork(req, res, userId) {
  // 实现删除用户作品
  return res.status(200).json({ success: true, message: 'User artwork deleted', userId });
}
