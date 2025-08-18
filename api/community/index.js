import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') ||
                   supabaseServiceKey.includes('demo') ||
                   !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                   !process.env.DASHSCOPE_API_KEY;

// 演示模式：内存存储
const demoArtworks = new Map();
const demoLikes = new Map();
const demoComments = new Map();
const demoReports = new Map();

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    // 演示模式：直接接受任何 token
    if (isDemoMode) {
      console.log('[AUTH] 演示模式：跳过 JWT 验证，接受任何 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[AUTH] Token 验证失败:', error);
    
    // 演示模式：如果真实验证失败，也接受任何 token
    if (isDemoMode) {
      console.log('[AUTH] 演示模式：验证失败后仍接受 token');
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }
    
    return null;
  }
}

// 敏感词检查
function checkSensitiveContent(content) {
  const sensitiveWords = [
    '政治', '敏感', '违法', '色情', '暴力', '赌博', '毒品',
    '广告', '推广', '微信', 'QQ', '电话', '联系方式'
  ];
  const lowerContent = content.toLowerCase();
  return sensitiveWords.some(word => lowerContent.includes(word.toLowerCase()));
}

// 演示模式社交奖励处理
async function processDemoSocialRewards(likerId, authorId, artworkId, newLikeCount, isLiking) {
  const result = {
    rewards: {},
    messages: [],
  };

  try {
    // 不能给自己的作品点赞获得奖励
    if (likerId === authorId) {
      return result;
    }

    if (!isLiking) {
      // 取消点赞，暂时不扣除已发放的奖励
      result.messages.push('取消点赞成功');
      return result;
    }

    // 1. 检查作品作者是否应该获得点赞奖励（每5个点赞获得1积分）
    const LIKES_PER_AUTHOR_REWARD = 5;
    if (newLikeCount > 0 && newLikeCount % LIKES_PER_AUTHOR_REWARD === 0) {
      // 调用演示模式积分API为作者加分
      await awardCreditsToUserDemo(authorId, 1, 'LIKE_RECEIVED', 'demo-token', { headers: { host: 'localhost' } });
      result.rewards.authorReward = 1;
      result.messages.push(`作品获得${LIKES_PER_AUTHOR_REWARD}个点赞，作者获得1积分奖励！`);
    }

    // 2. 检查点赞者是否应该获得点赞奖励
    const dailyLikeData = getDemoUserDailyLikes(likerId);

    if (dailyLikeData.dailyLikeGiven < 50) { // 每日上限50次
      dailyLikeData.dailyLikeGiven += 1;
      setDemoUserDailyLikes(likerId, dailyLikeData);

      // 每10次点赞获得1积分
      if (dailyLikeData.dailyLikeGiven % 10 === 0) {
        await awardCreditsToUserDemo(likerId, 1, 'LIKE_GIVEN', 'demo-token', { headers: { host: 'localhost' } });
        result.rewards.likerReward = 1;
        result.messages.push('今日点赞10次，获得1积分奖励！');
      }

      const remaining = 50 - dailyLikeData.dailyLikeGiven;
      if (remaining > 0) {
        result.messages.push(`今日还可获得奖励的点赞次数：${remaining}`);
      } else {
        result.messages.push('今日点赞奖励已达上限');
      }
    } else {
      result.messages.push('今日点赞奖励已达上限');
    }

    return result;
  } catch (error) {
    console.error('处理演示模式社交奖励失败:', error);
    result.messages.push('奖励处理失败');
    return result;
  }
}

// 演示模式每日点赞数据存储
const demoDailyLikes = new Map();

// 点赞频率限制存储（防刷机制）
const likeRateLimit = new Map();
const likeDebounce = new Map();

// 频率限制配置
const RATE_LIMIT_CONFIG = {
  LIKE_ACTION: {
    maxRequests: 30,        // 每分钟最多30次点赞操作
    windowMs: 60 * 1000,    // 1分钟窗口
  },
  SAME_ARTWORK: {
    maxRequests: 3,         // 同一作品每分钟最多3次操作（防止快速点赞取消）
    windowMs: 60 * 1000,    // 1分钟窗口
  }
};

// 去抖配置
const DEBOUNCE_CONFIG = {
  SAME_ARTWORK: 2000,       // 同一作品2秒内不能重复操作
};

// 检查频率限制
function checkLikeRateLimit(userId, artworkId) {
  const now = Date.now();

  // 检查总体点赞频率
  const globalKey = `global_${userId}`;
  const globalConfig = RATE_LIMIT_CONFIG.LIKE_ACTION;
  const globalRequests = likeRateLimit.get(globalKey) || [];

  // 清理过期请求
  const validGlobalRequests = globalRequests.filter(timestamp =>
    now - timestamp < globalConfig.windowMs
  );

  if (validGlobalRequests.length >= globalConfig.maxRequests) {
    return {
      allowed: false,
      reason: 'GLOBAL_RATE_LIMIT',
      message: `点赞操作过于频繁，请${Math.ceil(globalConfig.windowMs / 1000)}秒后再试`,
      resetTime: validGlobalRequests[0] + globalConfig.windowMs,
    };
  }

  // 检查同一作品频率
  const artworkKey = `artwork_${userId}_${artworkId}`;
  const artworkConfig = RATE_LIMIT_CONFIG.SAME_ARTWORK;
  const artworkRequests = likeRateLimit.get(artworkKey) || [];

  // 清理过期请求
  const validArtworkRequests = artworkRequests.filter(timestamp =>
    now - timestamp < artworkConfig.windowMs
  );

  if (validArtworkRequests.length >= artworkConfig.maxRequests) {
    return {
      allowed: false,
      reason: 'ARTWORK_RATE_LIMIT',
      message: '对同一作品操作过于频繁，请稍后再试',
      resetTime: validArtworkRequests[0] + artworkConfig.windowMs,
    };
  }

  // 记录本次请求
  validGlobalRequests.push(now);
  validArtworkRequests.push(now);
  likeRateLimit.set(globalKey, validGlobalRequests);
  likeRateLimit.set(artworkKey, validArtworkRequests);

  return { allowed: true };
}

// 检查去抖
function checkLikeDebounce(userId, artworkId) {
  const now = Date.now();
  const debounceKey = `${userId}_${artworkId}`;
  const lastAction = likeDebounce.get(debounceKey);

  if (lastAction && now - lastAction < DEBOUNCE_CONFIG.SAME_ARTWORK) {
    const remainingMs = DEBOUNCE_CONFIG.SAME_ARTWORK - (now - lastAction);
    return {
      allowed: false,
      message: `请等待${Math.ceil(remainingMs / 1000)}秒后再操作`,
      remainingMs,
    };
  }

  // 记录本次操作时间
  likeDebounce.set(debounceKey, now);

  return { allowed: true };
}

function getDemoUserDailyLikes(userId) {
  const today = new Date().toDateString();
  const key = `${userId}_${today}`;

  if (!demoDailyLikes.has(key)) {
    demoDailyLikes.set(key, {
      userId,
      date: today,
      dailyLikeGiven: 0,
    });
  }

  return demoDailyLikes.get(key);
}

function setDemoUserDailyLikes(userId, data) {
  const today = new Date().toDateString();
  const key = `${userId}_${today}`;
  demoDailyLikes.set(key, data);
}

// 演示模式积分发放辅助函数
async function awardCreditsToUserDemo(targetUserId, amount, reason, token, req) {
  try {
    if (!isDemoMode) return;

    // 这里可以调用前端积分API，但为了简化演示，我们直接记录日志
    console.log(`[DEMO SOCIAL REWARD] 为用户 ${targetUserId} 发放 ${amount} 积分，原因: ${reason}`);

    // 在实际实现中，这里应该调用 /api/credits/transaction
    // 但由于演示模式的限制，我们暂时只记录日志
  } catch (error) {
    console.error('[DEMO SOCIAL REWARD] 发放积分失败:', error);
  }
}

// 切换作品公开/私密状态
async function toggleArtworkVisibility(artworkId, userId, isPublic) {
  if (isDemoMode) {
    const artwork = demoArtworks.get(artworkId);
    if (!artwork) {
      return {
        success: false,
        message: '作品不存在',
      };
    }

    // 检查作品所有权
    if (artwork.user_id !== userId) {
      return {
        success: false,
        message: '无权限修改此作品',
      };
    }

    // 更新作品状态
    artwork.is_public = isPublic;
    artwork.updated_at = new Date().toISOString();
    demoArtworks.set(artworkId, artwork);

    return {
      success: true,
      isPublic,
      message: isPublic ? '作品已设为公开' : '作品已设为私密',
      artwork: {
        id: artwork.id,
        user_id: artwork.user_id,
        title: artwork.title,
        description: artwork.description,
        video_url: artwork.video_url,
        thumbnail_url: artwork.thumbnail_url,
        is_public: artwork.is_public,
        like_count: artwork.like_count,
        comment_count: artwork.comment_count,
        view_count: artwork.view_count,
        created_at: artwork.created_at,
        updated_at: artwork.updated_at,
      },
    };
  }

  // 生产模式实现：使用 TableStore
  try {
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new CommunityRepository(instanceName);

    const success = await repo.toggleArtworkVisibility(artworkId, userId, isPublic);

    if (!success) {
      return {
        success: false,
        message: '作品不存在或无权限修改',
      };
    }

    // 获取更新后的作品信息
    const artwork = await repo.getArtwork(artworkId);

    return {
      success: true,
      isPublic,
      message: isPublic ? '作品已设为公开' : '作品已设为私密',
      artwork: artwork ? {
        id: artwork.artworkId,
        user_id: artwork.userId,
        title: artwork.title,
        description: artwork.description,
        video_url: artwork.videoUrl,
        thumbnail_url: artwork.thumbnailUrl,
        is_public: artwork.isPublic,
        like_count: artwork.likeCount,
        comment_count: artwork.commentCount,
        view_count: artwork.viewCount,
        created_at: new Date(artwork.createdAt).toISOString(),
        updated_at: new Date(artwork.updatedAt).toISOString(),
      } : null,
    };
  } catch (error) {
    console.error('[COMMUNITY API] 生产模式切换作品可见性失败:', error);
    return {
      success: false,
      message: '切换失败，请稍后重试',
    };
  }
}

// 获取公开作品列表
async function getArtworks(limit = 20, offset = 0, sortBy = 'latest', searchQuery = '') {
  if (isDemoMode) {
    let artworks = Array.from(demoArtworks.values()).filter(artwork => artwork.is_public);
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      artworks = artworks.filter(artwork => 
        artwork.title.toLowerCase().includes(query) ||
        (artwork.description && artwork.description.toLowerCase().includes(query))
      );
    }
    
    // 排序
    switch (sortBy) {
      case 'popular':
        artworks.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'most_liked':
        artworks.sort((a, b) => b.like_count - a.like_count);
        break;
      case 'latest':
      default:
        artworks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    const total = artworks.length;
    const paginatedArtworks = artworks.slice(offset, offset + limit);
    
    return {
      artworks: paginatedArtworks,
      total,
      hasMore: (offset + limit) < total,
    };
  }

  // 生产模式实现：使用 TableStore
  try {
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new CommunityRepository(instanceName);

    // 获取更多数据以支持搜索和排序
    const fetchLimit = searchQuery ? Math.max(limit * 3, 100) : limit + 1;
    let artworks = await repo.getPublicArtworks(fetchLimit);

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      artworks = artworks.filter(artwork =>
        artwork.title.toLowerCase().includes(query) ||
        (artwork.description && artwork.description.toLowerCase().includes(query))
      );
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        artworks.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'most_liked':
        artworks.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case 'latest':
      default:
        artworks.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // 分页
    const total = artworks.length;
    const paginatedArtworks = artworks.slice(offset, offset + limit);
    const hasMore = (offset + limit) < total;

    return {
      artworks: paginatedArtworks.map(artwork => ({
        id: artwork.artworkId,
        user_id: artwork.userId,
        title: artwork.title,
        description: artwork.description,
        video_url: artwork.videoUrl,
        thumbnail_url: artwork.thumbnailUrl,
        is_public: artwork.isPublic,
        like_count: artwork.likeCount,
        comment_count: artwork.commentCount,
        view_count: artwork.viewCount,
        created_at: new Date(artwork.createdAt).toISOString(),
        updated_at: new Date(artwork.updatedAt).toISOString(),
      })),
      total,
      hasMore,
    };
  } catch (error) {
    console.error('[COMMUNITY API] 生产模式获取作品列表失败:', error);
    return { artworks: [], total: 0, hasMore: false };
  }
}

// 创建作品
async function createArtwork(userId, title, description, videoUrl, thumbnailUrl, isPublic = true) {
  if (isDemoMode) {
    // 检查敏感词
    const hasSensitiveContent = checkSensitiveContent(title) || 
                               checkSensitiveContent(description || '');
    
    const artwork = {
      id: `demo-artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      is_public: isPublic && !hasSensitiveContent,
      like_count: 0,
      comment_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    demoArtworks.set(artwork.id, artwork);
    return artwork;
  }

  // 生产模式实现：使用 TableStore
  try {
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new CommunityRepository(instanceName);

    // 检查敏感词
    const hasSensitiveContent = checkSensitiveContent(title) ||
                               checkSensitiveContent(description || '');

    const artwork = await repo.createArtwork({
      userId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      isPublic: isPublic && !hasSensitiveContent,
      tags: [],
      moderationStatus: hasSensitiveContent ? 'PENDING' : 'APPROVED',
    });

    if (!artwork) {
      return null;
    }

    return {
      id: artwork.artworkId,
      user_id: artwork.userId,
      title: artwork.title,
      description: artwork.description,
      video_url: artwork.videoUrl,
      thumbnail_url: artwork.thumbnailUrl,
      is_public: artwork.isPublic,
      like_count: artwork.likeCount,
      comment_count: artwork.commentCount,
      view_count: artwork.viewCount,
      created_at: new Date(artwork.createdAt).toISOString(),
      updated_at: new Date(artwork.updatedAt).toISOString(),
    };
  } catch (error) {
    console.error('[COMMUNITY API] 生产模式创建作品失败:', error);
    return null;
  }
}

// 获取单个作品
async function getArtwork(artworkId) {
  if (isDemoMode) {
    const artwork = demoArtworks.get(artworkId);
    if (artwork) {
      // 增加浏览次数
      artwork.view_count += 1;
      demoArtworks.set(artworkId, artwork);
    }
    return artwork || null;
  }

  // 生产模式实现...
  return null;
}

// 点赞/取消点赞
async function toggleLike(artworkId, userId) {
  // 检查频率限制
  const rateLimitCheck = checkLikeRateLimit(userId, artworkId);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.reason,
      message: rateLimitCheck.message,
      resetTime: rateLimitCheck.resetTime,
    };
  }

  // 检查去抖
  const debounceCheck = checkLikeDebounce(userId, artworkId);
  if (!debounceCheck.allowed) {
    return {
      success: false,
      error: 'DEBOUNCE_LIMIT',
      message: debounceCheck.message,
      remainingMs: debounceCheck.remainingMs,
    };
  }

  if (isDemoMode) {
    const artwork = demoArtworks.get(artworkId);
    if (!artwork) {
      throw new Error('作品不存在');
    }
    
    // 检查是否已点赞
    const existingLike = Array.from(demoLikes.values()).find(like => 
      like.artwork_id === artworkId && like.user_id === userId
    );
    
    if (existingLike) {
      // 取消点赞
      demoLikes.delete(existingLike.id);
      artwork.like_count = Math.max(0, artwork.like_count - 1);
      demoArtworks.set(artworkId, artwork);
      
      // 处理取消点赞的社交奖励（演示模式）
      const cancelRewards = await processDemoSocialRewards(
        userId, artwork.user_id, artworkId, artwork.like_count, false
      );

      return {
        success: true,
        liked: false,
        likeCount: artwork.like_count,
        authorId: artwork.user_id,
        rewards: cancelRewards.rewards,
        messages: cancelRewards.messages,
      };
    } else {
      // 添加点赞
      const like = {
        id: `demo-like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        artwork_id: artworkId,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      demoLikes.set(like.id, like);
      artwork.like_count += 1;
      demoArtworks.set(artworkId, artwork);

      // 处理点赞的社交奖励（演示模式）
      const likeRewards = await processDemoSocialRewards(
        userId, artwork.user_id, artworkId, artwork.like_count, true
      );

      return {
        success: true,
        liked: true,
        likeCount: artwork.like_count,
        authorId: artwork.user_id,
        rewards: likeRewards.rewards,
        messages: likeRewards.messages,
      };
    }
  }

  // 生产模式实现：使用 TableStore
  try {
    const { CommunityRepository } = await import('../../serverless/src/communityRepo.js');
    const { CreditsService } = await import('../../serverless/src/creditsService.js');

    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new CommunityRepository(instanceName);
    const creditsService = new CreditsService(instanceName);

    const result = await repo.likeArtwork(userId, artworkId);

    if (result.success && result.authorId) {
      // 处理社交奖励
      const rewardResult = await creditsService.processSocialRewards(
        userId,
        result.authorId,
        artworkId,
        result.likeCount,
        result.liked
      );

      return {
        success: true,
        liked: result.liked,
        likeCount: result.likeCount,
        authorId: result.authorId,
        rewards: {
          authorReward: rewardResult.authorReward,
          likerReward: rewardResult.likerReward,
        },
        messages: rewardResult.messages,
      };
    }

    return {
      success: true,
      liked: result.liked,
      likeCount: result.likeCount,
      authorId: result.authorId,
    };
  } catch (error) {
    console.error('[COMMUNITY API] 生产模式点赞失败:', error);
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: '点赞操作失败，请稍后重试',
      liked: false,
      likeCount: 0
    };
  }
}

// 添加评论
async function addComment(artworkId, userId, content) {
  if (isDemoMode) {
    const artwork = demoArtworks.get(artworkId);
    if (!artwork) {
      throw new Error('作品不存在');
    }
    
    // 检查敏感词
    const hasSensitiveContent = checkSensitiveContent(content);
    
    const comment = {
      id: `demo-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      artwork_id: artworkId,
      user_id: userId,
      content,
      is_approved: !hasSensitiveContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    demoComments.set(comment.id, comment);
    
    // 只有通过审核的评论才计入评论数
    if (comment.is_approved) {
      artwork.comment_count += 1;
      demoArtworks.set(artworkId, artwork);
    }
    
    return comment;
  }

  // 生产模式实现...
  return null;
}

// 获取作品评论
async function getComments(artworkId) {
  if (isDemoMode) {
    return Array.from(demoComments.values())
      .filter(comment => comment.artwork_id === artworkId && comment.is_approved)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // 生产模式实现...
  return [];
}

// 获取用户作品
async function getUserArtworks(userId) {
  if (isDemoMode) {
    return Array.from(demoArtworks.values())
      .filter(artwork => artwork.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 生产模式实现...
  return [];
}

// 获取用户点赞的作品
async function getUserLikedArtworks(userId) {
  if (isDemoMode) {
    const userLikes = Array.from(demoLikes.values()).filter(like => like.user_id === userId);
    const likedArtworkIds = userLikes.map(like => like.artwork_id);
    
    return likedArtworkIds
      .map(id => demoArtworks.get(id))
      .filter(artwork => artwork)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 生产模式实现...
  return [];
}

// 获取用户评论
async function getUserComments(userId) {
  if (isDemoMode) {
    return Array.from(demoComments.values())
      .filter(comment => comment.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 生产模式实现...
  return [];
}

export default async function handler(req, res) {
  try {
    console.log('[COMMUNITY API] 请求:', req.method, req.url);
    console.log('[COMMUNITY API] 演示模式状态:', isDemoMode);

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

    const { action, id } = req.query;

    switch (action) {
      case 'artworks':
        if (req.method === 'GET') {
          const { limit = 20, offset = 0, sortBy = 'latest', search = '' } = req.query;
          const result = await getArtworks(parseInt(limit), parseInt(offset), sortBy, search);
          return res.status(200).json({ success: true, data: result });
        } else if (req.method === 'POST') {
          const { title, description, videoUrl, thumbnailUrl, isPublic = true } = req.body;
          if (!title || !videoUrl) {
            return res.status(400).json({ error: 'Title and video URL are required' });
          }
          const artwork = await createArtwork(userId, title, description, videoUrl, thumbnailUrl, isPublic);

          // 同步到用户作品列表（演示模式）
          if (isDemoMode) {
            try {
              const { addArtworkToUser } = await import('../users/me/artworks.js');
              addArtworkToUser(userId, artwork);
            } catch (error) {
              console.log('[COMMUNITY API] 同步到用户作品列表失败:', error.message);
            }
          }

          return res.status(201).json({ success: true, data: artwork });
        }
        break;

      case 'artwork':
        if (req.method === 'GET' && id) {
          const artwork = await getArtwork(id);
          if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
          }
          return res.status(200).json({ success: true, data: artwork });
        }
        break;

      case 'like':
        if (req.method === 'POST' && id) {
          const result = await toggleLike(id, userId);
          if (result.success) {
            return res.status(200).json({ success: true, data: result });
          } else {
            return res.status(429).json({
              success: false,
              error: result.error,
              message: result.message,
              resetTime: result.resetTime,
              remainingMs: result.remainingMs,
            });
          }
        }
        break;

      case 'toggle-visibility':
        if (req.method === 'POST' && id) {
          const { isPublic } = req.body;
          if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ error: 'isPublic (boolean) is required' });
          }
          const toggleResult = await toggleArtworkVisibility(id, userId, isPublic);
          return res.status(200).json({ success: true, data: toggleResult });
        }
        break;

      case 'comments':
        if (req.method === 'GET' && id) {
          const comments = await getComments(id);
          return res.status(200).json({ success: true, data: comments });
        } else if (req.method === 'POST' && id) {
          const { content } = req.body;
          if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
          }
          const comment = await addComment(id, userId, content);
          return res.status(201).json({ success: true, data: comment });
        }
        break;

      case 'my-artworks':
        if (req.method === 'GET') {
          const artworks = await getUserArtworks(userId);
          return res.status(200).json({ success: true, data: artworks });
        }
        break;

      case 'my-likes':
        if (req.method === 'GET') {
          const artworks = await getUserLikedArtworks(userId);
          return res.status(200).json({ success: true, data: artworks });
        }
        break;

      case 'my-comments':
        if (req.method === 'GET') {
          const comments = await getUserComments(userId);
          return res.status(200).json({ success: true, data: comments });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[COMMUNITY API] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
