// 语言: TypeScript
// 说明: 积分系统服务类，处理所有积分相关的业务逻辑

import { authAdapter } from '../lib/adapters/authAdapter';
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

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
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

  // 获取用户积分余额
  async getCreditBalance(): Promise<CreditBalanceResponse> {
    return this.request<CreditBalanceResponse>('/api/credits/balance');
  }

  // 获取积分交易记录
  async getCreditTransactions(
    page: number = 1,
    limit: number = 20
  ): Promise<CreditTransactionListResponse> {
    return this.request<CreditTransactionListResponse>(
      `/api/credits/transactions?page=${page}&limit=${limit}`
    );
  }

  // 每日签到
  async dailySignin(): Promise<DailySigninResponse> {
    return this.request<DailySigninResponse>('/api/credits/daily-signin', {
      method: 'POST',
    });
  }

  // 消费积分
  async consumeCredits(request: ConsumeCreditsRequest): Promise<ConsumeCreditsResponse> {
    return this.request<ConsumeCreditsResponse>('/api/credits/consume', {
      method: 'POST',
      body: JSON.stringify(request),
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
    return this.consumeCredits({
      amount: 60, // CREDIT_RULES.VIDEO_GENERATION_COST
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
      [CreditTransactionReason.LIKE_RECEIVED]: '被点赞奖励',
      [CreditTransactionReason.LIKE_GIVEN]: '点赞奖励',
      [CreditTransactionReason.PURCHASE]: '购买积分',
      [CreditTransactionReason.VIDEO_GENERATION]: '视频生成',
    };
    return reasonMap[reason] || reason;
  }
}

export const creditsService = new CreditsService();
