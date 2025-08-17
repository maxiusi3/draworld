// 语言: TypeScript
// 说明: Supabase 客户端配置和初始化

import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 禁用 Supabase 自带的认证，因为我们使用 Authing
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 数据库表类型定义
export interface UserCredits {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  daily_like_given: number;
  last_daily_reset: string; // YYYY-MM-DD 格式
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'EARN' | 'SPEND';
  amount: number;
  balance_after: number;
  reason: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

// 积分规则常量
export const CREDIT_RULES = {
  REGISTRATION_REWARD: 150,
  DAILY_SIGNIN_REWARD: 15,
  VIDEO_GENERATION_COST: 60,
  INVITE_REGISTER_REWARD: 30,
  INVITE_FIRST_VIDEO_REWARD: 70,
  LIKE_RECEIVED_PER_5: 1,
  LIKE_GIVEN_PER_10: 1,
  DAILY_SOCIAL_LIMIT: 5,
} as const;

// 交易原因枚举
export enum CreditTransactionReason {
  REGISTRATION = 'REGISTRATION',
  DAILY_SIGNIN = 'DAILY_SIGNIN',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  INVITE_REGISTER = 'INVITE_REGISTER',
  INVITE_FIRST_VIDEO = 'INVITE_FIRST_VIDEO',
  LIKE_RECEIVED = 'LIKE_RECEIVED',
  LIKE_GIVEN = 'LIKE_GIVEN',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

// 积分服务类
export class SupabaseCreditsService {
  
  // 获取用户积分余额
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      console.log('[SUPABASE CREDITS] 获取用户积分:', userId);
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 用户不存在，返回 null
          console.log('[SUPABASE CREDITS] 用户积分记录不存在');
          return null;
        }
        throw error;
      }

      console.log('[SUPABASE CREDITS] 获取积分成功:', data);
      return data;
    } catch (error) {
      console.error('[SUPABASE CREDITS] 获取用户积分失败:', error);
      throw error;
    }
  }

  // 创建或更新用户积分账户
  async upsertUserCredits(credits: Partial<UserCredits> & { user_id: string }): Promise<UserCredits> {
    try {
      console.log('[SUPABASE CREDITS] 更新用户积分:', credits);
      
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      const upsertData = {
        user_id: credits.user_id,
        balance: credits.balance ?? 0,
        total_earned: credits.total_earned ?? 0,
        total_spent: credits.total_spent ?? 0,
        daily_like_given: credits.daily_like_given ?? 0,
        last_daily_reset: credits.last_daily_reset ?? today,
        created_at: credits.created_at ?? now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('user_credits')
        .upsert(upsertData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      console.log('[SUPABASE CREDITS] 更新积分成功:', data);
      return data;
    } catch (error) {
      console.error('[SUPABASE CREDITS] 更新用户积分失败:', error);
      throw error;
    }
  }

  // 创建积分交易记录
  async createTransaction(transaction: Omit<CreditTransaction, 'id' | 'created_at'>): Promise<CreditTransaction> {
    try {
      console.log('[SUPABASE CREDITS] 创建交易记录:', transaction);
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert({
          ...transaction,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[SUPABASE CREDITS] 创建交易记录成功:', data);
      return data;
    } catch (error) {
      console.error('[SUPABASE CREDITS] 创建交易记录失败:', error);
      throw error;
    }
  }

  // 获取用户积分历史记录
  async getUserTransactions(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<CreditTransaction[]> {
    try {
      console.log('[SUPABASE CREDITS] 获取交易历史:', { userId, limit, offset });
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      console.log('[SUPABASE CREDITS] 获取交易历史成功:', data?.length);
      return data || [];
    } catch (error) {
      console.error('[SUPABASE CREDITS] 获取交易历史失败:', error);
      throw error;
    }
  }

  // 执行积分交易（原子操作）
  async executeTransaction(
    userId: string,
    transactionType: 'EARN' | 'SPEND',
    amount: number,
    reason: CreditTransactionReason,
    referenceId?: string,
    description?: string
  ): Promise<{ success: boolean; newBalance?: number; transactionId?: string }> {
    try {
      console.log('[SUPABASE CREDITS] 执行积分交易:', {
        userId,
        transactionType,
        amount,
        reason,
        referenceId,
        description
      });

      // 获取当前用户积分
      let userCredits = await this.getUserCredits(userId);
      
      // 如果用户不存在，创建新用户
      if (!userCredits) {
        userCredits = await this.upsertUserCredits({
          user_id: userId,
          balance: 0,
          total_earned: 0,
          total_spent: 0,
        });
      }

      // 计算新余额
      const currentBalance = userCredits.balance;
      let newBalance: number;
      let newTotalEarned = userCredits.total_earned;
      let newTotalSpent = userCredits.total_spent;

      if (transactionType === 'EARN') {
        newBalance = currentBalance + amount;
        newTotalEarned += amount;
      } else {
        // 检查余额是否充足
        if (currentBalance < amount) {
          console.log('[SUPABASE CREDITS] 余额不足:', { currentBalance, amount });
          return { success: false };
        }
        newBalance = currentBalance - amount;
        newTotalSpent += amount;
      }

      // 更新用户积分
      await this.upsertUserCredits({
        user_id: userId,
        balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: newTotalSpent,
      });

      // 创建交易记录
      const transaction = await this.createTransaction({
        user_id: userId,
        transaction_type: transactionType,
        amount,
        balance_after: newBalance,
        reason,
        reference_id: referenceId,
        description,
      });

      console.log('[SUPABASE CREDITS] 积分交易成功:', {
        transactionId: transaction.id,
        newBalance
      });

      return {
        success: true,
        newBalance,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('[SUPABASE CREDITS] 执行积分交易失败:', error);
      return { success: false };
    }
  }
}

// 导出单例实例
export const creditsService = new SupabaseCreditsService();
