// 语言: TypeScript
// 说明: 积分系统相关的 React Hooks

import { useState, useEffect, useCallback } from 'react';
import { creditsService } from '../services/creditsService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

// 积分余额 Hook
export const useCreditBalance = () => {
  const { currentUser: user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const credits = await creditsService.getCreditBalance();
      setBalance(credits.balance || 0);
    } catch (err: any) {
      console.error('获取积分余额失败:', err);
      setError(err.message || '获取积分余额失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  return {
    balance,
    loading,
    error,
    refresh: loadBalance,
    setBalance, // 导出 setBalance 函数以便其他 hooks 使用
  };
};

// 积分消费 Hook
export const useConsumeCredits = () => {
  const { balance, refresh: refreshBalance, setBalance } = useCreditBalance();
  const [loading, setLoading] = useState(false);

  const consumeCredits = useCallback(async (
    amount: number,
    reason: string,
    referenceId?: string,
    description?: string
  ) => {
    try {
      console.log('[CONSUME CREDITS] 开始消费积分:', { amount, reason, referenceId, description });
      setLoading(true);

      // 检查余额是否充足
      if (balance !== null && balance < amount) {
        console.log('[CONSUME CREDITS] 余额不足:', { balance, amount });
        toast.error(`积分余额不足，需要 ${amount} 积分，当前余额 ${balance} 积分`);
        return false;
      }

      console.log('[CONSUME CREDITS] 调用 creditsService.consumeCredits...');
      const result = await creditsService.consumeCredits({
        amount,
        reason: reason as any,
        referenceId,
        description,
      });

      console.log('[CONSUME CREDITS] creditsService 返回结果:', result);

      if (result.success) {
        console.log('[CONSUME CREDITS] 积分消费成功');
        toast.success(`成功消费 ${amount} 积分`);

        // 立即更新本地余额状态，而不是等待 API 刷新
        if (result.newBalance !== undefined) {
          console.log('[CONSUME CREDITS] 立即更新本地余额:', result.newBalance);
          setBalance(result.newBalance);
        } else {
          // 如果没有返回新余额，则刷新
          await refreshBalance();
        }
        return true;
      } else {
        console.log('[CONSUME CREDITS] 积分消费失败:', result.error);
        toast.error(result.error || '积分消费失败');
        return false;
      }
    } catch (error: any) {
      console.error('[CONSUME CREDITS] 消费积分异常:', error);
      toast.error(error.message || '积分消费失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [balance, refreshBalance]);

  const consumeCreditsForVideo = useCallback(async (videoId: string) => {
    // 动态获取视频生成积分要求（演示环境1积分，生产环境60积分）
    const { getVideoGenerationCost } = await import('../config/production');
    const requiredCredits = getVideoGenerationCost();

    return consumeCredits(requiredCredits, 'VIDEO_GENERATION', videoId, '视频生成消费');
  }, [consumeCredits]);

  const hasSufficientCredits = useCallback((amount: number) => {
    return balance !== null && balance >= amount;
  }, [balance]);

  return {
    consumeCredits,
    consumeCreditsForVideo,
    hasSufficientCredits,
    loading,
  };
};

// 每日签到 Hook
export const useDailySignin = () => {
  const { refresh: refreshBalance, setBalance } = useCreditBalance();
  const [loading, setLoading] = useState(false);

  const signin = useCallback(async () => {
    try {
      setLoading(true);
      const result = await creditsService.dailySignin();

      if (result.success) {
        toast.success(result.message || `签到成功！获得${result.reward}积分`);

        // 立即更新本地余额状态
        if (result.newBalance !== undefined) {
          console.log('[DAILY SIGNIN] 立即更新本地余额:', result.newBalance);
          setBalance(result.newBalance);
        } else {
          // 如果没有返回新余额，则刷新
          await refreshBalance();
        }
        return true;
      } else {
        toast.error(result.message || '签到失败');
        return false;
      }
    } catch (error: any) {
      console.error('每日签到失败:', error);
      if (error.message?.includes('今天已经签到过了')) {
        toast.error('今天已经签到过了');
      } else {
        toast.error(error.message || '签到失败，请稍后重试');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshBalance]);

  return {
    signin,
    loading,
  };
};

// 积分历史 Hook
export const useCreditHistory = (limit: number = 20) => {
  const { currentUser: user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadHistory = useCallback(async (reset: boolean = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const result = await creditsService.getCreditHistory(limit, currentOffset);
      
      if (reset) {
        setTransactions(result.transactions || []);
        setOffset(limit);
      } else {
        setTransactions(prev => [...prev, ...(result.transactions || [])]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(result.pagination?.hasMore || false);
    } catch (err: any) {
      console.error('获取积分历史失败:', err);
      setError(err.message || '获取积分历史失败');
    } finally {
      setLoading(false);
    }
  }, [user, limit, offset]);

  const refresh = useCallback(() => {
    setOffset(0);
    loadHistory(true);
  }, [loadHistory]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(false);
    }
  }, [loading, hasMore, loadHistory]);

  useEffect(() => {
    refresh();
  }, [user]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  };
};

// 积分检查 Hook（用于显示不足提示）
export const useCreditCheck = () => {
  const { balance } = useCreditBalance();
  const { signin } = useDailySignin();

  const checkSufficient = useCallback((requiredAmount: number) => {
    return balance !== null && balance >= requiredAmount;
  }, [balance]);

  const getShortfall = useCallback((requiredAmount: number) => {
    if (balance === null) return 0;
    return Math.max(0, requiredAmount - balance);
  }, [balance]);

  return {
    balance: balance || 0,
    checkSufficient,
    getShortfall,
    signin,
  };
};
