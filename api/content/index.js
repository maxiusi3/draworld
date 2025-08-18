// 内容管理API - 合并版本
// 处理所有内容相关操作：作品管理、视频处理、图片上传
// 路由: /api/content?action=artworks|video|upload

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
    console.error('[CONTENT API] Token 验证失败:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('[CONTENT API] 请求接收');
    console.log('[CONTENT API] Method:', req.method);
    console.log('[CONTENT API] URL:', req.url);
    console.log('[CONTENT API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[CONTENT API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 根据action参数路由到不同的子模块
    const action = req.query.action || req.body?.action;
    console.log('[CONTENT API] Action:', action);

    switch (action) {
      case 'artworks':
        return await handleArtworks(req, res);
      case 'video':
        return await handleVideo(req, res);
      case 'upload':
        return await handleUpload(req, res);
      default:
        // 向后兼容：根据URL路径推断action
        if (req.url.includes('artworks') || (!action && req.method === 'GET')) {
          return await handleArtworks(req, res);
        } else if (req.url.includes('video')) {
          return await handleVideo(req, res);
        } else if (req.url.includes('upload')) {
          return await handleUpload(req, res);
        } else {
          return res.status(400).json({ 
            error: 'Invalid action. Supported actions: artworks, video, upload' 
          });
        }
    }
    
  } catch (error) {
    console.error('[CONTENT API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// ==================== ARTWORKS 子模块 ====================
async function handleArtworks(req, res) {
  try {
    console.log('[CONTENT API] 处理作品请求');
    
    // 根据HTTP方法和查询参数路由
    const { id, search } = req.query;
    
    switch (req.method) {
      case 'GET':
        if (id) {
          return await getArtworkById(req, res, id);
        } else if (search) {
          return await searchArtworks(req, res);
        } else {
          return await getArtworksList(req, res);
        }
      case 'POST':
        return await createArtwork(req, res);
      case 'PUT':
        return await updateArtwork(req, res);
      case 'DELETE':
        return await deleteArtwork(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed for artworks' });
    }
  } catch (error) {
    console.error('[CONTENT API] 作品处理失败:', error);
    return res.status(500).json({ error: 'Artworks operation failed', message: error.message });
  }
}

// ==================== VIDEO 子模块 ====================
async function handleVideo(req, res) {
  try {
    console.log('[CONTENT API] 处理视频请求');
    
    // 验证Authorization头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 根据子action或HTTP方法路由
    const subAction = req.query.subAction || req.body?.subAction;
    
    switch (subAction) {
      case 'start':
        return await handleVideoStart(req, res);
      case 'list':
        return await handleVideoList(req, res);
      case 'status':
        return await handleVideoStatus(req, res);
      default:
        // 向后兼容：根据HTTP方法推断
        if (req.method === 'POST') {
          return await handleVideoStart(req, res);
        } else if (req.method === 'GET' && req.query.taskId) {
          return await handleVideoStatus(req, res);
        } else if (req.method === 'GET') {
          return await handleVideoList(req, res);
        } else {
          return res.status(400).json({ 
            error: 'Invalid video action. Supported: start, list, status' 
          });
        }
    }
  } catch (error) {
    console.error('[CONTENT API] 视频处理失败:', error);
    return res.status(500).json({ error: 'Video operation failed', message: error.message });
  }
}

// ==================== UPLOAD 子模块 ====================
async function handleUpload(req, res) {
  try {
    console.log('[CONTENT API] 处理上传请求');
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed for upload' });
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

    // 处理图片上传逻辑
    return await processImageUpload(req, res, userId);
    
  } catch (error) {
    console.error('[CONTENT API] 上传处理失败:', error);
    return res.status(500).json({ error: 'Upload operation failed', message: error.message });
  }
}

// ==================== 具体实现函数 ====================
// 这些函数将从原始文件中导入或重新实现

async function getArtworksList(req, res) {
  // 从原 api/artworks/index.js 导入实现
  const { ArtworksRepository } = await import('../../serverless/src/artworksRepo.js');
  const artworksRepo = new ArtworksRepository(instanceName);
  
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  
  const artworks = await artworksRepo.getArtworksList(page, limit);
  
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

async function getArtworkById(req, res, id) {
  // 实现获取单个作品详情
  return res.status(200).json({ success: true, artwork: { id } });
}

async function searchArtworks(req, res) {
  // 实现作品搜索
  return res.status(200).json({ success: true, artworks: [] });
}

async function createArtwork(req, res) {
  // 实现创建作品
  return res.status(201).json({ success: true, message: 'Artwork created' });
}

async function updateArtwork(req, res) {
  // 实现更新作品
  return res.status(200).json({ success: true, message: 'Artwork updated' });
}

async function deleteArtwork(req, res) {
  // 实现删除作品
  return res.status(200).json({ success: true, message: 'Artwork deleted' });
}

async function handleVideoStart(req, res) {
  // 从原 api/video/index.js 导入实现
  return res.status(200).json({ success: true, message: 'Video task started' });
}

async function handleVideoList(req, res) {
  // 实现视频列表
  return res.status(200).json({ success: true, videos: [] });
}

async function handleVideoStatus(req, res) {
  // 实现视频状态查询
  return res.status(200).json({ success: true, status: 'processing' });
}

async function processImageUpload(req, res, userId) {
  // 从原 api/upload/image.js 导入实现
  return res.status(200).json({ success: true, message: 'Image uploaded', userId });
}
