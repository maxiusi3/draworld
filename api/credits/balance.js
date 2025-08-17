// Vercel API路由：获取用户积分余额
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo') || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式：内存存储用户积分状态和交易历史（与 transaction.js 共享）
const demoUserCredits = new Map();
const demoTransactions = new Map();

// 创建 Supabase 客户端（使用 service role key 用于服务端操作）
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
      // 从 token 中提取一个稳定的用户ID，或使用默认值
      const userId = token.includes('test-token') ? 'demo-user' : `user-${token.slice(-8)}`;
      return userId;
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub; // 返回用户ID
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

export default async function handler(req, res) {
  try {
    console.log('[CREDITS BALANCE API] 积分余额查询请求');
    console.log('[CREDITS BALANCE API] Method:', req.method);
    console.log('[CREDITS BALANCE API] 演示模式状态:', isDemoMode);
    console.log('[CREDITS BALANCE API] Supabase URL:', supabaseUrl);
    console.log('[CREDITS BALANCE API] Service Key 存在:', !!supabaseServiceKey);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[CREDITS BALANCE API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[CREDITS BALANCE API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[CREDITS BALANCE API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[CREDITS BALANCE API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证 token
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.log('[CREDITS BALANCE API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[CREDITS BALANCE API] 用户ID:', userId);

    // 演示模式：返回模拟数据
    if (isDemoMode) {
      console.log('[CREDITS BALANCE API] 演示模式：返回模拟积分数据');

      // 获取或初始化用户积分状态
      if (!demoUserCredits.has(userId)) {
        // 初始化新用户：150积分 + 注册奖励交易记录
        demoUserCredits.set(userId, {
          balance: 150,
          total_earned: 150,
          total_spent: 0,
        });

        // 创建注册奖励交易记录
        const registrationTransaction = {
          id: `demo-tx-registration-${Date.now()}`,
          user_id: userId,
          transaction_type: 'EARN',
          amount: 150,
          balance_after: 150,
          reason: 'REGISTRATION_BONUS',
          reference_id: null,
          description: '新用户注册奖励',
          created_at: new Date().toISOString(),
        };

        if (!demoTransactions.has(userId)) {
          demoTransactions.set(userId, []);
        }
        demoTransactions.get(userId).push(registrationTransaction);
      }

      const userState = demoUserCredits.get(userId);
      console.log('[CREDITS BALANCE API] 演示模式：用户状态:', userState);

      // 模拟用户积分数据
      const mockCredits = {
        user_id: userId,
        balance: userState.balance,
        total_earned: userState.total_earned,
        total_spent: userState.total_spent,
        daily_like_given: 0,
        last_daily_reset: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[CREDITS BALANCE API] 演示模式：返回数据:', mockCredits);
      return res.status(200).json(mockCredits);
    }

    // 从 Supabase 获取用户积分
    const { data: userCredits, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[CREDITS BALANCE API] 数据库查询失败:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // 如果用户不存在，创建新用户并给予注册奖励
    if (!userCredits) {
      console.log('[CREDITS BALANCE API] 新用户，创建积分账户');

      const newUserCredits = {
        user_id: userId,
        balance: 150, // 注册奖励
        total_earned: 150,
        total_spent: 0,
        daily_like_given: 0,
        last_daily_reset: new Date().toISOString().split('T')[0],
      };

      const { data: createdCredits, error: createError } = await supabase
        .from('user_credits')
        .insert(newUserCredits)
        .select()
        .single();

      if (createError) {
        console.error('[CREDITS BALANCE API] 创建用户积分失败:', createError);
        return res.status(500).json({ error: 'Failed to create user credits' });
      }

      // 记录注册奖励交易
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'EARN',
          amount: 150,
          balance_after: 150,
          reason: 'REGISTRATION',
          description: '新用户注册奖励',
        });

      console.log('[CREDITS BALANCE API] 新用户积分创建成功:', createdCredits);
      return res.status(200).json(createdCredits);
    }

    console.log('[CREDITS BALANCE API] 返回用户积分:', userCredits);
    return res.status(200).json(userCredits);

  } catch (error) {
    console.error('[CREDITS BALANCE API] 查询积分余额失败:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
