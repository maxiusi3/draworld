// 语言: TypeScript
// 说明: 订单超时处理Hook

import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';

interface UseOrderTimeoutOptions {
  orderId: string | null;
  expiredAt: string | null;
  onTimeout?: () => void;
  onStatusChange?: (status: string) => void;
  checkInterval?: number; // 检查间隔，默认5秒
}

interface OrderTimeoutState {
  timeLeft: number;
  isExpired: boolean;
  isChecking: boolean;
  lastStatus: string | null;
}

export const useOrderTimeout = ({
  orderId,
  expiredAt,
  onTimeout,
  onStatusChange,
  checkInterval = 5000
}: UseOrderTimeoutOptions) => {
  const [state, setState] = useState<OrderTimeoutState>({
    timeLeft: 0,
    isExpired: false,
    isChecking: false,
    lastStatus: null
  });

  // 计算剩余时间
  const calculateTimeLeft = useCallback(() => {
    if (!expiredAt) return 0;
    
    const now = new Date().getTime();
    const expiredTime = new Date(expiredAt).getTime();
    return Math.max(0, expiredTime - now);
  }, [expiredAt]);

  // 检查订单状态
  const checkOrderStatus = useCallback(async () => {
    if (!orderId || state.isExpired) return;

    try {
      setState(prev => ({ ...prev, isChecking: true }));
      
      const status = await paymentService.getPaymentStatus(orderId);
      
      if (status.status !== state.lastStatus) {
        setState(prev => ({ ...prev, lastStatus: status.status }));
        onStatusChange?.(status.status);
        
        // 如果订单已完成或失败，停止检查
        if (['PAID', 'FAILED', 'CANCELLED'].includes(status.status)) {
          setState(prev => ({ ...prev, isExpired: true }));
          return;
        }
      }
      
      // 检查是否过期
      if (status.isExpired) {
        setState(prev => ({ ...prev, isExpired: true }));
        onTimeout?.();
        toast.error('订单已超时，请重新下单');
      }
      
    } catch (error) {
      console.error('检查订单状态失败:', error);
    } finally {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, [orderId, state.isExpired, state.lastStatus, onStatusChange, onTimeout]);

  // 倒计时效果
  useEffect(() => {
    if (!expiredAt || state.isExpired) return;

    const updateTimer = () => {
      const timeLeft = calculateTimeLeft();
      setState(prev => ({ ...prev, timeLeft }));
      
      if (timeLeft === 0 && !state.isExpired) {
        setState(prev => ({ ...prev, isExpired: true }));
        onTimeout?.();
        toast.error('订单已超时');
      }
    };

    updateTimer(); // 立即执行一次
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expiredAt, state.isExpired, calculateTimeLeft, onTimeout]);

  // 定期检查订单状态
  useEffect(() => {
    if (!orderId || state.isExpired) return;

    checkOrderStatus(); // 立即检查一次
    const statusChecker = setInterval(checkOrderStatus, checkInterval);

    return () => clearInterval(statusChecker);
  }, [orderId, state.isExpired, checkOrderStatus, checkInterval]);

  // 格式化时间显示
  const formatTimeLeft = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 手动刷新状态
  const refreshStatus = useCallback(() => {
    if (orderId && !state.isExpired) {
      checkOrderStatus();
    }
  }, [orderId, state.isExpired, checkOrderStatus]);

  return {
    timeLeft: state.timeLeft,
    timeLeftFormatted: formatTimeLeft(state.timeLeft),
    isExpired: state.isExpired,
    isChecking: state.isChecking,
    lastStatus: state.lastStatus,
    refreshStatus
  };
};

// 订单超时管理Hook
export const useOrderTimeoutManager = () => {
  const [timeoutOrders, setTimeoutOrders] = useState<string[]>([]);

  // 添加需要监控的订单
  const addOrder = useCallback((orderId: string) => {
    setTimeoutOrders(prev => {
      if (!prev.includes(orderId)) {
        return [...prev, orderId];
      }
      return prev;
    });
  }, []);

  // 移除订单监控
  const removeOrder = useCallback((orderId: string) => {
    setTimeoutOrders(prev => prev.filter(id => id !== orderId));
  }, []);

  // 清理所有超时订单
  const cleanupExpiredOrders = useCallback(async (orderIds: string[]) => {
    try {
      const response = await fetch('/api/orders/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('订单清理完成:', result.results);
        
        // 移除已处理的订单
        result.results.processedOrders.forEach((order: any) => {
          removeOrder(order.orderId);
        });
        
        return result.results;
      } else {
        console.error('订单清理失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('调用订单清理接口失败:', error);
      return null;
    }
  }, [removeOrder]);

  return {
    timeoutOrders,
    addOrder,
    removeOrder,
    cleanupExpiredOrders
  };
};
