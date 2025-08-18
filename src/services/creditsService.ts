// 语言: TypeScript
// 说明: 积分系统服务类，处理所有积分相关的业务逻辑

import { authAdapter } from '../lib/adapters/authAdapter';
import { demoCreditsService } from './demoCreditsService';
import type {
  UserCredits,
  CreditTransaction,
  CreditBalanceResponse,
  CreditTransactionListResponse,
  DailySigninResponse,
  ConsumeCreditsRequest,
  ConsumeCreditsResponse,
  GenerateInviteCodeResponse,
  UseInviteCodeRequest,
  UseInviteCodeResponse,
} from '../types/credits';
import { CreditTransactionReason } from '../types/credits';

export class CreditsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  // 检查是否为演示模式
  private isDemoMode(): boolean {
    // 检查环境变量和配置来判断是否为演示模式
    const isLocalhost = typeof window !== 'undefined' &&
                       (window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1');

    const hasProductionKeys = !!(
      (import.meta as any).env?.VITE_SUPABASE_URL &&
      !(import.meta as any).env?.VITE_SUPABASE_URL.includes('demo') &&
      (import.meta as any).env?.VITE_DASHSCOPE_API_KEY
    );

    // 如果是本地开发或者没有生产环境密钥，使用演示模式
    const demoMode = isLocalhost || !hasProductionKeys;

    console.log('[CREDITS SERVICE] 演示模式检测:', {
      isLocalhost,
      hasProductionKeys,
      demoMode,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });

    return demoMode;
  }

  // 获取当前用户ID
  private async getCurrentUserId(): Promise<string> {
    const token = await authAdapter.getIdToken();
    if (!token) {
      throw new Error('用户未登录');
    }

    // 使用一个更稳定的用户ID生成方式
    // 在演示模式下，我们使用一个固定的用户ID
    if (this.isDemoMode()) {
      // 尝试从 localStorage 获取已存在的用户ID，如果没有则创建一个
      let demoUserId = localStorage.getItem('demo_user_id');
      if (!demoUserId) {
        demoUserId = `demo-user-${Date.now()}`;
        localStorage.setItem('demo_user_id', demoUserId);
      }
      return demoUserId;
    }

    // 生产模式下从 token 中提取用户ID
    return `user-${token.slice(-8)}`;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      console.log('[CREDITS SERVICE] 发起请求:', path);

      let token = await authAdapter.getIdToken();

      // 演示模式：如果无法获取真实 token，使用模拟 token
      if (!token) {
        console.log('[CREDITS SERVICE] 无法获取真实 token，使用演示模式 token');
        token = 'test-token-for-demo';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CREDITS SERVICE] 请求失败:', {
          path,
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[CREDITS SERVICE] 请求成功:', path, data);
      return data;
    } catch (error) {
      console.error('[CREDITS SERVICE] 请求异常:', path, error);
      throw error;
    }
  }

  // 获取用户积分余额
  async getCreditBalance(): Promise<CreditBalanceResponse> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      const credits = demoCreditsService.getUserCredits(userId);
      return {
        ...credits,
        totalEarned: credits.total_earned,
        totalSpent: credits.total_spent,
      };
    }
    return this.request<CreditBalanceResponse>('/api/credits/balance');
  }

  // 获取积分交易记录
  async getCreditTransactions(
    page: number = 1,
    limit: number = 20
  ): Promise<CreditTransactionListResponse> {
    const offset = (page - 1) * limit;
    return this.request<CreditTransactionListResponse>(
      `/api/credits/history?limit=${limit}&offset=${offset}`
    );
  }

  // 获取积分历史记录
  async getHistory(params: {
    limit?: number;
    offset?: number;
    type?: 'EARN' | 'SPEND';
    reason?: string;
  } = {}): Promise<any> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCreditsService.getTransactionHistory(
        userId,
        params.limit,
        params.offset,
        params.type,
        params.reason
      );
    }

    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.reason) queryParams.append('reason', params.reason);

    return this.request<any>(`/api/credits/history?${queryParams.toString()}`);
  }

  // 获取积分历史（新方法，支持更多过滤选项）
  async getCreditHistory(
    limit: number = 20,
    offset: number = 0,
    type?: 'EARN' | 'SPEND',
    reason?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (type) params.append('type', type);
    if (reason) params.append('reason', reason);

    return this.request(`/api/credits/history?${params.toString()}`);
  }

  // 每日签到
  async dailySignin(): Promise<DailySigninResponse> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      const result = demoCreditsService.dailySignin(userId);
      return {
        success: result.success,
        reward: result.reward || 0,
        message: result.message,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      };
    }
    return this.request<DailySigninResponse>('/api/credits/daily-signin', {
      method: 'POST',
    });
  }

  // 消费积分
  async consumeCredits(request: ConsumeCreditsRequest): Promise<ConsumeCreditsResponse> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      const result = demoCreditsService.createTransaction(
        userId,
        'SPEND',
        request.amount,
        request.reason,
        request.referenceId,
        request.description
      );
      return result;
    }
    return this.request<ConsumeCreditsResponse>('/api/credits/transaction', {
      method: 'POST',
      body: JSON.stringify({
        transactionType: 'SPEND',
        amount: request.amount,
        reason: request.reason,
        referenceId: request.referenceId,
        description: request.description,
      }),
    });
  }

  // 生成邀请码
  async generateInviteCode(): Promise<GenerateInviteCodeResponse> {
    return this.request<GenerateInviteCodeResponse>('/api/credits/invite/generate', {
      method: 'POST',
    });
  }

  // 使用邀请码
  async useInviteCode(request: UseInviteCodeRequest): Promise<UseInviteCodeResponse> {
    return this.request<UseInviteCodeResponse>('/api/credits/invite/use', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 点赞奖励（给点赞者）
  async rewardLikeGiven(artworkId: string): Promise<{ creditsEarned: number }> {
    return this.request<{ creditsEarned: number }>('/api/credits/like-given', {
      method: 'POST',
      body: JSON.stringify({ artworkId }),
    });
  }

  // 被点赞奖励（给作品创作者）
  async rewardLikeReceived(artworkId: string): Promise<{ creditsEarned: number }> {
    return this.request<{ creditsEarned: number }>('/api/credits/like-received', {
      method: 'POST',
      body: JSON.stringify({ artworkId }),
    });
  }

  // 检查是否有足够积分
  async checkSufficientCredits(amount: number): Promise<boolean> {
    try {
      const balance = await this.getCreditBalance();
      return balance.balance >= amount;
    } catch (error) {
      console.error('检查积分余额失败:', error);
      return false;
    }
  }

  // 视频生成消费积分的便捷方法
  async consumeCreditsForVideo(videoId: string): Promise<ConsumeCreditsResponse> {
    // 动态获取视频生成积分要求（演示环境1积分，生产环境60积分）
    const { getVideoGenerationCost } = await import('../config/demo');
    const requiredCredits = getVideoGenerationCost();

    return this.consumeCredits({
      amount: requiredCredits,
      reason: CreditTransactionReason.VIDEO_GENERATION,
      referenceId: videoId,
      description: '视频生成消费',
    });
  }

  // 格式化积分数量显示
  static formatCredits(credits: number): string {
    return credits.toLocaleString();
  }

  // 格式化交易记录显示
  static formatTransactionReason(reason: CreditTransactionReason): string {
    const reasonMap: Record<CreditTransactionReason, string> = {
      [CreditTransactionReason.REGISTRATION]: '注册奖励',
      [CreditTransactionReason.DAILY_SIGNIN]: '每日签到',
      [CreditTransactionReason.INVITE_REGISTER]: '邀请注册奖励',
      [CreditTransactionReason.INVITE_FIRST_VIDEO]: '邀请首次生成视频奖励',
      [CreditTransactionReason.INVITATION_REWARD]: '邀请新用户奖励',
      [CreditTransactionReason.INVITATION_BONUS]: '邀请码注册奖励',
      [CreditTransactionReason.INVITATION_VIDEO_REWARD]: '被邀请用户首次视频奖励',
      [CreditTransactionReason.LIKE_RECEIVED]: '被点赞奖励',
      [CreditTransactionReason.LIKE_GIVEN]: '点赞奖励',
      [CreditTransactionReason.PURCHASE]: '购买积分',
      [CreditTransactionReason.VIDEO_GENERATION]: '视频生成',
    };
    return reasonMap[reason] || reason;
  }
}

export const creditsService = new CreditsService();
