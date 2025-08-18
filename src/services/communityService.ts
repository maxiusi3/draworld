// 社区服务类
import { authAdapter } from '../lib/adapters/authAdapter';
import { demoCommunityService, DemoArtwork, DemoArtworkComment } from './demoCommunityService';
import { socialRewardService, SocialRewardResult } from './socialRewardService';
import { errorHandler, withRetry, ErrorType } from '../utils/errorHandler';

interface Artwork {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  is_public: boolean;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface ArtworkComment {
  id: string;
  artwork_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface ArtworksResponse {
  artworks: Artwork[];
  total: number;
  hasMore: boolean;
}

interface LikeResponse {
  liked: boolean;
  likeCount: number;
  rewards?: SocialRewardResult;
}

interface CreateArtworkRequest {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
}

class CommunityService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  // 检查是否为演示模式
  private isDemoMode(): boolean {
    return true; // 目前总是使用演示模式
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
    return withRetry(async () => {
      console.log('[COMMUNITY SERVICE] 发起请求:', path);

      let token = await authAdapter.getIdToken();

      if (!token) {
        console.log('[COMMUNITY SERVICE] 无法获取真实 token，使用演示模式 token');
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
        console.error('[COMMUNITY SERVICE] 请求失败:', {
          path,
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        // 创建结构化错误对象
        const error = {
          status: response.status,
          message: errorData.message || `请求失败 (${response.status})`,
          data: errorData,
          response: { status: response.status, data: errorData }
        };
        throw error;
      }

      const data = await response.json();
      console.log('[COMMUNITY SERVICE] 请求成功:', path, data);
      return data;
    }, {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.log(`[COMMUNITY SERVICE] 重试请求 ${path} (第${attempt}次):`, error.message);
      },
      shouldRetry: (error) => {
        // 只对网络错误和服务器错误重试
        return error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER;
      }
    });
  }

  // 获取公开作品列表
  async getArtworks(
    limit: number = 20,
    offset: number = 0,
    sortBy: 'latest' | 'popular' | 'most_liked' = 'latest',
    searchQuery?: string
  ): Promise<ArtworksResponse> {
    if (this.isDemoMode()) {
      return demoCommunityService.getPublicArtworks(limit, offset, sortBy, searchQuery);
    }

    const params = new URLSearchParams({
      action: 'artworks',
      limit: limit.toString(),
      offset: offset.toString(),
      sortBy,
    });

    if (searchQuery) {
      params.append('search', searchQuery);
    }

    const response = await this.request<{ success: boolean; data: ArtworksResponse }>(`/api/community?${params.toString()}`);
    return response.data;
  }

  // 获取单个作品详情
  async getArtwork(artworkId: string): Promise<Artwork | null> {
    if (this.isDemoMode()) {
      return demoCommunityService.getArtwork(artworkId);
    }

    try {
      const response = await this.request<{ success: boolean; data: Artwork }>(`/api/community?action=artwork&id=${artworkId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // 创建作品
  async createArtwork(request: CreateArtworkRequest): Promise<Artwork> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.createArtwork(
        userId,
        request.title,
        request.description || '',
        request.videoUrl,
        request.thumbnailUrl,
        request.isPublic
      );
    }

    const response = await this.request<{ success: boolean; data: Artwork }>('/api/community?action=artworks', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  // 点赞/取消点赞
  async toggleLike(artworkId: string): Promise<LikeResponse> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      const result = demoCommunityService.toggleLike(artworkId, userId);

      // 处理社交奖励
      try {
        const rewards = await socialRewardService.processLikeReward(
          artworkId,
          result.authorId,
          result.likeCount,
          result.liked
        );

        return {
          liked: result.liked,
          likeCount: result.likeCount,
          rewards,
        };
      } catch (error) {
        console.error('处理点赞奖励失败:', error);
        return {
          liked: result.liked,
          likeCount: result.likeCount,
        };
      }
    }

    const response = await this.request<{ success: boolean; data: LikeResponse }>(`/api/community?action=like&id=${artworkId}`, {
      method: 'POST',
    });
    return response.data;
  }

  // 检查用户是否已点赞
  async isLikedByUser(artworkId: string): Promise<boolean> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.isLikedByUser(artworkId, userId);
    }

    // 生产模式实现...
    return false;
  }

  // 获取作品评论列表
  async getArtworkComments(artworkId: string): Promise<ArtworkComment[]> {
    if (this.isDemoMode()) {
      return demoCommunityService.getArtworkComments(artworkId);
    }

    const response = await this.request<{ success: boolean; data: ArtworkComment[] }>(`/api/community?action=comments&id=${artworkId}`);
    return response.data;
  }

  // 添加评论
  async addComment(artworkId: string, content: string): Promise<ArtworkComment> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.addComment(artworkId, userId, content);
    }

    const response = await this.request<{ success: boolean; data: ArtworkComment }>(`/api/community?action=comments&id=${artworkId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  // 更新作品可见性
  async updateArtworkVisibility(artworkId: string, isPublic: boolean): Promise<void> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      // 使用现有的API端点
      const response = await this.request<{ success: boolean; data: any }>(`/api/community/${artworkId}/toggle-visibility`, {
        method: 'POST',
        body: JSON.stringify({ isPublic }),
      });

      if (!response.success) {
        throw new Error('更新作品可见性失败');
      }
      return;
    }

    const response = await this.request<{ success: boolean; data: any }>(`/api/community/${artworkId}/toggle-visibility`, {
      method: 'POST',
      body: JSON.stringify({ isPublic }),
    });

    if (!response.success) {
      throw new Error('更新作品可见性失败');
    }
  }

  // 获取用户作品列表
  async getUserArtworks(): Promise<Artwork[]> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.getUserArtworks(userId);
    }

    const response = await this.request<{ success: boolean; data: Artwork[] }>('/api/community?action=my-artworks');
    return response.data;
  }

  // 获取用户点赞的作品列表
  async getUserLikedArtworks(): Promise<Artwork[]> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.getUserLikedArtworks(userId);
    }

    const response = await this.request<{ success: boolean; data: Artwork[] }>('/api/community?action=my-likes');
    return response.data;
  }

  // 获取用户评论列表
  async getUserComments(): Promise<ArtworkComment[]> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      return demoCommunityService.getUserComments(userId);
    }

    const response = await this.request<{ success: boolean; data: ArtworkComment[] }>('/api/community?action=my-comments');
    return response.data;
  }

  // 提交举报
  async submitReport(
    targetType: 'artwork' | 'comment',
    targetId: string,
    reason: string,
    description?: string
  ): Promise<boolean> {
    if (this.isDemoMode()) {
      const userId = await this.getCurrentUserId();
      demoCommunityService.submitReport(targetType, targetId, userId, reason, description);
      return true;
    }

    // 生产模式实现...
    return false;
  }
}

export const communityService = new CommunityService();
export type { Artwork, ArtworkComment, ArtworksResponse, LikeResponse, CreateArtworkRequest };
