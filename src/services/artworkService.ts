// 语言: TypeScript
// 说明: 创意广场作品服务类

import { authAdapter } from '../lib/adapters/authAdapter';
import type {
  Artwork,
  CreateArtworkRequest,
  UpdateArtworkRequest,
  ArtworkListResponse,
  ArtworkDetailResponse,
  LikeArtworkResponse,
  CommentArtworkRequest,
  CommentArtworkResponse,
  ArtworkCommentsResponse,
  ArtworkListRequest,
  UserArtworkStats,
  PopularTagsResponse,
  RecommendedArtworksResponse,
  ReportArtworkRequest,
  ReportArtworkResponse,
  FavoriteArtworkResponse,
  UserFavoritesResponse,
} from '../types/artwork';

export class ArtworkService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (typeof window !== 'undefined')
      ? (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin
      : '';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {

    // API调用逻辑
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

  // 创建作品
  async createArtwork(request: CreateArtworkRequest): Promise<Artwork> {
    return this.request<Artwork>('/api/artworks', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 获取作品列表
  async getArtworks(request: ArtworkListRequest = {}): Promise<ArtworkListResponse> {
    const params = new URLSearchParams();
    
    if (request.page) params.append('page', request.page.toString());
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.filter?.sortBy) params.append('sortBy', request.filter.sortBy);
    if (request.filter?.tags) params.append('tags', request.filter.tags.join(','));
    if (request.filter?.userId) params.append('userId', request.filter.userId);
    if (request.filter?.timeRange) params.append('timeRange', request.filter.timeRange);

    return this.request<ArtworkListResponse>(`/api/content?action=artworks&${params.toString()}`);
  }

  // 获取作品详情
  async getArtworkDetail(artworkId: string): Promise<ArtworkDetailResponse> {
    return this.request<ArtworkDetailResponse>(`/api/content?action=artworks&id=${artworkId}`);
  }

  // 更新作品
  async updateArtwork(artworkId: string, request: UpdateArtworkRequest): Promise<Artwork> {
    return this.request<Artwork>(`/api/content?action=artworks&id=${artworkId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // 删除作品
  async deleteArtwork(artworkId: string): Promise<void> {
    await this.request<void>(`/api/content?action=artworks&id=${artworkId}`, {
      method: 'DELETE',
    });
  }

  // 点赞/取消点赞作品
  async toggleLikeArtwork(artworkId: string): Promise<LikeArtworkResponse> {
    return this.request<LikeArtworkResponse>(`/api/social?action=community&subAction=like&artworkId=${artworkId}`, {
      method: 'POST',
    });
  }

  // 评论作品
  async commentArtwork(artworkId: string, request: CommentArtworkRequest): Promise<CommentArtworkResponse> {
    return this.request<CommentArtworkResponse>(`/api/artworks/${artworkId}/comments`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 获取作品评论
  async getArtworkComments(
    artworkId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ArtworkCommentsResponse> {
    return this.request<ArtworkCommentsResponse>(
      `/api/artworks/${artworkId}/comments?page=${page}&limit=${limit}`
    );
  }

  // 删除评论
  async deleteComment(artworkId: string, commentId: string): Promise<void> {
    await this.request<void>(`/api/artworks/${artworkId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // 获取用户作品统计
  async getUserArtworkStats(userId?: string): Promise<UserArtworkStats> {
    const path = userId ? `/api/users/${userId}/artwork-stats` : '/api/users/me/artwork-stats';
    return this.request<UserArtworkStats>(path);
  }

  // 获取热门标签
  async getPopularTags(): Promise<PopularTagsResponse> {
    return this.request<PopularTagsResponse>('/api/artworks/popular-tags');
  }

  // 获取推荐作品
  async getRecommendedArtworks(): Promise<RecommendedArtworksResponse> {
    return this.request<RecommendedArtworksResponse>('/api/artworks/recommended');
  }

  // 举报作品
  async reportArtwork(artworkId: string, request: ReportArtworkRequest): Promise<ReportArtworkResponse> {
    return this.request<ReportArtworkResponse>(`/api/artworks/${artworkId}/report`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 收藏/取消收藏作品
  async toggleFavoriteArtwork(artworkId: string): Promise<FavoriteArtworkResponse> {
    return this.request<FavoriteArtworkResponse>(`/api/artworks/${artworkId}/favorite`, {
      method: 'POST',
    });
  }

  // 获取用户收藏
  async getUserFavorites(page: number = 1, limit: number = 20): Promise<UserFavoritesResponse> {
    return this.request<UserFavoritesResponse>(
      `/api/users/me/favorites?page=${page}&limit=${limit}`
    );
  }

  // 记录作品浏览
  async recordArtworkView(artworkId: string): Promise<void> {
    try {
      await this.request<void>(`/api/content?action=artworks&subAction=view&id=${artworkId}`, {
        method: 'POST',
      });
    } catch (error) {
      // 浏览记录失败不影响用户体验，静默处理
      console.warn('记录作品浏览失败:', error);
    }
  }

  // 搜索作品
  async searchArtworks(
    query: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/content?action=artworks&search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  // 获取用户的作品（我的作品）
  async getMyArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/user?action=artworks&page=${page}&limit=${limit}`
    );
  }

  // 获取用户点赞的作品
  async getMyLikedArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/user?action=liked-artworks&page=${page}&limit=${limit}`
    );
  }

  // 获取用户评论的作品
  async getMyCommentedArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/user?action=commented-artworks&page=${page}&limit=${limit}`
    );
  }

  // 批量操作作品（管理员功能）
  async batchUpdateArtworks(artworkIds: string[], updates: Partial<Artwork>): Promise<void> {
    await this.request<void>('/api/content?action=artworks&subAction=batch', {
      method: 'PUT',
      body: JSON.stringify({ artworkIds, updates }),
    });
  }
}

export const artworkService = new ArtworkService();
