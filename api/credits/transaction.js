// Vercel API路由：创建积分交易记录
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// 检查是否为演示模式
const isDemoMode = supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo') || !process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式：内存存储用户积分状态和交易历史
const demoUserCredits = new Map();
const demoTransactions = new Map(); // 存储所有交易记录

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

// 执行积分交易（原子操作）
async function executeTransaction(userId, transactionType, amount, reason, referenceId, description) {
  try {
    console.log('[TRANSACTION] 开始执行积分交易:', {
      userId,
      transactionType,
      amount,
      reason,
      referenceId,
      description
    });

    // 获取当前用户积分
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`获取用户积分失败: ${fetchError.message}`);
    }

    // 如果用户不存在，创建新用户
    let currentBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;

    if (userCredits) {
      currentBalance = userCredits.balance;
      totalEarned = userCredits.total_earned;
      totalSpent = userCredits.total_spent;
    }

    // 计算新余额
    let newBalance;
    let newTotalEarned = totalEarned;
    let newTotalSpent = totalSpent;

    if (transactionType === 'EARN') {
      newBalance = currentBalance + amount;
      newTotalEarned += amount;
    } else {
      // 检查余额是否充足
      if (currentBalance < amount) {
        console.log('[TRANSACTION] 余额不足:', { currentBalance, amount });
        return { success: false, error: 'Insufficient balance' };
      }
      newBalance = currentBalance - amount;
      newTotalSpent += amount;
    }

    // 更新用户积分
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
        daily_like_given: userCredits?.daily_like_given || 0,
        last_daily_reset: userCredits?.last_daily_reset || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      throw new Error(`更新用户积分失败: ${updateError.message}`);
    }

    // 创建交易记录
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        amount,
        balance_after: newBalance,
        reason,
        reference_id: referenceId,
        description,
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`创建交易记录失败: ${transactionError.message}`);
    }

    console.log('[TRANSACTION] 积分交易成功:', {
      transactionId: transaction.id,
      newBalance
    });

    return {
      success: true,
      newBalance,
      transactionId: transaction.id,
      transaction,
    };
  } catch (error) {
    console.error('[TRANSACTION] 执行积分交易失败:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req, res) {
  try {
    console.log('[CREDITS TRANSACTION API] 积分交易请求');
    console.log('[CREDITS TRANSACTION API] Method:', req.method);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[CREDITS TRANSACTION API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('[CREDITS TRANSACTION API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[CREDITS TRANSACTION API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[CREDITS TRANSACTION API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 提取并验证 token
    const token = authHeader.substring(7);
    let userId = await verifyToken(token);

    if (!userId) {
      console.log('[CREDITS TRANSACTION API] 错误：Token 验证失败');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 演示模式下支持以特定用户执行（后端代发用），仅 demoMode 生效
    if (isDemoMode && req.headers['x-act-as-user']) {
      console.log('[CREDITS TRANSACTION API] 演示模式：以 x-act-as-user 执行入账:', req.headers['x-act-as-user']);
      userId = String(req.headers['x-act-as-user']);
    }

    // 解析请求体
    const { transactionType, amount, reason, referenceId, description } = req.body;

    console.log('[CREDITS TRANSACTION API] 交易参数:', {
      userId,
      transactionType,
      amount,
      reason,
      referenceId,
      description
    });

    // 验证必需参数
    if (!transactionType || !amount || !reason) {
      console.log('[CREDITS TRANSACTION API] 错误：缺少必需参数');
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['transactionType', 'amount', 'reason']
      });
    }

    // 验证交易类型
    if (!['EARN', 'SPEND'].includes(transactionType)) {
      console.log('[CREDITS TRANSACTION API] 错误：无效的交易类型');
      return res.status(400).json({ 
        error: 'Invalid transaction type',
        validTypes: ['EARN', 'SPEND']
      });
    }

    // 验证金额
    if (typeof amount !== 'number' || amount <= 0) {
      console.log('[CREDITS TRANSACTION API] 错误：无效的金额');
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // 演示模式：模拟交易逻辑
    if (isDemoMode) {
      console.log('[CREDITS TRANSACTION API] 演示模式：模拟交易逻辑');

      // 获取或初始化用户积分状态
      if (!demoUserCredits.has(userId)) {
        demoUserCredits.set(userId, {
          balance: 150,
          total_earned: 150,
          total_spent: 0,
        });
      }

      const userState = demoUserCredits.get(userId);
      const currentBalance = userState.balance;

      console.log('[CREDITS TRANSACTION API] 演示模式：当前用户状态:', userState);

      if (transactionType === 'SPEND' && currentBalance < amount) {
        console.log('[CREDITS TRANSACTION API] 演示模式：余额不足');
        return res.status(400).json({
          error: 'Transaction failed',
          message: 'Insufficient balance'
        });
      }

      // 更新用户状态
      const newBalance = transactionType === 'EARN'
        ? currentBalance + amount
        : currentBalance - amount;

      const newTotalEarned = transactionType === 'EARN'
        ? userState.total_earned + amount
        : userState.total_earned;

      const newTotalSpent = transactionType === 'SPEND'
        ? userState.total_spent + amount
        : userState.total_spent;

      // 保存更新后的状态
      demoUserCredits.set(userId, {
        balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
      });

      // 创建交易记录
      const transactionId = `demo-tx-${Date.now()}`;
      const transaction = {
        id: transactionId,
        user_id: userId,
        transaction_type: transactionType,
        amount,
        balance_after: newBalance,
        reason,
        reference_id: referenceId,
        description,
        created_at: new Date().toISOString(),
      };

      // 保存交易记录到历史
      if (!demoTransactions.has(userId)) {
        demoTransactions.set(userId, []);
      }
      demoTransactions.get(userId).push(transaction);

      const mockResult = {
        success: true,
        newBalance,
        transactionId,
        transaction,
      };

      console.log('[CREDITS TRANSACTION API] 演示模式：交易成功，新状态:', demoUserCredits.get(userId));
      console.log('[CREDITS TRANSACTION API] 演示模式：交易记录已保存，总记录数:', demoTransactions.get(userId).length);
      return res.status(200).json(mockResult);
    }

    // 执行交易
    const result = await executeTransaction(
      userId,
      transactionType,
      amount,
      reason,
      referenceId,
      description
    );

    if (!result.success) {
      console.log('[CREDITS TRANSACTION API] 交易失败:', result.error);
      return res.status(400).json({ 
        error: 'Transaction failed',
        message: result.error
      });
    }

    console.log('[CREDITS TRANSACTION API] 交易成功:', result);
    return res.status(200).json({
      success: true,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      transaction: result.transaction,
    });
    
  } catch (error) {
    console.error('[CREDITS TRANSACTION API] 处理交易请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
