// 语言: TypeScript
// 说明: 积分系统服务，基于TableStore实现

import * as TableStore from 'tablestore';

// 积分规则常量
export const CREDIT_RULES = {
  REGISTRATION_REWARD: 150,
  DAILY_SIGNIN_REWARD: 15,
  INVITE_REGISTER_REWARD: 30,
  INVITE_FIRST_VIDEO_REWARD: 70,
  LIKE_RECEIVED_PER_5: 1,
  LIKE_GIVEN_PER_10: 1,
  LIKE_GIVEN_DAILY_LIMIT: 5,
  VIDEO_GENERATION_COST: 60,
  LIKE_THRESHOLD_FOR_REWARD: 5,
  LIKE_GIVEN_THRESHOLD_FOR_REWARD: 10,
} as const;

export enum CreditTransactionType {
  EARN = 'EARN',
  SPEND = 'SPEND'
}

export enum CreditTransactionReason {
  REGISTRATION = 'REGISTRATION',
  DAILY_SIGNIN = 'DAILY_SIGNIN',
  INVITE_REGISTER = 'INVITE_REGISTER',
  INVITE_FIRST_VIDEO = 'INVITE_FIRST_VIDEO',
  INVITATION_REWARD = 'INVITATION_REWARD',           // 邀请者奖励
  INVITATION_BONUS = 'INVITATION_BONUS',             // 被邀请者奖励
  INVITATION_VIDEO_REWARD = 'INVITATION_VIDEO_REWARD', // 首次视频奖励
  LIKE_RECEIVED = 'LIKE_RECEIVED',
  LIKE_GIVEN = 'LIKE_GIVEN',
  PURCHASE = 'PURCHASE',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
}

export interface UserCredits {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyLikeGiven: number;
  lastDailyReset: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  reason: CreditTransactionReason;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export class CreditsService {
  private client: any;
  private instanceName: string;

  constructor(instanceName: string) {
    this.instanceName = instanceName;
    this.client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
      endpoint: `https://${instanceName}.cn-hangzhou.ots.aliyuncs.com`,
      instancename: instanceName,
    });
  }

  // 获取用户积分账户
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const params = {
        tableName: 'user_credits',
        primaryKey: [{ 'userId': userId }],
      };

      const result = await this.client.getRow(params);
      if (!result.row || !result.row.attributes) {
        return null;
      }

      const attrs = result.row.attributes;
      return {
        userId,
        balance: attrs.balance?.[0] || 0,
        totalEarned: attrs.totalEarned?.[0] || 0,
        totalSpent: attrs.totalSpent?.[0] || 0,
        dailyLikeGiven: attrs.dailyLikeGiven?.[0] || 0,
        lastDailyReset: attrs.lastDailyReset?.[0] || new Date().toISOString().split('T')[0],
        createdAt: attrs.createdAt?.[0] || new Date().toISOString(),
        updatedAt: attrs.updatedAt?.[0] || new Date().toISOString(),
      };
    } catch (error) {
      console.error('获取用户积分失败:', error);
      return null;
    }
  }

  // 创建或更新用户积分账户
  async upsertUserCredits(credits: Partial<UserCredits> & { userId: string }): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const params = {
        tableName: 'user_credits',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
        primaryKey: [{ 'userId': credits.userId }],
        attributeColumns: [
          { 'balance': credits.balance || 0 },
          { 'totalEarned': credits.totalEarned || 0 },
          { 'totalSpent': credits.totalSpent || 0 },
          { 'dailyLikeGiven': credits.dailyLikeGiven || 0 },
          { 'lastDailyReset': credits.lastDailyReset || new Date().toISOString().split('T')[0] },
          { 'createdAt': credits.createdAt || now },
          { 'updatedAt': now },
        ],
      };

      await this.client.putRow(params);
      return true;
    } catch (error) {
      console.error('更新用户积分失败:', error);
      return false;
    }
  }

  // 记录积分交易
  async recordTransaction(transaction: Omit<CreditTransaction, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const params = {
        tableName: 'credit_transactions',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'userId': transaction.userId },
          { 'transactionId': transactionId }
        ],
        attributeColumns: [
          { 'type': transaction.type },
          { 'amount': transaction.amount },
          { 'reason': transaction.reason },
          { 'referenceId': transaction.referenceId || '' },
          { 'description': transaction.description || '' },
          { 'createdAt': now },
        ],
      };

      await this.client.putRow(params);
      return transactionId;
    } catch (error) {
      console.error('记录积分交易失败:', error);
      return null;
    }
  }

  // 执行积分交易（原子操作）
  async executeTransaction(
    userId: string,
    type: CreditTransactionType,
    amount: number,
    reason: CreditTransactionReason,
    referenceId?: string,
    description?: string
  ): Promise<{ success: boolean; newBalance?: number; transactionId?: string }> {
    try {
      // 获取当前积分
      let userCredits = await this.getUserCredits(userId);
      
      // 如果用户不存在，创建新账户
      if (!userCredits) {
        userCredits = {
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          dailyLikeGiven: 0,
          lastDailyReset: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // 检查余额是否足够（消费时）
      if (type === CreditTransactionType.SPEND && userCredits.balance < amount) {
        return { success: false };
      }

      // 计算新余额
      const newBalance = type === CreditTransactionType.EARN 
        ? userCredits.balance + amount 
        : userCredits.balance - amount;

      // 更新统计
      const newTotalEarned = type === CreditTransactionType.EARN 
        ? userCredits.totalEarned + amount 
        : userCredits.totalEarned;
      const newTotalSpent = type === CreditTransactionType.SPEND 
        ? userCredits.totalSpent + amount 
        : userCredits.totalSpent;

      // 更新用户积分
      const updateSuccess = await this.upsertUserCredits({
        ...userCredits,
        balance: newBalance,
        totalEarned: newTotalEarned,
        totalSpent: newTotalSpent,
      });

      if (!updateSuccess) {
        return { success: false };
      }

      // 记录交易
      const transactionId = await this.recordTransaction({
        userId,
        type,
        amount,
        reason,
        referenceId,
        description,
      });

      return {
        success: true,
        newBalance,
        transactionId: transactionId || undefined,
      };
    } catch (error) {
      console.error('执行积分交易失败:', error);
      return { success: false };
    }
  }

  // 每日签到
  async dailySignin(userId: string): Promise<{ success: boolean; creditsEarned: number; alreadySignedToday: boolean }> {
    const userCredits = await this.getUserCredits(userId);
    const today = new Date().toISOString().split('T')[0];

    // 检查今日是否已签到
    if (userCredits && userCredits.lastDailyReset === today) {
      return { success: true, creditsEarned: 0, alreadySignedToday: true };
    }

    // 执行签到奖励
    const result = await this.executeTransaction(
      userId,
      CreditTransactionType.EARN,
      CREDIT_RULES.DAILY_SIGNIN_REWARD,
      CreditTransactionReason.DAILY_SIGNIN,
      undefined,
      '每日签到奖励'
    );

    if (result.success) {
      // 更新签到日期
      const updatedCredits = await this.getUserCredits(userId);
      if (updatedCredits) {
        await this.upsertUserCredits({
          ...updatedCredits,
          lastDailyReset: today,
          dailyLikeGiven: 0, // 重置每日点赞计数
        });
      }
    }

    return {
      success: result.success,
      creditsEarned: result.success ? CREDIT_RULES.DAILY_SIGNIN_REWARD : 0,
      alreadySignedToday: false,
    };
  }

  // 新用户注册奖励
  async grantRegistrationReward(userId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      userId,
      CreditTransactionType.EARN,
      CREDIT_RULES.REGISTRATION_REWARD,
      CreditTransactionReason.REGISTRATION,
      undefined,
      '新用户注册奖励'
    );
    return result.success;
  }

  // 邀请者奖励（注册时）
  async grantInviterReward(inviterUserId: string, referenceId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      inviterUserId,
      CreditTransactionType.EARN,
      CREDIT_RULES.INVITE_REGISTER_REWARD,
      CreditTransactionReason.INVITATION_REWARD,
      referenceId,
      '邀请新用户奖励'
    );
    return result.success;
  }

  // 被邀请者奖励（注册时）
  async grantInviteeReward(inviteeUserId: string, referenceId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      inviteeUserId,
      CreditTransactionType.EARN,
      50, // 被邀请者获得50积分
      CreditTransactionReason.INVITATION_BONUS,
      referenceId,
      '使用邀请码注册额外奖励'
    );
    return result.success;
  }

  // 首次视频奖励（给邀请者）
  async grantFirstVideoReward(inviterUserId: string, amount: number, referenceId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      inviterUserId,
      CreditTransactionType.EARN,
      amount,
      CreditTransactionReason.INVITATION_VIDEO_REWARD,
      referenceId,
      '被邀请用户首次视频奖励'
    );
    return result.success;
  }

  // 购买积分
  async grantPurchaseCredits(userId: string, amount: number, orderId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      userId,
      CreditTransactionType.EARN,
      amount,
      CreditTransactionReason.PURCHASE,
      orderId,
      '购买积分'
    );
    return result.success;
  }

  // 社交奖励：作品获得点赞奖励
  async grantLikeReceivedReward(authorId: string, likeCount: number, artworkId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      authorId,
      CreditTransactionType.EARN,
      1,
      CreditTransactionReason.LIKE_RECEIVED,
      artworkId,
      `作品获得${likeCount}个点赞奖励`
    );
    return result.success;
  }

  // 社交奖励：点赞他人奖励
  async grantLikeGivenReward(likerId: string, dailyLikeCount: number, artworkId: string): Promise<boolean> {
    const result = await this.executeTransaction(
      likerId,
      CreditTransactionType.EARN,
      1,
      CreditTransactionReason.LIKE_GIVEN,
      artworkId,
      `给他人点赞${dailyLikeCount}次奖励`
    );
    return result.success;
  }

  // 检查是否需要重置每日数据
  private isNewDay(lastResetTimestamp: number): boolean {
    const today = new Date();
    const lastReset = new Date(lastResetTimestamp);
    return today.toDateString() !== lastReset.toDateString();
  }

  // 更新用户每日点赞数并检查奖励
  async updateDailyLikeCount(userId: string): Promise<{
    dailyLikeCount: number;
    shouldReward: boolean;
    reachedLimit: boolean;
  }> {
    try {
      // 获取用户积分信息
      const userCredits = await this.getUserCredits(userId);
      if (!userCredits) {
        return { dailyLikeCount: 0, shouldReward: false, reachedLimit: false };
      }

      const now = Date.now();
      let dailyLikeGiven = userCredits.dailyLikeGiven || 0;
      let lastDailyReset = userCredits.lastDailyReset || now;

      // 检查是否需要重置每日数据
      if (this.isNewDay(lastDailyReset)) {
        dailyLikeGiven = 0;
        lastDailyReset = now;
      }

      // 增加每日点赞数
      dailyLikeGiven += 1;

      // 更新用户积分表
      const params = {
        tableName: 'user_credits',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [{ 'userId': userId }],
        attributeColumns: [
          { 'dailyLikeGiven': dailyLikeGiven },
          { 'lastDailyReset': lastDailyReset },
          { 'updatedAt': now },
        ],
      };

      await this.client.updateRow(params);

      // 检查是否应该发放奖励
      const LIKES_PER_REWARD = 10;
      const MAX_DAILY_REWARDED_LIKES = 50;
      const shouldReward = dailyLikeGiven % LIKES_PER_REWARD === 0;
      const reachedLimit = dailyLikeGiven >= MAX_DAILY_REWARDED_LIKES;

      return {
        dailyLikeCount: dailyLikeGiven,
        shouldReward,
        reachedLimit,
      };
    } catch (error) {
      console.error('更新每日点赞数失败:', error);
      return { dailyLikeCount: 0, shouldReward: false, reachedLimit: false };
    }
  }

  // 处理社交奖励逻辑
  async processSocialRewards(
    likerId: string,
    authorId: string,
    artworkId: string,
    newLikeCount: number,
    isLiking: boolean
  ): Promise<{
    success: boolean;
    authorReward?: number;
    likerReward?: number;
    messages: string[];
  }> {
    const result = {
      success: true,
      messages: [] as string[],
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
        const authorRewardSuccess = await this.grantLikeReceivedReward(authorId, newLikeCount, artworkId);
        if (authorRewardSuccess) {
          result.authorReward = 1;
          result.messages.push(`作品获得${LIKES_PER_AUTHOR_REWARD}个点赞，作者获得1积分奖励！`);
        }
      }

      // 2. 检查点赞者是否应该获得点赞奖励
      const likeUpdate = await this.updateDailyLikeCount(likerId);

      if (!likeUpdate.reachedLimit) {
        if (likeUpdate.shouldReward) {
          const likerRewardSuccess = await this.grantLikeGivenReward(likerId, likeUpdate.dailyLikeCount, artworkId);
          if (likerRewardSuccess) {
            result.likerReward = 1;
            result.messages.push('今日点赞10次，获得1积分奖励！');
          }
        }

        const remaining = 50 - likeUpdate.dailyLikeCount;
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
      console.error('处理社交奖励失败:', error);
      result.success = false;
      result.messages.push('奖励处理失败');
      return result;
    }
  }
}
