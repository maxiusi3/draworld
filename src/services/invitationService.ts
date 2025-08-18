import { authAdapter } from '../lib/adapters/authAdapter';

export interface InvitationCode {
  code: string;
  userId: string;
  createdAt: string;
  usageCount: number;
  maxUsage: number;
}

export interface Invitation {
  id: string;
  code: string;
  inviterId: string;
  inviteeId: string | null;
  status: 'pending' | 'used' | 'expired';
  createdAt: string;
  usedAt: string | null;
  rewardClaimed: boolean;
}

export interface InvitationSummary {
  totalInvitations: number;
  usedInvitations: number;
  pendingInvitations: number;
  totalRewards: number;
  recentInvitations: Invitation[];
}

export interface InvitationRegistrationResult {
  success: boolean;
  message: string;
  reward?: number;
  newBalance?: number;
}

class InvitationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      const token = await authAdapter.getIdToken();
      if (!token) throw new Error('无法获取认证令牌');

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
      console.error('[INVITATION SERVICE] 请求异常:', error);
      throw error;
    }
  }

  async getMyInvitationCode(): Promise<InvitationCode> {
    const response = await this.request<{ success: boolean; data: InvitationCode }>('/api/invitations?action=my-code');
    if (!response.success) throw new Error('获取邀请码失败');
    return response.data;
  }

  async registerWithInvitationCode(invitationCode: string): Promise<InvitationRegistrationResult> {
    const response = await this.request<InvitationRegistrationResult>('/api/invitations?action=register-with-code', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    });

    if (!response.success) throw new Error(response.message || '使用邀请码失败');
    return response;
  }

  async getMyInvitations(): Promise<InvitationSummary> {
    const response = await this.request<{ success: boolean; data: InvitationSummary }>('/api/invitations?action=my-invitations');
    if (!response.success) throw new Error('获取邀请记录失败');
    return response.data;
  }

  async getInvitations(page: number = 1, limit: number = 20): Promise<{
    invitations: Invitation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.request<{
      success: boolean;
      data: Invitation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/invitations?action=list&page=${page}&limit=${limit}`);

    if (!response.success) throw new Error('获取邀请列表失败');
    return { invitations: response.data, pagination: response.pagination };
  }

  async generateInvitationCode(): Promise<InvitationCode> {
    const response = await this.request<{ success: boolean; data: InvitationCode }>('/api/invitations?action=generate', {
      method: 'POST'
    });

    if (!response.success) throw new Error('生成邀请码失败');
    return response.data;
  }

  async validateInvitationCode(code: string): Promise<{
    valid: boolean;
    message: string;
    inviterInfo?: {
      username: string;
      avatar?: string;
    };
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        valid: boolean;
        message: string;
        inviterInfo?: {
          username: string;
          avatar?: string;
        };
      }>(`/api/invitations?action=validate&code=${encodeURIComponent(code)}`);

      return {
        valid: response.valid,
        message: response.message,
        inviterInfo: response.inviterInfo
      };
    } catch (error) {
      return { valid: false, message: '验证邀请码时发生错误' };
    }
  }

  async getInvitationRewards(): Promise<{
    totalRewards: number;
    unclaimedRewards: number;
    rewardHistory: Array<{
      id: string;
      amount: number;
      reason: string;
      createdAt: string;
      claimed: boolean;
    }>;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        totalRewards: number;
        unclaimedRewards: number;
        rewardHistory: Array<{
          id: string;
          amount: number;
          reason: string;
          createdAt: string;
          claimed: boolean;
        }>;
      };
    }>('/api/invitations?action=rewards');

    if (!response.success) throw new Error('获取邀请奖励失败');
    return response.data;
  }

  async claimInvitationReward(rewardId: string): Promise<{
    success: boolean;
    message: string;
    amount?: number;
    newBalance?: number;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      amount?: number;
      newBalance?: number;
    }>('/api/invitations?action=claim-reward', {
      method: 'POST',
      body: JSON.stringify({ rewardId })
    });

    if (!response.success) throw new Error(response.message || '领取奖励失败');
    return response;
  }

  async getInvitationStats(): Promise<{
    totalInvited: number;
    successfulInvitations: number;
    totalRewardsEarned: number;
    conversionRate: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        totalInvited: number;
        successfulInvitations: number;
        totalRewardsEarned: number;
        conversionRate: number;
      };
    }>('/api/invitations?action=stats');

    if (!response.success) throw new Error('获取邀请统计失败');
    return response.data;
  }

  // 向后兼容的方法
  async handleInvitationFromUrl(): Promise<InvitationRegistrationResult> {
    // 简化实现
    return { success: false, message: '未找到邀请码' };
  }

  async triggerFirstVideoReward(): Promise<{ success: boolean; message: string; reward?: number }> {
    // 简化实现
    return { success: false, message: '功能暂未实现' };
  }

  async copyInvitationLink(code: string): Promise<boolean> {
    try {
      const link = `${window.location.origin}?invitation=${code}`;
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      return false;
    }
  }

  extractInvitationCodeFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('invitation');
  }

  generateInvitationLink(code: string): string {
    return `${window.location.origin}?invitation=${code}`;
  }
}

export const invitationService = new InvitationService();
