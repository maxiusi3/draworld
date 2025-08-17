// Vercel API路由：每日签到
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo') || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式：内存存储用户积分状态和交易历史（与其他 API 共享）
const demoUserCredits = new Map();
const demoTransactions = new Map();
const demoSigninRecords = new Map(); // 存储签到记录

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

export default async function handler(req, res) {
  try {
    console.log('[DAILY SIGNIN API] 每日签到请求');
    console.log('[DAILY SIGNIN API] Method:', req.method);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[DAILY SIGNIN API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('[DAILY SIGNIN API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[DAILY SIGNIN API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[DAILY SIGNIN API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证 token
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.log('[DAILY SIGNIN API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[DAILY SIGNIN API] 用户ID:', userId);

    const today = new Date().toISOString().split('T')[0];
    const reward = 15; // 每日签到奖励

    // 演示模式：模拟签到逻辑
    if (isDemoMode) {
      console.log('[DAILY SIGNIN API] 演示模式：模拟签到逻辑');

      // 检查今天是否已经签到
      const userSigninRecords = demoSigninRecords.get(userId) || [];
      const hasSignedToday = userSigninRecords.includes(today);

      if (hasSignedToday) {
        console.log('[DAILY SIGNIN API] 演示模式：今天已经签到过了');
        return res.status(200).json({
          success: false,
          message: '今天已经签到过了',
          nextSigninTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // 获取或初始化用户积分状态
      if (!demoUserCredits.has(userId)) {
        demoUserCredits.set(userId, {
          balance: 150,
          total_earned: 150,
          total_spent: 0,
        });
      }

      const userState = demoUserCredits.get(userId);
      const newBalance = userState.balance + reward;

      // 更新用户状态
      demoUserCredits.set(userId, {
        balance: newBalance,
        total_earned: userState.total_earned + reward,
        total_spent: userState.total_spent,
      });

      // 记录签到
      userSigninRecords.push(today);
      demoSigninRecords.set(userId, userSigninRecords);

      // 创建交易记录
      const transactionId = `demo-tx-signin-${Date.now()}`;
      const transaction = {
        id: transactionId,
        user_id: userId,
        transaction_type: 'EARN',
        amount: reward,
        balance_after: newBalance,
        reason: 'DAILY_SIGNIN',
        reference_id: null,
        description: '每日签到奖励',
        created_at: new Date().toISOString(),
      };

      // 保存交易记录
      if (!demoTransactions.has(userId)) {
        demoTransactions.set(userId, []);
      }
      demoTransactions.get(userId).push(transaction);

      console.log('[DAILY SIGNIN API] 演示模式：签到成功，新余额:', newBalance);
      return res.status(200).json({
        success: true,
        reward: reward,
        message: `签到成功！获得${reward}积分`,
        newBalance: newBalance, // 使用实际计算的新余额
        transactionId: transactionId, // 使用实际的交易ID
        nextSigninTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // 获取用户积分信息
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[DAILY SIGNIN API] 获取用户积分失败:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }

    // 如果用户不存在，先创建用户积分账户
    if (!userCredits) {
      console.log('[DAILY SIGNIN API] 用户不存在，先创建积分账户');

      const { data: newUserCredits, error: createError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: 150 + reward, // 注册奖励 + 签到奖励
          total_earned: 150 + reward,
          total_spent: 0,
          daily_like_given: 0,
          last_daily_reset: today,
        })
        .select()
        .single();

      if (createError) {
        console.error('[DAILY SIGNIN API] 创建用户积分失败:', createError);
        return res.status(500).json({ error: 'Failed to create user credits' });
      }

      // 记录注册奖励交易
      await supabase
        .from('credit_transactions')
        .insert([
          {
            user_id: userId,
            transaction_type: 'EARN',
            amount: 150,
            balance_after: 150,
            reason: 'REGISTRATION',
            description: '新用户注册奖励',
          },
          {
            user_id: userId,
            transaction_type: 'EARN',
            amount: reward,
            balance_after: 150 + reward,
            reason: 'DAILY_SIGNIN',
            description: '每日签到奖励',
          }
        ]);

      console.log('[DAILY SIGNIN API] 新用户签到成功:', newUserCredits);
      return res.status(200).json({
        success: true,
        reward: reward,
        message: `签到成功！获得${reward}积分`,
        newBalance: newUserCredits.balance,
        isNewUser: true,
        nextSigninTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // 检查今天是否已经签到
    const { data: todaySignin, error: signinCheckError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reason', 'DAILY_SIGNIN')
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z')
      .single();

    if (signinCheckError && signinCheckError.code !== 'PGRST116') {
      console.error('[DAILY SIGNIN API] 检查签到记录失败:', signinCheckError);
      return res.status(500).json({ error: 'Failed to check signin record' });
    }

    if (todaySignin) {
      console.log('[DAILY SIGNIN API] 今天已经签到过了');
      return res.status(200).json({
        success: false,
        message: '今天已经签到过了',
        nextSigninTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastSigninTime: todaySignin.created_at
      });
    }

    // 执行签到：更新积分余额
    const newBalance = userCredits.balance + reward;
    const newTotalEarned = userCredits.total_earned + reward;

    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[DAILY SIGNIN API] 更新用户积分失败:', updateError);
      return res.status(500).json({ error: 'Failed to update user credits' });
    }

    // 记录签到交易
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'EARN',
        amount: reward,
        balance_after: newBalance,
        reason: 'DAILY_SIGNIN',
        description: '每日签到奖励',
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[DAILY SIGNIN API] 创建交易记录失败:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction record' });
    }

    console.log('[DAILY SIGNIN API] 签到成功:', {
      userId,
      reward,
      newBalance,
      transactionId: transaction.id
    });

    return res.status(200).json({
      success: true,
      reward: reward,
      message: `签到成功！获得${reward}积分`,
      newBalance: newBalance,
      transactionId: transaction.id,
      nextSigninTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('[DAILY SIGNIN API] 每日签到失败:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
