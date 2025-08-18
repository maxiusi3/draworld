// 内容审核服务
export interface ModerationItem {
  id: string;
  type: 'artwork' | 'comment';
  title: string;
  content: string;
  author: string;
  authorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reportCount?: number;
  reportReasons?: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  artworkId?: string; // 对于评论，关联的作品ID
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  todayProcessed: number;
}

export interface ModerationListResponse {
  success: boolean;
  items: ModerationItem[];
  total: number;
  hasMore: boolean;
}

export interface ModerationFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  type?: 'all' | 'artwork' | 'comment';
  search?: string;
  limit?: number;
  offset?: number;
}

class ModerationService {
  private baseUrl = '/api/admin/moderation';

  private async request(endpoint: string, options: RequestInit = {}) {
    // 从localStorage获取认证会话
    const authSession = localStorage.getItem('auth_session');
    let token = null;

    if (authSession) {
      try {
        const session = JSON.parse(authSession);
        token = session.tokens?.access_token;
      } catch (error) {
        console.error('解析认证会话失败:', error);
      }
    }

    if (!token) {
      throw new Error('用户未登录，请先登录');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取待审核内容列表
  async getModerationItems(filters: ModerationFilters = {}): Promise<ModerationListResponse> {
    try {
      const params = new URLSearchParams();
      params.append('action', 'list');
      
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const result = await this.request(`?${params.toString()}`);
      return result;
    } catch (error) {
      console.error('获取审核列表失败:', error);
      throw new Error('获取审核列表失败');
    }
  }

  // 更新审核状态
  async updateModerationStatus(
    itemId: string,
    itemType: 'artwork' | 'comment',
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.request('?action=update', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          itemType,
          status,
          reason,
        }),
      });

      return result;
    } catch (error) {
      console.error('更新审核状态失败:', error);
      return {
        success: false,
        message: '更新审核状态失败，请稍后重试',
      };
    }
  }

  // 批准内容
  async approveContent(itemId: string, itemType: 'artwork' | 'comment'): Promise<{ success: boolean; message?: string }> {
    return this.updateModerationStatus(itemId, itemType, 'APPROVED');
  }

  // 拒绝内容
  async rejectContent(
    itemId: string,
    itemType: 'artwork' | 'comment',
    reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.updateModerationStatus(itemId, itemType, 'REJECTED', reason);
  }

  // 获取审核统计信息
  async getModerationStats(): Promise<ModerationStats> {
    try {
      const result = await this.request('?action=stats');
      return result.stats;
    } catch (error) {
      console.error('获取审核统计失败:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        todayProcessed: 0,
      };
    }
  }

  // 批量操作
  async batchUpdateStatus(
    items: Array<{ id: string; type: 'artwork' | 'comment' }>,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<{ success: boolean; processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const result = await this.updateModerationStatus(item.id, item.type, status, reason);
        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
    };
  }

  // 获取内容详情（用于详细审核）
  async getContentDetail(itemId: string, itemType: 'artwork' | 'comment'): Promise<ModerationItem | null> {
    try {
      // 这里可以调用具体的内容API获取详细信息
      // 暂时通过列表API获取
      const result = await this.getModerationItems({ limit: 1000 });
      return result.items.find(item => item.id === itemId && item.type === itemType) || null;
    } catch (error) {
      console.error('获取内容详情失败:', error);
      return null;
    }
  }

  // 举报内容（用户端功能）
  async reportContent(
    itemId: string,
    itemType: 'artwork' | 'comment',
    reason: string,
    description?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 这里应该调用举报API
      // 暂时返回成功
      console.log('举报内容:', { itemId, itemType, reason, description });
      return {
        success: true,
        message: '举报已提交，我们会尽快处理',
      };
    } catch (error) {
      console.error('举报内容失败:', error);
      return {
        success: false,
        message: '举报失败，请稍后重试',
      };
    }
  }
}

export const moderationService = new ModerationService();
