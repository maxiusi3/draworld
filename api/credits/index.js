// 合并的Credits API - 处理积分相关的所有操作
// 支持: balance (查询余额), transaction (创建交易), history (查询历史), daily-signin (每日签到)

import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// 生产环境配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = '689adde75ecb97cd396860eb';

// 创建 JWKS 客户端
const jwks = createRemoteJWKSet(new URL(OIDC_JWKS_URI));

export default async function handler(req, res) {
  try {
    console.log('[CREDITS API] 请求接收');
    console.log('[CREDITS API] Method:', req.method);
    console.log('[CREDITS API] URL:', req.url);
    console.log('[CREDITS API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[CREDITS API] 处理 OPTIONS 请求');
      return res.status(200).end();
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

    // 根据查询参数或请求体中的action来路由
    const action = req.query.action || req.body?.action;
    
    console.log('[CREDITS API] Action:', action, 'UserId:', userId);

    switch (action) {
      case 'balance':
        return await handleBalance(req, res, userId);
      case 'transaction':
        return await handleTransaction(req, res, userId);
      case 'history':
        return await handleHistory(req, res, userId);
      case 'daily-signin':
        return await handleDailySignin(req, res, userId);
      default:
        // 如果没有指定action，根据HTTP方法推断
        if (req.method === 'GET') {
          return await handleBalance(req, res, userId);
        } else if (req.method === 'POST') {
          return await handleTransaction(req, res, userId);
        } else {
          return res.status(400).json({ 
            error: 'Invalid request. Please specify action parameter.' 
          });
        }
    }
    
  } catch (error) {
    console.error('[CREDITS API] 处理请求失败:', error);
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
    console.error('[AUTH] JWT 验证失败:', error);
    return null;
  }
}

// 处理余额查询
async function handleBalance(req, res, userId) {
  try {
    console.log('[BALANCE] 查询用户积分余额，用户ID:', userId);

    // 从Supabase查询
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, last_updated')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // 用户不存在，创建新记录
      const { data: newData, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: 100,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        success: true,
        balance: newData.balance,
        lastUpdated: newData.last_updated
      });
    }

    return res.status(200).json({
      success: true,
      balance: data.balance,
      lastUpdated: data.last_updated
    });

  } catch (error) {
    console.error('[BALANCE] 查询余额失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get balance',
      message: error.message
    });
  }
}

// 处理交易创建
async function handleTransaction(req, res, userId) {
  try {
    console.log('[TRANSACTION] 创建积分交易，用户ID:', userId);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, reason, description } = req.body;

    if (typeof amount !== 'number' || amount === 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Missing reason' });
    }

    // 使用Supabase事务
    const { data, error } = await supabase.rpc('create_credit_transaction', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_description: description || ''
    });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      transaction: data,
      newBalance: data.balance_after
    });

  } catch (error) {
    console.error('[TRANSACTION] 创建交易失败:', error);
    return res.status(500).json({ 
      error: 'Failed to create transaction',
      message: error.message
    });
  }
}

// 处理历史记录查询
async function handleHistory(req, res, userId) {
  try {
    console.log('[HISTORY] 查询积分历史，用户ID:', userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // 从Supabase查询
    const { data, error, count } = await supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      transactions: data,
      pagination: {
        page: page,
        limit: limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('[HISTORY] 查询历史失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get history',
      message: error.message
    });
  }
}

// 处理每日签到
async function handleDailySignin(req, res, userId) {
  try {
    console.log('[DAILY_SIGNIN] 每日签到，用户ID:', userId);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const today = new Date().toDateString();
    const signinReward = 5; // 每日签到奖励5积分

    // 使用Supabase
    const { data, error } = await supabase.rpc('daily_signin', {
      p_user_id: userId,
      p_reward: signinReward
    });

    if (error) {
      if (error.message.includes('already signed in')) {
        return res.status(400).json({ 
          error: 'Already signed in today',
          message: '今天已经签到过了'
        });
      }
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: '签到成功',
      reward: signinReward,
      newBalance: data.new_balance,
      consecutiveDays: data.consecutive_days
    });

  } catch (error) {
    console.error('[DAILY_SIGNIN] 签到失败:', error);
    return res.status(500).json({ 
      error: 'Failed to sign in',
      message: error.message
    });
  }
}
