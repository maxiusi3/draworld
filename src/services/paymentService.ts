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
    // 临时模拟API响应用于测试
    if (path === '/api/credits/packages') {
      return {
        packages: [
          {
            id: 'basic',
            name: '基础套餐',
            credits: 300,
            bonusCredits: 50,
            priceYuan: 19.9,
            originalPrice: 29.9,
            isPopular: false,
            isActive: true,
            sortOrder: 1,
            description: '适合轻度使用',
          },
          {
            id: 'popular',
            name: '热门套餐',
            credits: 800,
            bonusCredits: 200,
            priceYuan: 49.9,
            originalPrice: 69.9,
            isPopular: true,
            isActive: true,
            sortOrder: 2,
            description: '最受欢迎的选择',
          },
          {
            id: 'premium',
            name: '高级套餐',
            credits: 2000,
            bonusCredits: 600,
            priceYuan: 99.9,
            originalPrice: 139.9,
            isPopular: false,
            isActive: true,
            sortOrder: 3,
            description: '超值大容量',
          },
          {
            id: 'ultimate',
            name: '至尊套餐',
            credits: 5000,
            bonusCredits: 2000,
            priceYuan: 199.9,
            originalPrice: 299.9,
            isPopular: false,
            isActive: true,
            sortOrder: 4,
            description: '无限创作可能',
          },
        ],
      } as T;
    }

    if (path === '/api/orders' && options?.method === 'POST') {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        order: {
          id: orderId,
          userId: 'test-user',
          packageId: 'test-package',
          packageName: '测试套餐',
          credits: 1000,
          amount: 49.9,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟后过期
        },
        paymentInfo: {
          paymentId: `pay_${Date.now()}`,
          paymentUrl: 'https://example.com/pay',
          qrCode: 'mock-qr-code-data',
          expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      } as T;
    }

    // 原始API调用逻辑（当后端准备好时使用）
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
    return this.request<CreditPackagesResponse>('/api/credits/packages');
  }

  // 创建订单
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 获取订单详情
  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${orderId}`);
  }

  // 获取用户订单列表
  async getOrders(page: number = 1, limit: number = 20): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(
      `/api/orders?page=${page}&limit=${limit}`
    );
  }

  // 查询支付状态
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    return this.request<PaymentStatusResponse>(`/api/orders/${orderId}/status`);
  }

  // 取消订单
  async cancelOrder(orderId: string): Promise<void> {
    await this.request<void>(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
    });
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

  // 格式化折扣显示
  static formatDiscount(originalPrice: number, currentPrice: number): string {
    const discount = this.calculateDiscountPercentage(originalPrice, currentPrice);
    return discount > 0 ? `${discount}% OFF` : '';
  }
}

export const paymentService = new PaymentService();
