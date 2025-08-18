// 作品API - 纯生产环境版本
// 处理创意广场的作品列表、详情、搜索等功能

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

export default async function handler(req, res) {
  try {
    console.log('[ARTWORKS API] 请求接收');
    console.log('[ARTWORKS API] Method:', req.method);
    console.log('[ARTWORKS API] URL:', req.url);
    console.log('[ARTWORKS API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[ARTWORKS API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 根据HTTP方法和查询参数路由
    const { action, id } = req.query;
    
    switch (req.method) {
      case 'GET':
        if (id) {
          return await getArtworkById(req, res, id);
        } else if (action === 'search') {
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
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('[ARTWORKS API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 验证 JWT Token 并提取用户ID（可选，用于需要认证的操作）
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[ARTWORKS AUTH] JWT 验证失败:', error);
    return null;
  }
}

// 获取作品列表
async function getArtworksList(req, res) {
  try {
    console.log('[ARTWORKS] 获取作品列表');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sortBy || 'LATEST';
    const tags = req.query.tags || '';
    const category = req.query.category || '';

    // 使用 TableStore CommunityRepository
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const communityRepo = new CommunityRepository(instanceName);

    // 从 TableStore 获取公开作品列表
    const artworks = await communityRepo.getPublicArtworks(limit * 2); // 获取更多数据以支持过滤和排序

    // 转换为API响应格式
    let formattedArtworks = artworks.map(artwork => ({
      id: artwork.artworkId,
      title: artwork.title,
      description: artwork.description,
      thumbnail_url: artwork.thumbnailUrl,
      video_url: artwork.videoUrl,
      tags: artwork.tags || [],
      category: artwork.tags?.[0] || 'general', // 使用第一个标签作为分类
      likes_count: artwork.likeCount || 0,
      views_count: artwork.viewCount || 0,
      created_at: new Date(artwork.createdAt).toISOString(),
      user_id: artwork.userId
    }));

    // 添加分类过滤
    if (category) {
      formattedArtworks = formattedArtworks.filter(artwork => artwork.category === category);
    }

    // 添加标签过滤
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        formattedArtworks = formattedArtworks.filter(artwork =>
          tagArray.some(tag => artwork.tags.includes(tag))
        );
      }
    }

    // 添加排序
    switch (sortBy) {
      case 'LATEST':
        formattedArtworks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'POPULAR':
        formattedArtworks.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'VIEWS':
        formattedArtworks.sort((a, b) => b.views_count - a.views_count);
        break;
      default:
        formattedArtworks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 添加分页
    const startIndex = (page - 1) * limit;
    const paginatedArtworks = formattedArtworks.slice(startIndex, startIndex + limit);
    const totalCount = formattedArtworks.length;

    console.log(`[ARTWORKS] 成功获取 ${paginatedArtworks.length} 个作品`);

    return res.status(200).json({
      success: true,
      data: paginatedArtworks,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: startIndex + limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        sortBy,
        tags,
        category
      }
    });

  } catch (error) {
    console.error('[ARTWORKS] 获取作品列表失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get artworks list',
      message: error.message
    });
  }
}

// 根据ID获取作品详情
async function getArtworkById(req, res, artworkId) {
  try {
    console.log('[ARTWORKS] 获取作品详情:', artworkId);

    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Artwork not found' });
      }
      throw error;
    }

    // 增加浏览次数
    await supabase
      .from('artworks')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', artworkId);

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[ARTWORKS] 获取作品详情失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get artwork details',
      message: error.message
    });
  }
}

// 搜索作品
async function searchArtworks(req, res) {
  try {
    console.log('[ARTWORKS] 搜索作品');

    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    if (!query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const startIndex = (page - 1) * limit;

    // 使用 TableStore CommunityRepository
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const communityRepo = new CommunityRepository(instanceName);

    // 从 TableStore 获取所有公开作品，然后进行搜索过滤
    const allArtworks = await communityRepo.getPublicArtworks(100); // 获取更多数据用于搜索

    // 转换为API响应格式并进行搜索过滤
    const searchResults = allArtworks
      .map(artwork => ({
        id: artwork.artworkId,
        title: artwork.title,
        description: artwork.description,
        thumbnail_url: artwork.thumbnailUrl,
        video_url: artwork.videoUrl,
        tags: artwork.tags || [],
        category: artwork.tags?.[0] || 'general',
        likes_count: artwork.likeCount || 0,
        views_count: artwork.viewCount || 0,
        created_at: new Date(artwork.createdAt).toISOString(),
        user_id: artwork.userId
      }))
      .filter(artwork =>
        artwork.title.toLowerCase().includes(query.toLowerCase()) ||
        artwork.description.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 分页处理
    const paginatedResults = searchResults.slice(startIndex, startIndex + limit);
    const totalCount = searchResults.length;

    return res.status(200).json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      query: query
    });

  } catch (error) {
    console.error('[ARTWORKS] 搜索作品失败:', error);
    return res.status(500).json({ 
      error: 'Failed to search artworks',
      message: error.message
    });
  }
}

// 创建作品（需要认证）
async function createArtwork(req, res) {
  try {
    // 验证认证
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { title, description, thumbnail_url, video_url, tags, category } = req.body;

    if (!title || !thumbnail_url) {
      return res.status(400).json({ error: 'Title and thumbnail are required' });
    }

    const { data, error } = await supabase
      .from('artworks')
      .insert({
        title,
        description,
        thumbnail_url,
        video_url,
        tags: tags || [],
        category: category || 'general',
        user_id: userId,
        status: 'published',
        likes_count: 0,
        views_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[ARTWORKS] 创建作品失败:', error);
    return res.status(500).json({ 
      error: 'Failed to create artwork',
      message: error.message
    });
  }
}

// 更新作品（需要认证和权限）
async function updateArtwork(req, res) {
  try {
    // 验证认证
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    const updates = req.body;

    // 检查作品是否存在且用户有权限
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Artwork not found' });
      }
      throw fetchError;
    }

    if (artwork.user_id !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 更新作品
    const { data, error } = await supabase
      .from('artworks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[ARTWORKS] 更新作品失败:', error);
    return res.status(500).json({ 
      error: 'Failed to update artwork',
      message: error.message
    });
  }
}

// 删除作品（需要认证和权限）
async function deleteArtwork(req, res) {
  try {
    // 验证认证
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;

    // 检查作品是否存在且用户有权限
    const { data: artwork, error: fetchError } = await supabase
      .from('artworks')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Artwork not found' });
      }
      throw fetchError;
    }

    if (artwork.user_id !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 软删除作品
    const { error } = await supabase
      .from('artworks')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Artwork deleted successfully'
    });

  } catch (error) {
    console.error('[ARTWORKS] 删除作品失败:', error);
    return res.status(500).json({ 
      error: 'Failed to delete artwork',
      message: error.message
    });
  }
}
