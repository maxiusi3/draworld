// 社区API - 纯生产环境版本
// 处理社区相关功能：作品展示、点赞、评论、举报等

import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// 生产环境配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    console.log('[COMMUNITY API] 请求接收');
    console.log('[COMMUNITY API] Method:', req.method);
    console.log('[COMMUNITY API] URL:', req.url);
    console.log('[COMMUNITY API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[COMMUNITY API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 根据查询参数或请求体中的action来路由
    const action = req.query.action || req.body?.action;
    
    console.log('[COMMUNITY API] Action:', action);

    switch (action) {
      case 'artworks':
        return await handleArtworks(req, res);
      case 'like':
        return await handleLike(req, res);
      case 'comment':
        return await handleComment(req, res);
      case 'report':
        return await handleReport(req, res);
      default:
        // 默认返回作品列表
        return await handleArtworks(req, res);
    }
    
  } catch (error) {
    console.error('[COMMUNITY API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[COMMUNITY AUTH] Token 验证失败:', error);
    return null;
  }
}

// 处理作品相关操作
async function handleArtworks(req, res) {
  try {
    console.log('[COMMUNITY] 处理作品请求');

    if (req.method === 'GET') {
      return await getArtworksList(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[COMMUNITY] 作品处理失败:', error);
    return res.status(500).json({ 
      error: 'Failed to handle artworks',
      message: error.message
    });
  }
}

// 获取作品列表
async function getArtworksList(req, res) {
  try {
    console.log('[COMMUNITY] 获取作品列表');

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
      .eq('status', 'published');

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
      console.error('[COMMUNITY] 查询作品列表失败:', error);
      throw error;
    }

    console.log(`[COMMUNITY] 成功获取 ${data?.length || 0} 个作品`);

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
    console.error('[COMMUNITY] 获取作品列表失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get artworks list',
      message: error.message
    });
  }
}

// 处理点赞操作
async function handleLike(req, res) {
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

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { artworkId, action: likeAction } = req.body;

    if (!artworkId) {
      return res.status(400).json({ error: 'Artwork ID is required' });
    }

    if (likeAction === 'like') {
      // 添加点赞
      const { error: insertError } = await supabase
        .from('artwork_likes')
        .insert({
          artwork_id: artworkId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError && insertError.code !== '23505') { // 忽略重复插入错误
        throw insertError;
      }

      // 更新作品点赞数
      const { error: updateError } = await supabase.rpc('increment_likes', {
        artwork_id: artworkId
      });

      if (updateError) throw updateError;

    } else if (likeAction === 'unlike') {
      // 取消点赞
      const { error: deleteError } = await supabase
        .from('artwork_likes')
        .delete()
        .eq('artwork_id', artworkId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 更新作品点赞数
      const { error: updateError } = await supabase.rpc('decrement_likes', {
        artwork_id: artworkId
      });

      if (updateError) throw updateError;
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "like" or "unlike"' });
    }

    return res.status(200).json({
      success: true,
      message: likeAction === 'like' ? '点赞成功' : '取消点赞成功'
    });

  } catch (error) {
    console.error('[COMMUNITY] 点赞操作失败:', error);
    return res.status(500).json({ 
      error: 'Failed to handle like',
      message: error.message
    });
  }
}

// 处理评论操作
async function handleComment(req, res) {
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

    if (req.method === 'GET') {
      // 获取评论列表
      const { artworkId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const startIndex = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('artwork_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('artwork_id', artworkId)
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
        }
      });

    } else if (req.method === 'POST') {
      // 添加评论
      const { artworkId, content } = req.body;

      if (!artworkId || !content) {
        return res.status(400).json({ error: 'Artwork ID and content are required' });
      }

      const { data, error } = await supabase
        .from('artwork_comments')
        .insert({
          artwork_id: artworkId,
          user_id: userId,
          content: content,
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data: data
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[COMMUNITY] 评论操作失败:', error);
    return res.status(500).json({ 
      error: 'Failed to handle comment',
      message: error.message
    });
  }
}
