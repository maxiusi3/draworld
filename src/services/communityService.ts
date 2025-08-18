import { authAdapter } from '../lib/adapters/authAdapter';

export interface Artwork {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url?: string;
  tags: string[];
  category: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  user_id: string;
  users?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ArtworksResponse {
  success: boolean;
  data: Artwork[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    sortBy: string;
    tags: string;
    category: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

class CommunityService {
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
      console.error('[COMMUNITY SERVICE] 请求异常:', error);
      throw error;
    }
  }

  async getArtworks(
    page: number = 1,
    limit: number = 12,
    sortBy: 'LATEST' | 'POPULAR' | 'VIEWS' = 'LATEST',
    tags?: string[],
    category?: string
  ): Promise<ArtworksResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy
    });

    if (tags && tags.length > 0) {
      params.set('tags', tags.join(','));
    }

    if (category) {
      params.set('category', category);
    }

    const response = await this.request<ArtworksResponse>(`/api/artworks?${params.toString()}`);
    if (!response.success) throw new Error('获取作品列表失败');
    return response;
  }

  async getArtworkById(artworkId: string): Promise<Artwork> {
    const response = await this.request<{
      success: boolean;
      data: Artwork;
    }>(`/api/artworks?id=${artworkId}`);

    if (!response.success) throw new Error('获取作品详情失败');
    return response.data;
  }

  async likeArtwork(artworkId: string): Promise<void> {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>('/api/community?action=like', {
      method: 'POST',
      body: JSON.stringify({ artworkId: artworkId, action: 'like' })
    });

    if (!response.success) throw new Error('点赞失败');
  }

  async unlikeArtwork(artworkId: string): Promise<void> {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>('/api/community?action=like', {
      method: 'POST',
      body: JSON.stringify({ artworkId: artworkId, action: 'unlike' })
    });

    if (!response.success) throw new Error('取消点赞失败');
  }

  async getComments(artworkId: string, page: number = 1, limit: number = 20): Promise<{
    success: boolean;
    data: Comment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.request<{
      success: boolean;
      data: Comment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/community?action=comment&artworkId=${artworkId}&page=${page}&limit=${limit}`);

    if (!response.success) throw new Error('获取评论列表失败');
    return response;
  }

  async addComment(artworkId: string, content: string): Promise<Comment> {
    const response = await this.request<{
      success: boolean;
      data: Comment;
    }>('/api/community?action=comment', {
      method: 'POST',
      body: JSON.stringify({ artworkId: artworkId, content: content })
    });

    if (!response.success) throw new Error('添加评论失败');
    return response.data;
  }

  async reportArtwork(artworkId: string, reason: string, description?: string): Promise<void> {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>('/api/community?action=report', {
      method: 'POST',
      body: JSON.stringify({ artworkId: artworkId, reason: reason, description: description || '' })
    });

    if (!response.success) throw new Error('举报失败');
  }

  async searchArtworks(query: string, page: number = 1, limit: number = 12): Promise<ArtworksResponse> {
    const params = new URLSearchParams({
      action: 'search',
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await this.request<ArtworksResponse>(`/api/artworks?${params.toString()}`);
    if (!response.success) throw new Error('搜索作品失败');
    return response;
  }

  // 向后兼容的方法
  async getArtwork(artworkId: string): Promise<Artwork> {
    return this.getArtworkById(artworkId);
  }

  async isLikedByUser(artworkId: string): Promise<boolean> {
    // 简化实现，返回false
    return false;
  }

  async toggleLike(artworkId: string): Promise<{ liked: boolean; likeCount: number }> {
    // 简化实现，调用likeArtwork
    await this.likeArtwork(artworkId);
    return { liked: true, likeCount: 0 };
  }

  async getArtworkComments(artworkId: string): Promise<Comment[]> {
    const response = await this.getComments(artworkId);
    return response.data;
  }

  async getUserArtworks(): Promise<Artwork[]> {
    const response = await this.getArtworks();
    return response.data;
  }

  async getUserLikedArtworks(): Promise<Artwork[]> {
    const response = await this.getArtworks();
    return response.data;
  }

  async getUserComments(): Promise<Comment[]> {
    // 简化实现，返回空数组
    return [];
  }

  async createArtwork(artwork: any): Promise<Artwork> {
    const response = await this.request<{ success: boolean; data: Artwork }>('/api/artworks', {
      method: 'POST',
      body: JSON.stringify(artwork)
    });

    if (!response.success) throw new Error('创建作品失败');
    return response.data;
  }

  async updateArtworkVisibility(artworkId: string, isPublic: boolean): Promise<void> {
    await this.request('/api/artworks', {
      method: 'PUT',
      body: JSON.stringify({ id: artworkId, is_public: isPublic })
    });
  }

  async submitReport(type: string, id: string, reason: string, description?: string): Promise<void> {
    await this.reportArtwork(id, reason, description);
  }
}

export const communityService = new CommunityService();
