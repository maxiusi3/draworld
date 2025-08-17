// 语言: TypeScript
// 说明: 积分系统相关的React Hooks

import { useState, useEffect, useCallback } from 'react';
import { creditsService } from '../services/creditsService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';
import type {
  CreditBalanceResponse,
  CreditTransactionListResponse,
  DailySigninResponse,
  ConsumeCreditsResponse,
} from '../types/credits';

// 积分余额Hook
export function useCreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchBalance = useCallback(async () => {
    if (!currentUser) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await creditsService.getCreditBalance();
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取积分余额失败');
      console.error('获取积分余额失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
  };
}

// 积分交易记录Hook
export function useCreditTransactions() {
  const [transactions, setTransactions] = useState<CreditTransactionListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchTransactions = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await creditsService.getCreditTransactions(page, limit);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取交易记录失败');
      console.error('获取交易记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
  };
}

// 每日签到Hook
export function useDailySignin() {
  const [loading, setLoading] = useState(false);
  const { refreshBalance } = useCreditBalance();

  const signin = useCallback(async (): Promise<DailySigninResponse | null> => {
    try {
      setLoading(true);
      const result = await creditsService.dailySignin();
      
      if (result.success && !result.alreadySignedToday) {
        toast.success(`签到成功！获得 ${result.creditsEarned} 积分`);
        refreshBalance(); // 刷新余额
      } else if (result.alreadySignedToday) {
        toast('今日已签到', { icon: 'ℹ️' });
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '签到失败';
      toast.error(message);
      console.error('签到失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  return {
    signin,
    loading,
  };
}

// 积分消费Hook
export function useConsumeCredits() {
  const [loading, setLoading] = useState(false);
  const { balance, refreshBalance } = useCreditBalance();

  const consumeCredits = useCallback(async (
    amount: number,
    reason: string,
    referenceId?: string,
    description?: string
  ): Promise<ConsumeCreditsResponse | null> => {
    // 检查余额是否足够
    if (!balance || balance.balance < amount) {
      toast.error('积分余额不足');
      return null;
    }

    try {
      setLoading(true);
      const result = await creditsService.consumeCredits({
        amount,
        reason: reason as any,
        referenceId,
        description,
      });

      if (result.success) {
        toast.success(`消费 ${amount} 积分成功`);
        refreshBalance(); // 刷新余额
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '积分消费失败';
      toast.error(message);
      console.error('积分消费失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [balance, refreshBalance]);

  const consumeCreditsForVideo = useCallback(async (videoId: string) => {
    // 动态获取视频生成积分要求（演示环境1积分，生产环境60积分）
    const { getVideoGenerationCost } = await import('../config/demo');
    const requiredCredits = getVideoGenerationCost();

    return consumeCredits(requiredCredits, 'VIDEO_GENERATION', videoId, '视频生成');
  }, [consumeCredits]);

  return {
    consumeCredits,
    consumeCreditsForVideo,
    loading,
    hasSufficientCredits: (amount: number) => balance ? balance.balance >= amount : false,
  };
}

// 邀请系统Hook
export function useInviteSystem() {
  const [loading, setLoading] = useState(false);
  const { refreshBalance } = useCreditBalance();

  const generateInviteCode = useCallback(async () => {
    try {
      setLoading(true);
      const result = await creditsService.generateInviteCode();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成邀请码失败';
      toast.error(message);
      console.error('生成邀请码失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const useInviteCode = useCallback(async (inviteCode: string) => {
    try {
      setLoading(true);
      const result = await creditsService.useInviteCode({ inviteCode });
      
      if (result.success) {
        toast.success(`使用邀请码成功！获得 ${result.creditsEarned} 积分`);
        refreshBalance();
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '使用邀请码失败';
      toast.error(message);
      console.error('使用邀请码失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  return {
    generateInviteCode,
    useInviteCode,
    loading,
  };
}
