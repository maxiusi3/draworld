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
    // 临时模拟API响应用于测试
    if (path.startsWith('/api/artworks') && !path.includes('/')) {
      // 模拟作品列表
      const mockArtworks = [
        {
          id: '1',
          userId: 'user1',
          userName: '小明',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
          title: '梦幻森林',
          description: '一个充满魔法的森林场景，有着闪闪发光的树木和神秘的生物',
          videoUrl: 'https://example.com/video1.mp4',
          thumbnailUrl: 'https://picsum.photos/400/300?random=1',
          prompt: '梦幻森林，魔法，闪光，神秘生物',
          musicStyle: 'Mysterious',
          aspectRatio: '16:9',
          likesCount: 128,
          commentsCount: 23,
          viewsCount: 1520,
          isPublic: true,
          status: 'APPROVED',
          tags: ['梦幻', '森林', '魔法'],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          userId: 'user2',
          userName: '小红',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong',
          title: '未来城市',
          description: '科幻风格的未来城市，有着高耸的建筑和飞行汽车',
          videoUrl: 'https://example.com/video2.mp4',
          thumbnailUrl: 'https://picsum.photos/400/300?random=2',
          prompt: '未来城市，科幻，高楼大厦，飞行汽车',
          musicStyle: 'Epic',
          aspectRatio: '16:9',
          likesCount: 89,
          commentsCount: 15,
          viewsCount: 980,
          isPublic: true,
          status: 'APPROVED',
          tags: ['科幻', '城市', '未来'],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          userId: 'user3',
          userName: '小李',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoli',
          title: '可爱小猫',
          description: '一只超级可爱的小猫咪在花园里玩耍',
          videoUrl: 'https://example.com/video3.mp4',
          thumbnailUrl: 'https://picsum.photos/400/300?random=3',
          prompt: '可爱小猫，花园，玩耍，温馨',
          musicStyle: 'Joyful',
          aspectRatio: '1:1',
          likesCount: 256,
          commentsCount: 42,
          viewsCount: 2340,
          isPublic: true,
          status: 'APPROVED',
          tags: ['可爱', '动物', '猫咪'],
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          userId: 'user4',
          userName: '小王',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaowang',
          title: '抽象艺术',
          description: '色彩斑斓的抽象艺术作品，充满想象力',
          videoUrl: 'https://example.com/video4.mp4',
          thumbnailUrl: 'https://picsum.photos/400/300?random=4',
          prompt: '抽象艺术，色彩，想象力，创意',
          musicStyle: 'Calm',
          aspectRatio: '4:3',
          likesCount: 67,
          commentsCount: 8,
          viewsCount: 456,
          isPublic: true,
          status: 'APPROVED',
          tags: ['抽象', '艺术', '色彩'],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
      ];

      return {
        artworks: mockArtworks,
        total: mockArtworks.length,
        page: 1,
        limit: 20,
        hasMore: false,
      } as T;
    }

    if (path.includes('/like') && options?.method === 'POST') {
      return {
        success: true,
        isLiked: true,
        likesCount: Math.floor(Math.random() * 200) + 50,
        creditsEarned: Math.random() > 0.8 ? 1 : 0, // 20%概率获得积分
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

    return this.request<ArtworkListResponse>(`/api/artworks?${params.toString()}`);
  }

  // 获取作品详情
  async getArtworkDetail(artworkId: string): Promise<ArtworkDetailResponse> {
    return this.request<ArtworkDetailResponse>(`/api/artworks/${artworkId}`);
  }

  // 更新作品
  async updateArtwork(artworkId: string, request: UpdateArtworkRequest): Promise<Artwork> {
    return this.request<Artwork>(`/api/artworks/${artworkId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // 删除作品
  async deleteArtwork(artworkId: string): Promise<void> {
    await this.request<void>(`/api/artworks/${artworkId}`, {
      method: 'DELETE',
    });
  }

  // 点赞/取消点赞作品
  async toggleLikeArtwork(artworkId: string): Promise<LikeArtworkResponse> {
    return this.request<LikeArtworkResponse>(`/api/artworks/${artworkId}/like`, {
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
      await this.request<void>(`/api/artworks/${artworkId}/view`, {
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
      `/api/artworks/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  // 获取用户的作品（我的作品）
  async getMyArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/users/me/artworks?page=${page}&limit=${limit}`
    );
  }

  // 获取用户点赞的作品
  async getMyLikedArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/users/me/liked-artworks?page=${page}&limit=${limit}`
    );
  }

  // 获取用户评论的作品
  async getMyCommentedArtworks(page: number = 1, limit: number = 20): Promise<ArtworkListResponse> {
    return this.request<ArtworkListResponse>(
      `/api/users/me/commented-artworks?page=${page}&limit=${limit}`
    );
  }

  // 批量操作作品（管理员功能）
  async batchUpdateArtworks(artworkIds: string[], updates: Partial<Artwork>): Promise<void> {
    await this.request<void>('/api/artworks/batch', {
      method: 'PUT',
      body: JSON.stringify({ artworkIds, updates }),
    });
  }
}

export const artworkService = new ArtworkService();
