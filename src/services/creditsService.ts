import { authAdapter } from '../lib/adapters/authAdapter';

export interface CreditBalance {
  balance: number;
  lastUpdated: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface CreditHistory {
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CreditsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      // 从localStorage获取认证会话，优先使用id_token进行身份验证
      const authSession = localStorage.getItem('auth_session');
      let token = null;

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          // 优先使用id_token，因为API端使用id_token进行用户身份验证
          token = session.tokens?.id_token || session.tokens?.access_token;
          console.log('[CREDITS SERVICE] 使用token:', token ? token.substring(0, 20) + '...' : 'null');
        } catch (error) {
          console.error('[CREDITS SERVICE] 解析认证会话失败:', error);
        }
      }

      if (!token) {
        throw new Error('用户未登录，请先登录');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[CREDITS SERVICE] 请求异常:', error);
      throw error;
    }
  }

  async getCreditBalance(): Promise<CreditBalance> {
    const response = await this.request<{
      success: boolean;
      balance: number;
      lastUpdated: string;
    }>('/api/credits?action=balance');

    if (!response.success) throw new Error('获取积分余额失败');
    return { balance: response.balance, lastUpdated: response.lastUpdated };
  }
  
  async getBalance(): Promise<CreditBalance> {
    return this.getCreditBalance();
  }

  async createTransaction(amount: number, reason: string, description?: string): Promise<CreditTransaction> {
    const response = await this.request<{
      success: boolean;
      transaction: CreditTransaction;
      newBalance: number;
    }>('/api/credits?action=transaction', {
      method: 'POST',
      body: JSON.stringify({ amount, reason, description: description || '' })
    });

    if (!response.success) throw new Error('创建积分交易失败');
    return response.transaction;
  }

  async getCreditHistory(options?: { limit?: number; offset?: number }): Promise<CreditHistory> {
    const page = Math.floor((options?.offset || 0) / (options?.limit || 20)) + 1;
    const limit = options?.limit || 20;
    return this.getHistory(page, limit);
  }

  async getHistory(page: number = 1, limit: number = 20): Promise<CreditHistory> {
    const response = await this.request<{
      success: boolean;
      transactions: CreditTransaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number; };
    }>(`/api/credits?action=history&page=${page}&limit=${limit}`);

    if (!response.success) throw new Error('获取积分历史失败');
    return { transactions: response.transactions, pagination: response.pagination };
  }

  async dailySignin(): Promise<{
    success: boolean;
    message: string;
    reward: number;
    newBalance: number;
    consecutiveDays: number;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      reward: number;
      newBalance: number;
      consecutiveDays: number;
    }>('/api/credits?action=daily-signin', { method: 'POST' });

    if (!response.success) throw new Error('每日签到失败');
    return response;
  }

  async consumeCredits(options: { amount: number; reason: string; description?: string }): Promise<CreditTransaction> {
    return this.deductCredits(options.amount, options.reason, options.description);
  }

  async deductCredits(amount: number, reason: string, description?: string): Promise<CreditTransaction> {
    if (amount > 0) amount = -amount;
    return this.createTransaction(amount, reason, description);
  }

  async addCredits(amount: number, reason: string, description?: string): Promise<CreditTransaction> {
    if (amount < 0) amount = Math.abs(amount);
    return this.createTransaction(amount, reason, description);
  }

  async hasEnoughCredits(requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance();
      return balance.balance >= requiredAmount;
    } catch (error) {
      return false;
    }
  }

  getInsufficientCreditsMessage(required: number, current: number): string {
    const shortage = required - current;
    return `积分不足！需要 ${required} 积分，当前余额 ${current} 积分，还需要 ${shortage} 积分。`;
  }
}

export const creditsService = new CreditsService();
