// 语言: TypeScript
// 说明: 支付相关的React Hooks

import { useState, useEffect, useCallback } from 'react';
import { paymentService, PaymentService } from '../services/paymentService';
import { useCreditBalance } from './useCredits';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';
import type {
  CreditPackage,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderListResponse,
  PaymentStatusResponse,
} from '../types/credits';
import { PaymentMethod } from '../types/credits';

// 积分套餐Hook
export function useCreditPackages() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getCreditPackages();
      setPackages(response.packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取套餐列表失败');
      console.error('获取套餐列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    loading,
    error,
    refresh: fetchPackages,
  };
}

// 创建订单Hook
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const { refreshBalance } = useCreditBalance();

  const createOrder = useCallback(async (request: CreateOrderRequest): Promise<CreateOrderResponse | null> => {
    try {
      setLoading(true);
      const response = await paymentService.createOrder(request);
      toast.success('订单创建成功！');
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建订单失败';
      toast.error(message);
      console.error('创建订单失败:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrderAndPay = useCallback(async (
    packageId: string, 
    paymentMethod: PaymentMethod,
    onPaymentSuccess?: () => void
  ): Promise<string | null> => {
    const response = await createOrder({ packageId, paymentMethod });
    if (!response) return null;

    // 开始轮询支付状态
    paymentService.pollPaymentStatus(
      response.order.id,
      (status: PaymentStatusResponse) => {
        if (status.status === 'PAID') {
          toast.success(`支付成功！获得 ${status.creditsAdded} 积分`);
          refreshBalance(); // 刷新积分余额
          onPaymentSuccess?.();
        } else if (status.status === 'FAILED') {
          toast.error('支付失败，请重试');
        } else if (status.status === 'CANCELLED') {
          toast('支付已取消', { icon: 'ℹ️' });
        }
      }
    );

    return response.order.id;
  }, [createOrder, refreshBalance]);

  return {
    createOrder,
    createOrderAndPay,
    loading,
  };
}

// 订单列表Hook
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const { currentUser } = useAuth();

  const fetchOrders = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getOrders(page);
      
      if (append) {
        setOrders(prev => [...prev, ...response.orders]);
      } else {
        setOrders(response.orders);
      }
      
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取订单列表失败');
      console.error('获取订单列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = Math.floor(orders.length / 20) + 1;
    await fetchOrders(nextPage, true);
  }, [hasMore, loading, orders.length, fetchOrders]);

  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}

// 订单详情Hook
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      const orderData = await paymentService.getOrder(orderId);
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取订单详情失败');
      console.error('获取订单详情失败:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const cancelOrder = useCallback(async (): Promise<boolean> => {
    if (!order || !PaymentService.canCancelOrder(order)) {
      toast.error('订单无法取消');
      return false;
    }

    try {
      await paymentService.cancelOrder(order.id);
      toast.success('订单已取消');
      await fetchOrder(); // 刷新订单状态
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '取消订单失败';
      toast.error(message);
      console.error('取消订单失败:', err);
      return false;
    }
  }, [order, fetchOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refresh: fetchOrder,
    cancelOrder,
  };
}

// 支付状态轮询Hook
export function usePaymentStatus(orderId: string, enabled: boolean = true) {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshBalance } = useCreditBalance();

  useEffect(() => {
    if (!orderId || !enabled) return;

    setLoading(true);
    
    paymentService.pollPaymentStatus(
      orderId,
      (statusResponse: PaymentStatusResponse) => {
        setStatus(statusResponse);
        setLoading(false);
        
        if (statusResponse.status === 'PAID') {
          refreshBalance(); // 支付成功后刷新积分余额
        }
      }
    );
  }, [orderId, enabled, refreshBalance]);

  return {
    status,
    loading,
  };
}

// 支付方式选择Hook
export function usePaymentMethod() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.WECHAT);
  const [availableMethods] = useState<PaymentMethod[]>([
    PaymentMethod.WECHAT,
    PaymentMethod.ALIPAY,
  ]);

  const getMethodInfo = useCallback((method: PaymentMethod) => {
    const methodInfo = {
      [PaymentMethod.WECHAT]: {
        name: '微信支付',
        icon: '💬',
        description: '使用微信扫码支付',
        color: 'bg-green-500',
      },
      [PaymentMethod.ALIPAY]: {
        name: '支付宝',
        icon: '💰',
        description: '使用支付宝扫码支付',
        color: 'bg-blue-500',
      },
    };
    return methodInfo[method];
  }, []);

  return {
    selectedMethod,
    setSelectedMethod,
    availableMethods,
    getMethodInfo,
  };
}
