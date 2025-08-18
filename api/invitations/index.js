import { createClient } from '@supabase/supabase-js';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Supabase 配置 - 生产环境强制要求环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// 风控：频率限制存储
const rateLimitStore = new Map();

// 风控配置
const RATE_LIMIT_CONFIG = {
  // 每个用户每小时最多调用次数
  MY_CODE: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 1小时10次
  REGISTER_WITH_CODE: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 1小时5次
  TRIGGER_VIDEO_REWARD: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 1小时20次
  MY_INVITATIONS: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 1小时50次
};

// Authing.cn JWT 验证配置
const OIDC_ISSUER = process.env.AUTHING_OIDC_ISSUER || 'https://draworld.authing.cn/oidc';
const OIDC_AUDIENCE = process.env.AUTHING_OIDC_AUDIENCE || '676a0e3c6c9a2b2d8e9c4c5e';
const jwks = createRemoteJWKSet(new URL(`${OIDC_ISSUER}/.well-known/jwks.json`));

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 验证 JWT Token 并提取用户ID
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: OIDC_ISSUER,
      audience: OIDC_AUDIENCE,
    });
    return payload.sub;
  } catch (error) {
    console.error('[AUTH] Token 验证失败:', error);
    return null;
  }
}

// 风控：检查频率限制
function checkRateLimit(userId, action) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return { allowed: true };

  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // 获取或创建用户的请求记录
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);

  // 清理过期的请求记录
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(key, validRequests);

  // 检查是否超过限制
  if (validRequests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...validRequests);
    const resetTime = oldestRequest + config.windowMs;
    return {
      allowed: false,
      resetTime: new Date(resetTime).toISOString(),
      limit: config.maxRequests,
      windowMs: config.windowMs,
    };
  }

  // 记录本次请求
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);

  return { allowed: true };
}

// 日志埋点函数
function logInvitationEvent(action, userId, details = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ...details,
  };

  console.log('[INVITATION_EVENT]', JSON.stringify(logData));

  // 生产环境可以发送到日志收集系统
  // 发送到 SLS、CloudWatch 等日志系统
}

// 生产模式不再需要此函数，已移除演示模式逻辑
async function awardCreditsToUserDemo(targetUserId, amount, reason, token, req) {
  try {
    return; // 生产模式下不执行
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;

    const resp = await fetch(`${baseUrl}/api/credits/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-act-as-user': targetUserId,
      },
      body: JSON.stringify({
        transactionType: 'EARN',
        amount,
        reason,
        description: 'Invitation demo auto-award',
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('[INVITATIONS API] awardCreditsToUserDemo failed:', resp.status, text);
    }
  } catch (e) {
    console.error('[INVITATIONS API] awardCreditsToUserDemo error:', e);
  }
}


// 生成邀请码
function generateInvitationCode(userId) {
  const userPart = userId.slice(-4).toUpperCase();
  const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${userPart}${randomPart}`;
}

// 获取用户邀请码
async function getMyCode(userId) {
  // 生产模式实现：使用 TableStore
  try {
    const { InvitationsRepository } = await import('../../serverless/src/invitationsRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new InvitationsRepository(instanceName);

    // 查找或创建用户的邀请码
    let inviteCode = await repo.getInviteCodeByUser(userId);
    if (!inviteCode) {
      inviteCode = await repo.createInviteCode(userId);
    }

    if (!inviteCode) {
      throw new Error('Failed to create invite code');
    }

    return {
      id: `${inviteCode.tenantId}-${inviteCode.code}`,
      user_id: inviteCode.userId,
      invitation_code: inviteCode.code,
      is_active: inviteCode.isActive,
      created_at: new Date(inviteCode.createdAt).toISOString(),
    };
  } catch (error) {
    console.error('[INVITATIONS API] 生产模式获取邀请码失败:', error);
    throw error;
  }
}

// 处理邀请注册
async function registerWithCode(userId, invitationCode) {
  if (isDemoMode) {
    // 验证邀请码
    const codeData = demoInvitationCodes.get(invitationCode);
    if (!codeData || !codeData.is_active) {
      return {
        success: false,
        message: '邀请码无效或已失效',
      };
    }

    // 防止自邀请
    if (codeData.user_id === userId) {
      return {
        success: false,
        message: '不能使用自己的邀请码',
      };
    }

    // 检查是否已经被邀请过
    let alreadyInvited = false;
    for (const [id, rel] of demoInvitationRelationships.entries()) {
      if (rel.invitee_user_id === userId) {
        alreadyInvited = true;
        break;
      }
    }

    if (alreadyInvited) {
      return {
        success: false,
        message: '您已经使用过邀请码了',
      };
    }

    // 创建邀请关系
    const relationshipId = `demo-rel-${Date.now()}`;
    const relationship = {
      id: relationshipId,
      inviter_user_id: codeData.user_id,
      invitee_user_id: userId,
      invitation_code: invitationCode,
      registration_reward_given: true,
      first_video_reward_given: false,
      total_rewards_given: 30, // 邀请者获得30积分
      created_at: new Date().toISOString(),
    };

    demoInvitationRelationships.set(relationshipId, relationship);

    return {
      success: true,
      message: '邀请注册成功',
      rewards: {
        inviter: 30, // 邀请者获得30积分
        invitee: 50, // 被邀请者获得50积分
      },
      relationship: relationship,
    };
  }

  // 生产模式实现：使用 TableStore
  try {
    const { InvitationsRepository } = await import('../../serverless/src/invitationsRepo.js');
    const { CreditsService } = await import('../../serverless/src/creditsService.js');

    const instanceName = process.env.TABLESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new InvitationsRepository(instanceName);
    const creditsService = new CreditsService(instanceName);

    // 1. 验证邀请码
    const inviteCode = await repo.getInviteCodeByCode(invitationCode);
    if (!inviteCode || !inviteCode.isActive) {
      return {
        success: false,
        message: '邀请码无效或已失效',
      };
    }

    // 2. 防止自邀请
    if (inviteCode.userId === userId) {
      return {
        success: false,
        message: '不能使用自己的邀请码',
      };
    }

    // 3. 检查是否已经被邀请过
    const existingInvitation = await repo.getInvitationByInvitee(userId);
    if (existingInvitation) {
      return {
        success: false,
        message: '您已经使用过邀请码了',
      };
    }

    // 4. 创建邀请关系
    const invitation = await repo.createInvitation(
      inviteCode.userId,
      userId,
      invitationCode
    );

    if (!invitation) {
      return {
        success: false,
        message: '创建邀请关系失败',
      };
    }

    // 5. 标记邀请码为已使用
    await repo.markInviteCodeAsUsed(invitationCode, userId);

    // 6. 发放积分奖励
    const inviterRewardSuccess = await creditsService.grantInviterReward(
      inviteCode.userId,
      invitation.invitationId
    );

    const inviteeRewardSuccess = await creditsService.grantInviteeReward(
      userId,
      invitation.invitationId
    );

    if (!inviterRewardSuccess || !inviteeRewardSuccess) {
      console.warn('[INVITATIONS API] 积分发放部分失败，但邀请关系已创建');
    }

    return {
      success: true,
      message: '邀请注册成功',
      rewards: {
        inviter: 30, // 邀请者获得30积分
        invitee: 50, // 被邀请者获得50积分
      },
      relationship: {
        id: invitation.invitationId,
        inviter_user_id: invitation.inviterUserId,
        invitee_user_id: invitation.inviteeUserId,
        invitation_code: invitation.invitationCode,
        registration_reward_given: invitation.registrationRewardGiven,
        first_video_reward_given: invitation.firstVideoRewardGiven,
        total_rewards_given: invitation.totalRewardsGiven,
        created_at: new Date(invitation.createdAt).toISOString(),
      },
    };
  } catch (error) {
    console.error('[INVITATIONS API] 生产模式邀请注册失败:', error);
    return {
      success: false,
      message: '邀请注册失败，请稍后重试',
    };
  }
}

// 获取用户邀请记录
async function getMyInvitations(userId) {
  if (isDemoMode) {
    // 获取用户的邀请码
    let userCode = null;
    for (const [code, data] of demoInvitationCodes.entries()) {
      if (data.user_id === userId) {
        userCode = { invitation_code: code, ...data };
        break;
      }
    }

    if (!userCode) {
      return {
        invitationCode: null,
        totalInvited: 0,
        totalRewards: 0,
        invitations: [],
      };
    }

    // 获取该用户的所有邀请关系
    const userInvitations = [];
    for (const [id, rel] of demoInvitationRelationships.entries()) {
      if (rel.inviter_user_id === userId) {
        userInvitations.push(rel);
      }
    }

    const totalRewards = userInvitations.reduce((sum, rel) => sum + rel.total_rewards_given, 0);

    const invitations = userInvitations.map(rel => ({
      id: rel.id,
      inviteeUserId: rel.invitee_user_id,
      registrationDate: rel.created_at,
      registrationReward: rel.registration_reward_given ? 30 : 0,
      firstVideoReward: rel.first_video_reward_given ? Math.min(70, 100 - 30) : 0,
      totalReward: rel.total_rewards_given,
      status: rel.first_video_reward_given ? '已完成' : '待首次视频',
    }));

    return {
      invitationCode: userCode.invitation_code,
      totalInvited: userInvitations.length,
      totalRewards,
      invitations,
    };
  }

  // 生产模式实现：使用 TableStore
  try {
    const { InvitationsRepository } = await import('../../serverless/src/invitationsRepo.js');
    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new InvitationsRepository(instanceName);

    // 获取用户的邀请码
    const inviteCode = await repo.getInviteCodeByUser(userId);

    // 获取用户的所有邀请关系
    const invitations = await repo.getInvitationsByInviter(userId);

    const totalRewards = invitations.reduce((sum, inv) => sum + inv.totalRewardsGiven, 0);

    const formattedInvitations = invitations.map(inv => ({
      id: inv.invitationId,
      inviteeUserId: inv.inviteeUserId,
      registrationDate: new Date(inv.createdAt).toISOString(),
      registrationReward: inv.registrationRewardGiven ? 30 : 0,
      firstVideoReward: inv.firstVideoRewardGiven ? Math.min(70, 100 - 30) : 0,
      totalReward: inv.totalRewardsGiven,
      status: inv.firstVideoRewardGiven ? '已完成' : '待首次视频',
    }));

    return {
      invitationCode: inviteCode?.code || null,
      totalInvited: invitations.length,
      totalRewards,
      invitations: formattedInvitations,
    };
  } catch (error) {
    console.error('[INVITATIONS API] 生产模式获取邀请记录失败:', error);
    return {
      invitationCode: null,
      totalInvited: 0,
      totalRewards: 0,
      invitations: [],
    };
  }
}

// 触发首次视频奖励
async function triggerVideoReward(userId) {
  if (isDemoMode) {
    // 查找该用户作为被邀请者的关系
    let targetRelationship = null;
    for (const [id, rel] of demoInvitationRelationships.entries()) {
      if (rel.invitee_user_id === userId && !rel.first_video_reward_given) {
        targetRelationship = { id, ...rel };
        break;
      }
    }

    if (!targetRelationship) {
      return {
        success: false,
        message: '没有可发放的首次视频奖励',
      };
    }

    // 检查总奖励是否已达上限
    if (targetRelationship.total_rewards_given >= 100) {
      return {
        success: false,
        message: '邀请奖励已达上限',
      };
    }

    // 发放首次视频奖励
    const reward = Math.min(70, 100 - targetRelationship.total_rewards_given);
    targetRelationship.first_video_reward_given = true;
    targetRelationship.total_rewards_given += reward;

    demoInvitationRelationships.set(targetRelationship.id, targetRelationship);

    return {
      success: true,
      reward,
      inviterUserId: targetRelationship.inviter_user_id,
      message: `邀请者获得${reward}积分奖励`,
    };
  }

  // 生产模式实现：使用 TableStore
  try {
    const { InvitationsRepository } = await import('../../serverless/src/invitationsRepo.js');
    const { CreditsService } = await import('../../serverless/src/creditsService.js');

    const instanceName = process.env.TABESTORE_INSTANCE || 'i01wvvv53p0q';
    const repo = new InvitationsRepository(instanceName);
    const creditsService = new CreditsService(instanceName);

    // 1. 查找该用户作为被邀请者的关系
    const invitation = await repo.getInvitationByInvitee(userId);
    if (!invitation) {
      return {
        success: false,
        message: '没有找到邀请关系',
      };
    }

    // 2. 检查是否已经发放过首次视频奖励
    if (invitation.firstVideoRewardGiven) {
      return {
        success: false,
        message: '首次视频奖励已经发放过了',
      };
    }

    // 3. 检查总奖励是否已达上限
    if (invitation.totalRewardsGiven >= 100) {
      return {
        success: false,
        message: '邀请奖励已达上限',
      };
    }

    // 4. 计算奖励金额（最多70，但不能超过总上限100）
    const reward = Math.min(70, 100 - invitation.totalRewardsGiven);

    // 5. 发放积分奖励给邀请者
    const rewardSuccess = await creditsService.grantFirstVideoReward(
      invitation.inviterUserId,
      reward,
      invitation.invitationId
    );

    if (!rewardSuccess) {
      return {
        success: false,
        message: '积分发放失败',
      };
    }

    // 6. 更新邀请关系状态
    const updateSuccess = await repo.updateFirstVideoReward(
      invitation.invitationId,
      reward
    );

    if (!updateSuccess) {
      console.warn('[INVITATIONS API] 更新邀请关系状态失败，但积分已发放');
    }

    return {
      success: true,
      reward,
      inviterUserId: invitation.inviterUserId,
      message: `邀请者获得${reward}积分奖励`,
    };
  } catch (error) {
    console.error('[INVITATIONS API] 生产模式首次视频奖励失败:', error);
    return {
      success: false,
      message: '首次视频奖励发放失败，请稍后重试',
    };
  }
}

export default async function handler(req, res) {
  try {
    console.log('[INVITATIONS API] 请求:', req.method, req.url);
    console.log('[INVITATIONS API] 生产模式运行');

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

    const { action } = req.query;

    switch (action) {
      case 'my-code':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 风控检查
        const myCodeRateLimit = checkRateLimit(userId, 'MY_CODE');
        if (!myCodeRateLimit.allowed) {
          logInvitationEvent('rate_limit_exceeded', userId, {
            action: 'my-code',
            resetTime: myCodeRateLimit.resetTime
          });
          return res.status(429).json({
            error: 'Too many requests',
            resetTime: myCodeRateLimit.resetTime,
            limit: myCodeRateLimit.limit
          });
        }

        logInvitationEvent('my_code_request', userId);
        const codeData = await getMyCode(userId);
        logInvitationEvent('my_code_success', userId, {
          hasExistingCode: !!codeData?.invitation_code
        });
        return res.status(200).json({ success: true, data: codeData });

      case 'register-with-code':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 风控检查
        const registerRateLimit = checkRateLimit(userId, 'REGISTER_WITH_CODE');
        if (!registerRateLimit.allowed) {
          logInvitationEvent('rate_limit_exceeded', userId, {
            action: 'register-with-code',
            resetTime: registerRateLimit.resetTime
          });
          return res.status(429).json({
            error: 'Too many requests',
            resetTime: registerRateLimit.resetTime,
            limit: registerRateLimit.limit
          });
        }

        const { invitationCode } = req.body;
        if (!invitationCode) {
          logInvitationEvent('register_validation_failed', userId, {
            reason: 'missing_invitation_code'
          });
          return res.status(400).json({ error: 'Invitation code is required' });
        }

        logInvitationEvent('register_with_code_request', userId, { invitationCode });
        const registerResult = await registerWithCode(userId, invitationCode);

        if (registerResult.success) {
          logInvitationEvent('register_with_code_success', userId, {
            invitationCode,
            inviterUserId: registerResult.relationship?.inviter_user_id,
            rewards: registerResult.rewards
          });
        } else {
          logInvitationEvent('register_with_code_failed', userId, {
            invitationCode,
            reason: registerResult.message
          });
        }

        // 生产模式：后端统一处理邀请奖励
        return res.status(200).json(registerResult);

      case 'my-invitations':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 风控检查
        const invitationsRateLimit = checkRateLimit(userId, 'MY_INVITATIONS');
        if (!invitationsRateLimit.allowed) {
          logInvitationEvent('rate_limit_exceeded', userId, {
            action: 'my-invitations',
            resetTime: invitationsRateLimit.resetTime
          });
          return res.status(429).json({
            error: 'Too many requests',
            resetTime: invitationsRateLimit.resetTime,
            limit: invitationsRateLimit.limit
          });
        }

        logInvitationEvent('my_invitations_request', userId);
        const invitationsData = await getMyInvitations(userId);
        logInvitationEvent('my_invitations_success', userId, {
          totalInvited: invitationsData.totalInvited,
          totalRewards: invitationsData.totalRewards
        });
        return res.status(200).json({ success: true, data: invitationsData });

      case 'trigger-video-reward':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // 风控检查
        const videoRewardRateLimit = checkRateLimit(userId, 'TRIGGER_VIDEO_REWARD');
        if (!videoRewardRateLimit.allowed) {
          logInvitationEvent('rate_limit_exceeded', userId, {
            action: 'trigger-video-reward',
            resetTime: videoRewardRateLimit.resetTime
          });
          return res.status(429).json({
            error: 'Too many requests',
            resetTime: videoRewardRateLimit.resetTime,
            limit: videoRewardRateLimit.limit
          });
        }

        logInvitationEvent('trigger_video_reward_request', userId);
        const rewardResult = await triggerVideoReward(userId);

        if (rewardResult.success) {
          logInvitationEvent('trigger_video_reward_success', userId, {
            reward: rewardResult.reward,
            inviterUserId: rewardResult.inviterUserId
          });
        } else {
          logInvitationEvent('trigger_video_reward_failed', userId, {
            reason: rewardResult.message
          });
        }

        // DEMO: 首次视频奖励由后端代发给 inviter（≤70 分，受总上限 100 限制）
        if (isDemoMode && rewardResult && rewardResult.success && rewardResult.reward && rewardResult.inviterUserId) {
          await awardCreditsToUserDemo(
            rewardResult.inviterUserId,
            rewardResult.reward,
            'INVITATION_VIDEO_REWARD',
            token,
            req
          );
        }

        return res.status(200).json(rewardResult);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[INVITATIONS API] 处理请求时发生错误:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
