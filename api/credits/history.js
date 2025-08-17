// Vercel API路由：获取用户积分历史记录
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo') || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式：内存存储交易历史（与其他 API 共享）
const demoTransactions = new Map();

// 获取积分原因的描述
function getReasonDescription(reason) {
  const reasonMap = {
    'REGISTRATION_BONUS': '新用户注册奖励',
    'DAILY_SIGNIN': '每日签到奖励',
    'VIDEO_GENERATION': '视频生成消费',
    'MANUAL_ADJUSTMENT': '手动调整',
    'INVITATION_REWARD': '邀请奖励',
    'SOCIAL_REWARD': '社交奖励',
  };
  return reasonMap[reason] || reason;
}

// 创建 Supabase 客户端
const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseServiceKey);

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = '689adde75ecb97cd396860eb';

// 创建 JWKS 客户端
const jwks = createRemoteJWKSet(new URL(OIDC_JWKS_URI));

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

// 交易原因的中文描述映射
const reasonDescriptions = {
  'REGISTRATION': '新用户注册奖励',
  'DAILY_SIGNIN': '每日签到奖励',
  'VIDEO_GENERATION': '视频生成消费',
  'INVITE_REGISTER': '邀请用户注册奖励',
  'INVITE_FIRST_VIDEO': '邀请用户首次生成视频奖励',
  'LIKE_RECEIVED': '作品被点赞奖励',
  'LIKE_GIVEN': '点赞他人作品奖励',
  'MANUAL_ADJUSTMENT': '手动调整',
};

export default async function handler(req, res) {
  try {
    console.log('[CREDITS HISTORY API] 积分历史查询请求');
    console.log('[CREDITS HISTORY API] Method:', req.method);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[CREDITS HISTORY API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[CREDITS HISTORY API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[CREDITS HISTORY API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[CREDITS HISTORY API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证 token
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.log('[CREDITS HISTORY API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 解析查询参数
    const { limit = '20', offset = '0', type, reason } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // 最大限制100条
    const offsetNum = parseInt(offset) || 0;

    console.log('[CREDITS HISTORY API] 查询参数:', {
      userId,
      limit: limitNum,
      offset: offsetNum,
      type,
      reason
    });

    // 演示模式：返回真实的交易历史记录
    if (isDemoMode) {
      console.log('[CREDITS HISTORY API] 演示模式：返回交易历史记录');

      // 获取用户的交易记录
      let userTransactions = demoTransactions.get(userId) || [];
      console.log('[CREDITS HISTORY API] 演示模式：用户交易记录数量:', userTransactions.length);

      // 为交易记录添加显示格式
      const formattedTransactions = userTransactions.map(transaction => ({
        ...transaction,
        reasonDescription: getReasonDescription(transaction.reason),
        displayAmount: transaction.transaction_type === 'EARN'
          ? `+${transaction.amount}`
          : `-${transaction.amount}`,
      }));

      // 根据过滤条件筛选
      let filteredTransactions = formattedTransactions;
      if (type) {
        filteredTransactions = filteredTransactions.filter(t => t.transaction_type === type);
      }
      if (reason) {
        filteredTransactions = filteredTransactions.filter(t => t.reason === reason);
      }

      // 按时间倒序排列（最新的在前）
      filteredTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 分页
      const paginatedTransactions = filteredTransactions.slice(offsetNum, offsetNum + limitNum);

      const response = {
        transactions: paginatedTransactions,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: filteredTransactions.length,
          hasMore: (offsetNum + limitNum) < filteredTransactions.length,
        },
        filters: {
          type: type || null,
          reason: reason || null,
        },
      };

      console.log('[CREDITS HISTORY API] 演示模式：返回历史记录:', response);
      return res.status(200).json(response);
    }

    // 构建查询
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    // 添加过滤条件
    if (type && ['EARN', 'SPEND'].includes(type)) {
      query = query.eq('transaction_type', type);
    }

    if (reason) {
      query = query.eq('reason', reason);
    }

    // 执行查询
    const { data: transactions, error } = await query;

    if (error) {
      console.error('[CREDITS HISTORY API] 数据库查询失败:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // 处理响应数据，添加中文描述
    const processedTransactions = transactions.map(transaction => ({
      ...transaction,
      reasonDescription: reasonDescriptions[transaction.reason] || transaction.reason,
      displayAmount: transaction.transaction_type === 'EARN' ? `+${transaction.amount}` : `-${transaction.amount}`,
    }));

    // 获取总数（用于分页）
    let countQuery = supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (type && ['EARN', 'SPEND'].includes(type)) {
      countQuery = countQuery.eq('transaction_type', type);
    }

    if (reason) {
      countQuery = countQuery.eq('reason', reason);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('[CREDITS HISTORY API] 获取总数失败:', countError);
      // 不影响主要功能，继续返回数据
    }

    const response = {
      transactions: processedTransactions,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count || 0,
        hasMore: count ? (offsetNum + limitNum) < count : false,
      },
      filters: {
        type: type || null,
        reason: reason || null,
      },
    };

    console.log('[CREDITS HISTORY API] 返回历史记录:', {
      count: processedTransactions.length,
      total: count,
      hasMore: response.pagination.hasMore
    });

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('[CREDITS HISTORY API] 查询积分历史失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
