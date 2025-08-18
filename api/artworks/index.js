// 作品API - 纯生产环境版本
// 处理创意广场的作品列表、详情、搜索等功能

import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// 生产环境配置 - 无演示模式
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // 构建查询
    let query = supabase
      .from('artworks')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        tags,
        category,
        likes_count,
        views_count,
        created_at,
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'published'); // 只显示已发布的作品

    // 添加分类过滤
    if (category) {
      query = query.eq('category', category);
    }

    // 添加标签过滤
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        query = query.overlaps('tags', tagArray);
      }
    }

    // 添加排序
    switch (sortBy) {
      case 'LATEST':
        query = query.order('created_at', { ascending: false });
        break;
      case 'POPULAR':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'VIEWS':
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // 添加分页
    const startIndex = (page - 1) * limit;
    query = query.range(startIndex, startIndex + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[ARTWORKS] 查询作品列表失败:', error);
      throw error;
    }

    console.log(`[ARTWORKS] 成功获取 ${data?.length || 0} 个作品`);

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page: page,
        limit: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: startIndex + limit < (count || 0),
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
      .select(`
        *,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
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

    const { data, error, count } = await supabase
      .from('artworks')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        video_url,
        tags,
        category,
        likes_count,
        views_count,
        created_at,
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + limit - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page: page,
        limit: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
