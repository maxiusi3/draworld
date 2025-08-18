// 合并的Credits API - 处理积分相关的所有操作
// 支持: balance (查询余额), transaction (创建交易), history (查询历史), daily-signin (每日签到)

import { jwtVerify, createRemoteJWKSet } from 'jose';

// TableStore 配置检查
const instanceName = process.env.TABLESTORE_INSTANCE;
const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

if (!instanceName || !accessKeyId || !accessKeySecret) {
  throw new Error('Missing required environment variables: TABLESTORE_INSTANCE, ALIBABA_CLOUD_ACCESS_KEY_ID, ALIBABA_CLOUD_ACCESS_KEY_SECRET');
}

// Authing OIDC 配置
const OIDC_JWKS_URI = 'https://draworld.authing.cn/oidc/.well-known/jwks.json';
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '689adde75ecb97cd396860eb';

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
    console.log('[AUTH] 开始验证JWT token');
    console.log('[AUTH] 期望的issuer:', OIDC_ISSUER);
    console.log('[AUTH] 期望的audience:', OIDC_AUDIENCE);

    // 先解析token看看内容（不验证签名）
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('[AUTH] Token payload:', {
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat
        });
      }
    } catch (parseError) {
      console.log('[AUTH] 无法解析token payload:', parseError.message);
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });

    console.log('[AUTH] JWT 验证成功，用户ID:', payload.sub);
    return payload.sub;
  } catch (error) {
    console.error('[AUTH] JWT 验证失败:', error);
    console.error('[AUTH] 错误详情:', error.message);
    return null;
  }
}

// 处理余额查询
async function handleBalance(req, res, userId) {
  try {
    console.log('[BALANCE] 查询用户积分余额，用户ID:', userId);

    // 使用 TableStore CreditsService
    const { CreditsService } = await import('../../serverless/src/creditsService.js');
    const creditsService = new CreditsService(instanceName);

    // 从 TableStore 查询用户积分余额
    const balance = await creditsService.getUserBalance(userId);

    console.log('[BALANCE] 用户积分余额:', balance);

    return res.status(200).json({
      success: true,
      balance: balance,
      lastUpdated: new Date().toISOString()
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

    // 使用 TableStore CreditsService
    const { CreditsService } = await import('../../serverless/src/creditsService.js');
    const creditsService = new CreditsService(instanceName);

    // 创建积分交易
    const transaction = await creditsService.addCredits(userId, amount, reason, description || '');

    if (!transaction) {
      throw new Error('Failed to create credit transaction');
    }

    // 获取更新后的余额
    const newBalance = await creditsService.getUserBalance(userId);

    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.transactionId,
        user_id: userId,
        amount: amount,
        reason: reason,
        description: description || '',
        created_at: new Date().toISOString()
      },
      newBalance: newBalance
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

    // 使用 TableStore CreditsService
    const { CreditsService } = await import('../../serverless/src/creditsService.js');
    const creditsService = new CreditsService(instanceName);

    // 从 TableStore 查询积分历史
    const transactions = await creditsService.getUserTransactions(userId, limit);

    // 转换为API响应格式
    const formattedTransactions = transactions.map(tx => ({
      id: tx.transactionId,
      user_id: tx.userId,
      amount: tx.amount,
      reason: tx.reason,
      description: tx.description || '',
      created_at: new Date(tx.createdAt).toISOString(),
      balance_after: tx.balanceAfter
    }));

    return res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: page,
        limit: limit,
        total: formattedTransactions.length,
        totalPages: Math.ceil(formattedTransactions.length / limit)
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

    // 使用 TableStore CreditsService
    const { CreditsService } = await import('../../serverless/src/creditsService.js');
    const creditsService = new CreditsService(instanceName);

    // 执行每日签到
    const result = await creditsService.dailySignin(userId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Already signed in today',
        message: '今天已经签到过了'
      });
    }

    return res.status(200).json({
      success: true,
      message: '签到成功',
      reward: signinReward,
      newBalance: result.newBalance,
      consecutiveDays: 1 // 简化实现，暂时返回1
    });

  } catch (error) {
    console.error('[DAILY_SIGNIN] 签到失败:', error);
    return res.status(500).json({ 
      error: 'Failed to sign in',
      message: error.message
    });
  }
}
