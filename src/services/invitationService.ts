// 邀请奖励系统服务类
import { authAdapter } from '../lib/adapters/authAdapter';
import { demoInvitationService } from './demoInvitationService';

interface InvitationCode {
  id: string;
  user_id: string;
  invitation_code: string;
  is_active: boolean;
  created_at: string;
}

interface InvitationRecord {
  id: string;
  inviteeUserId: string;
  registrationDate: string;
  registrationReward: number;
  firstVideoReward: number;
  totalReward: number;
  status: string;
}

interface InvitationSummary {
  invitationCode: string;
  totalInvited: number;
  totalRewards: number;
  invitations: InvitationRecord[];
}

interface InvitationRegistrationResult {
  success: boolean;
  message: string;
  rewards?: {
    inviter: number;
    invitee: number;
  };
}

interface VideoRewardResult {
  success: boolean;
  reward?: number;
  inviterUserId?: string;
  message?: string;
}

class InvitationService {
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

    console.log('[INVITATION SERVICE] 演示模式检测:', {
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
    
    if (this.isDemoMode()) {
      let demoUserId = localStorage.getItem('demo_user_id');
      if (!demoUserId) {
        demoUserId = `demo-user-${Date.now()}`;
        localStorage.setItem('demo_user_id', demoUserId);
      }
      return demoUserId;
    }
    
    return `user-${token.slice(-8)}`;
  }

  // 通用请求方法
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      console.log('[INVITATION SERVICE] 发起请求:', path);

      let token = await authAdapter.getIdToken();

      if (!token) {
        console.log('[INVITATION SERVICE] 无法获取真实 token，使用演示模式 token');
        token = 'test-token-for-demo';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (options?.headers) {
        Object.assign(headers, options.headers);
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[INVITATION SERVICE] 请求失败:', {
          path,
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[INVITATION SERVICE] 请求成功:', path, data);
      return data;
    } catch (error: any) {
      console.error('[INVITATION SERVICE] 请求异常:', path, error);
      throw error;
    }
  }

  // 获取用户的邀请码
  async getMyInvitationCode(): Promise<InvitationCode> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoInvitationService.getUserInvitationCode(userId);
    }

    const response = await this.request<{ success: boolean; data: InvitationCode }>('/api/invitations?action=my-code');
    return response.data;
  }

  // 使用邀请码注册
  async registerWithInvitationCode(invitationCode: string): Promise<InvitationRegistrationResult> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoInvitationService.processInvitationRegistration(invitationCode, userId);
    }

    const response = await this.request<InvitationRegistrationResult>('/api/invitations?action=register-with-code', {
      method: 'POST',
      body: JSON.stringify({ invitationCode }),
    });
    return response;
  }

  // 获取用户的邀请记录
  async getMyInvitations(): Promise<InvitationSummary> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      const demoData = demoInvitationService.getUserInvitations(userId);

      // 转换为符合InvitationSummary接口的格式
      return {
        invitationCode: demoData.invitationCode,
        totalInvited: demoData.totalInvited,
        totalRewards: demoData.totalRewards,
        invitations: demoData.invitations.map((inv, index) => ({
          id: `demo-inv-${Date.now()}-${index}`,
          inviteeUserId: inv.inviteeUserId,
          registrationDate: inv.registrationDate,
          registrationReward: inv.registrationReward,
          firstVideoReward: inv.firstVideoReward,
          totalReward: inv.totalReward,
          status: inv.status,
        })),
      };
    }

    const response = await this.request<{ success: boolean; data: InvitationSummary }>('/api/invitations?action=my-invitations');
    return response.data;
  }

  // 触发首次视频奖励
  async triggerFirstVideoReward(): Promise<VideoRewardResult> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoInvitationService.processFirstVideoReward(userId);
    }

    const response = await this.request<VideoRewardResult>('/api/invitations?action=trigger-video-reward', {
      method: 'POST',
    });
    return response;
  }

  // 生成邀请链接
  generateInvitationLink(invitationCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?invite=${invitationCode}`;
  }

  // 从URL中提取邀请码
  extractInvitationCodeFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('invite');
  }

  // 检查URL中是否有邀请码并处理
  async handleInvitationFromUrl(): Promise<{ hasInvitation: boolean; result?: InvitationRegistrationResult }> {
    const invitationCode = this.extractInvitationCodeFromUrl();
    
    if (!invitationCode) {
      return { hasInvitation: false };
    }

    try {
      const result = await this.registerWithInvitationCode(invitationCode);
      
      // 清除URL中的邀请码参数
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('invite');
        window.history.replaceState({}, '', url.toString());
      }
      
      return { hasInvitation: true, result };
    } catch (error) {
      console.error('处理邀请码失败:', error);
      return { hasInvitation: true, result: { success: false, message: '处理邀请码失败' } };
    }
  }

  // 复制邀请链接到剪贴板
  async copyInvitationLink(invitationCode: string): Promise<boolean> {
    try {
      const link = this.generateInvitationLink(invitationCode);
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      console.error('复制邀请链接失败:', error);
      return false;
    }
  }
}

export const invitationService = new InvitationService();
export type { InvitationCode, InvitationRecord, InvitationSummary, InvitationRegistrationResult, VideoRewardResult };
