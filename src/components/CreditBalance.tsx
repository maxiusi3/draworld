// 语言: TypeScript
// 说明: 积分余额显示组件

import React, { useState, useEffect, useCallback } from 'react';
import { Coins, RefreshCw, Gift, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { creditsService } from '../services/creditsService';
import { useAuth } from '../hooks/useAuthContext';
import toast from 'react-hot-toast';

interface CreditBalanceProps {
  showSigninButton?: boolean;
  className?: string;
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  showSigninButton = true,
  className = ''
}) => {
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // 加载积分余额
  const loadBalance = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const credits = await creditsService.getCreditBalance();
      setBalance(credits.balance || 0);
    } catch (error) {
      console.error('获取积分余额失败:', error);
      // 不显示错误提示，避免干扰用户体验
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 监听积分变化以实时更新
  useEffect(() => {
    const handleCreditsUpdate = () => {
      loadBalance();
    };

    // 监听自定义事件（当积分发生变化时触发）
    window.addEventListener('creditsUpdated', handleCreditsUpdate);

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    };
  }, [user, loadBalance]);

  // 每日签到
  const handleDailySignin = async () => {
    if (!user || signingIn) return;

    try {
      setSigningIn(true);
      console.log('[CREDIT BALANCE] 开始签到...');
      const result = await creditsService.dailySignin();
      console.log('[CREDIT BALANCE] 签到结果:', result);

      if (result.success) {
        toast.success(result.message || `签到成功！获得${result.reward}积分`);
        setBalance(result.newBalance || (balance || 0) + result.reward);
        // 重新加载余额以确保数据同步
        setTimeout(() => loadBalance(), 500);
      } else {
        toast.error(result.message || '签到失败');
      }
    } catch (error: any) {
      console.error('每日签到失败:', error);
      if (error.message?.includes('今天已经签到过了')) {
        toast.error('今天已经签到过了');
      } else {
        toast.error('签到失败，请稍后重试');
      }
    } finally {
      setSigningIn(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBalance();
  }, [user, loadBalance]);

  // 如果用户未登录，不显示组件
  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 积分余额显示 - 可点击查看历史 */}
      <button
        onClick={() => navigate('/credit-history')}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 px-3 py-2 rounded-lg border border-yellow-200 transition-all duration-200 group"
        title="点击查看积分历史"
      >
        <Coins className="w-5 h-5 text-yellow-600" />
        <span className="font-semibold text-gray-800">
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            balance !== null ? balance.toLocaleString() : '--'
          )}
        </span>
        <span className="text-sm text-gray-600">积分</span>
        <History className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>

      {/* 每日签到按钮 */}
      {showSigninButton && (
        <button
          onClick={handleDailySignin}
          disabled={signingIn}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <Gift className="w-4 h-4" />
          {signingIn ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              签到中...
            </>
          ) : (
            '每日签到'
          )}
        </button>
      )}

      {/* 刷新按钮 */}
      <button
        onClick={loadBalance}
        disabled={loading}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="刷新积分余额"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

// 简化版积分显示组件（仅显示数字）
export const SimpleCreditBalance: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentUser: user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadBalance = async () => {
      try {
        const credits = await creditsService.getCreditBalance();
        setBalance(credits.balance || 0);
      } catch (error) {
        console.error('获取积分余额失败:', error);
      }
    };

    loadBalance();
  }, [user]);

  if (!user || balance === null) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Coins className="w-4 h-4 text-yellow-600" />
      <span className="font-medium text-gray-800">{balance.toLocaleString()}</span>
    </div>
  );
};
