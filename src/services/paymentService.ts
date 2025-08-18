// 语言: TypeScript
// 说明: 积分购买和支付服务类

import { authAdapter } from '../lib/adapters/authAdapter';
import type {
  CreditPackage,
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderListResponse,
  PaymentStatusResponse,
  CreditPackagesResponse,
} from '../types/credits';
import { PaymentMethod } from '../types/credits';

export class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    // 从localStorage获取认证会话
    const authSession = localStorage.getItem('auth_session');
    let token = null;

    if (authSession) {
      try {
        const session = JSON.parse(authSession);
        // 优先使用id_token，因为API端使用id_token进行用户身份验证
        token = session.tokens?.id_token || session.tokens?.access_token;
      } catch (error) {
        console.error('解析认证会话失败:', error);
      }
    }

    if (!token) {
      throw new Error('用户未登录，请先登录');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }



  // 实际的API请求方法
  private async requestReal<T>(path: string, options?: RequestInit): Promise<T> {
    const token = await authAdapter.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // 获取积分套餐列表
  async getCreditPackages(): Promise<CreditPackagesResponse> {
    const result = await this.request<any>('/api/commerce?action=orders&subAction=packages');
    return {
      packages: result.packages || [],
    };
  }

  // 创建订单
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const result = await this.request<any>('/api/commerce?action=orders&subAction=create', {
        method: 'POST',
        body: JSON.stringify({ packageId: request.packageId }),
      });

      return {
        success: result.success,
        order: result.order,
        paymentInfo: result.paymentInfo,
        message: result.message,
      };
    } catch (error) {
      console.error('创建订单失败:', error);
      return {
        success: false,
        message: '创建订单失败，请稍后重试',
      };
    }
  }

  // 获取订单详情
  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${orderId}`);
  }

  // 获取用户订单列表
  async getOrders(page: number = 1, limit: number = 20): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(
      `/api/commerce?action=orders&subAction=list&page=${page}&limit=${limit}`
    );
  }

  // 查询支付状态
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    return this.request<PaymentStatusResponse>(`/api/orders/${orderId}/status`);
  }

  // 取消订单
  async cancelOrder(orderId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.request<void>(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      return {
        success: true,
        message: '订单已取消'
      };
    } catch (error) {
      console.error('取消订单失败:', error);
      return {
        success: false,
        message: '取消订单失败，请稍后重试'
      };
    }
  }

  // 获取用户订单列表
  async getUserOrders(limit: number = 10, offset: number = 0): Promise<{
    success: boolean;
    orders: any[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      const response = await this.request<{ orders: any[] }>(`/api/commerce?action=orders&subAction=list&limit=${limit}&offset=${offset}`);
      const orders = response.orders || [];

      return {
        success: true,
        orders,
        hasMore: orders.length === limit, // 如果返回的数量等于limit，可能还有更多
        total: orders.length
      };
    } catch (error) {
      console.error('获取用户订单失败:', error);
      return {
        success: false,
        orders: [],
        hasMore: false,
        total: 0
      };
    }
  }

  // 轮询支付状态
  async pollPaymentStatus(
    orderId: string,
    onStatusChange: (status: PaymentStatusResponse) => void,
    maxAttempts: number = 60, // 最多轮询60次（5分钟）
    interval: number = 5000   // 每5秒轮询一次
  ): Promise<void> {
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await this.getPaymentStatus(orderId);
        onStatusChange(status);

        // 如果支付完成或失败，停止轮询
        if (status.status === 'PAID' || status.status === 'FAILED' || status.status === 'CANCELLED') {
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('轮询支付状态失败:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        }
      }
    };

    poll();
  }

  // 获取订单状态（用于usePayment hook）
  async getOrderStatus(orderId: string): Promise<{
    success: boolean;
    order?: { status: string };
    message?: string;
  }> {
    try {
      const response = await this.request<any>(`/api/commerce?action=orders&subAction=status&orderId=${orderId}`);
      return {
        success: true,
        order: response.order
      };
    } catch (error) {
      console.error('获取订单状态失败:', error);
      return {
        success: false,
        message: '获取订单状态失败'
      };
    }
  }

  // 轮询订单状态（用于usePayment hook）
  async pollOrderStatus(
    orderId: string,
    onStatusChange: (status: string) => void,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<string> {
    return new Promise((resolve) => {
      let attempts = 0;

      const poll = async () => {
        try {
          const result = await this.getOrderStatus(orderId);

          if (result.success && result.order) {
            const status = result.order.status;
            onStatusChange(status);

            // 如果支付完成或失败，停止轮询
            if (status === 'PAID' || status === 'FAILED' || status === 'CANCELLED') {
              resolve(status);
              return;
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, interval);
          } else {
            resolve('TIMEOUT');
          }
        } catch (error) {
          console.error('轮询订单状态失败:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, interval);
          } else {
            resolve('ERROR');
          }
        }
      };

      poll();
    });
  }

  // 格式化价格显示
  static formatPrice(price: number): string {
    return `¥${price.toFixed(2)}`;
  }

  // 计算性价比
  static calculateValueRatio(credits: number, bonusCredits: number, price: number): number {
    const totalCredits = credits + bonusCredits;
    return totalCredits / price;
  }

  // 格式化性价比显示
  static formatValueRatio(ratio: number): string {
    return `${ratio.toFixed(1)}倍`;
  }

  // 格式化折扣显示
  static formatDiscount(originalPrice: number, currentPrice: number): string {
    const discountPercent = Math.round((1 - currentPrice / originalPrice) * 100);
    return `${discountPercent}% OFF`;
  }

  // 获取支付方式显示名称
  static getPaymentMethodName(method: PaymentMethod): string {
    const methodNames = {
      [PaymentMethod.WECHAT]: '微信支付',
      [PaymentMethod.ALIPAY]: '支付宝',
    };
    return methodNames[method] || method;
  }

  // 获取订单状态显示名称
  static getOrderStatusName(status: string): string {
    const statusNames = {
      'PENDING': '待支付',
      'PAID': '已支付',
      'FAILED': '支付失败',
      'CANCELLED': '已取消',
      'REFUNDED': '已退款',
    };
    return statusNames[status as keyof typeof statusNames] || status;
  }

  // 获取订单状态颜色
  static getOrderStatusColor(status: string): string {
    const statusColors = {
      'PENDING': 'text-yellow-600 bg-yellow-100',
      'PAID': 'text-green-600 bg-green-100',
      'FAILED': 'text-red-600 bg-red-100',
      'CANCELLED': 'text-gray-600 bg-gray-100',
      'REFUNDED': 'text-blue-600 bg-blue-100',
    };
    return statusColors[status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100';
  }

  // 检查订单是否可以取消
  static canCancelOrder(order: Order): boolean {
    return order.status === 'PENDING' && new Date(order.expiredAt || '') > new Date();
  }

  // 检查订单是否已过期
  static isOrderExpired(order: Order): boolean {
    return order.status === 'PENDING' && 
           order.expiredAt && 
           new Date(order.expiredAt) <= new Date();
  }

  // 生成订单号
  static generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
  }

  // 验证支付金额
  static validatePaymentAmount(pkg: CreditPackage, amount: number): boolean {
    return Math.abs(pkg.priceYuan - amount) < 0.01; // 允许1分钱的误差
  }

  // 计算折扣百分比
  static calculateDiscountPercentage(originalPrice: number, currentPrice: number): number {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }


}

export const paymentService = new PaymentService();
