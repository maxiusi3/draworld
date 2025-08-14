// 语言: TypeScript
// 说明: 积分系统服务，基于TableStore实现

import TableStore from 'tablestore';

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
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
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
}
