// 演示模式社区服务 - 前端状态管理
// 解决 Vercel 无服务器环境中 API 函数不共享内存的问题

interface DemoArtwork {
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

interface DemoArtworkLike {
  id: string;
  artwork_id: string;
  user_id: string;
  created_at: string;
}

interface DemoArtworkComment {
  id: string;
  artwork_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface DemoContentReport {
  id: string;
  target_type: 'artwork' | 'comment';
  target_id: string;
  reporter_user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
}

class DemoCommunityService {
  private storageKey = 'demo_community_data';
  
  // 敏感词库（简化版）
  private sensitiveWords = [
    '政治', '敏感', '违法', '色情', '暴力', '赌博', '毒品',
    '广告', '推广', '微信', 'QQ', '电话', '联系方式'
  ];
  
  private getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsedData = data ? JSON.parse(data) : null;

      // 如果没有数据，创建一些演示数据
      if (!parsedData || Object.keys(parsedData.artworks || {}).length === 0) {
        return this.createDemoData();
      }

      return parsedData;
    } catch (error) {
      console.error('读取演示社区数据失败:', error);
      return this.createDemoData();
    }
  }

  // 创建演示数据
  private createDemoData() {
    const now = new Date().toISOString();
    const demoData = {
      artworks: {
        'demo-artwork-1': {
          id: 'demo-artwork-1',
          user_id: 'demo-user-system',
          title: '梦幻森林中的精灵',
          description: '一个充满魔法的森林场景，精灵在月光下翩翩起舞',
          video_url: 'https://example.com/demo-video-1.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
          is_public: true,
          like_count: 12,
          comment_count: 3,
          view_count: 156,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'demo-artwork-2': {
          id: 'demo-artwork-2',
          user_id: 'demo-user-system',
          title: '未来城市的霓虹夜景',
          description: '赛博朋克风格的未来城市，霓虹灯闪烁的夜晚',
          video_url: 'https://example.com/demo-video-2.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
          is_public: true,
          like_count: 8,
          comment_count: 2,
          view_count: 89,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'demo-artwork-3': {
          id: 'demo-artwork-3',
          user_id: 'demo-user-system',
          title: '古代神庙的神秘仪式',
          description: '古老的神庙中正在进行神秘的仪式，烛光摇曳',
          video_url: 'https://example.com/demo-video-3.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          is_public: true,
          like_count: 15,
          comment_count: 5,
          view_count: 234,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        }
      },
      likes: {},
      comments: {},
      reports: {}
    };

    // 保存演示数据
    this.setStorageData(demoData);
    return demoData;
  }
  
  private setStorageData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // 触发社区数据更新事件
      window.dispatchEvent(new CustomEvent('communityUpdated'));
    } catch (error) {
      console.error('保存演示社区数据失败:', error);
    }
  }
  
  // 内容审核：检查敏感词
  private checkSensitiveContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.sensitiveWords.some(word => lowerContent.includes(word.toLowerCase()));
  }
  
  // 创建作品
  createArtwork(
    userId: string,
    title: string,
    description: string,
    videoUrl: string,
    thumbnailUrl?: string,
    isPublic: boolean = true
  ): DemoArtwork {
    const data = this.getStorageData();
    
    // 检查标题和描述是否包含敏感词
    const hasSensitiveContent = this.checkSensitiveContent(title) || 
                               this.checkSensitiveContent(description || '');
    
    const artwork: DemoArtwork = {
      id: `demo-artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      is_public: isPublic && !hasSensitiveContent, // 包含敏感词的作品自动设为私密
      like_count: 0,
      comment_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    data.artworks[artwork.id] = artwork;
    this.setStorageData(data);
    
    return artwork;
  }
  
  // 获取公开作品列表
  getPublicArtworks(
    limit: number = 20,
    offset: number = 0,
    sortBy: 'latest' | 'popular' | 'most_liked' = 'latest',
    searchQuery?: string
  ): {
    artworks: DemoArtwork[];
    total: number;
    hasMore: boolean;
  } {
    const data = this.getStorageData();
    let artworks = Object.values(data.artworks).filter((artwork: any) => artwork.is_public);
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      artworks = artworks.filter((artwork: any) => 
        artwork.title.toLowerCase().includes(query) ||
        (artwork.description && artwork.description.toLowerCase().includes(query))
      );
    }
    
    // 排序
    switch (sortBy) {
      case 'popular':
        artworks.sort((a: any, b: any) => b.view_count - a.view_count);
        break;
      case 'most_liked':
        artworks.sort((a: any, b: any) => b.like_count - a.like_count);
        break;
      case 'latest':
      default:
        artworks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    const total = artworks.length;
    const paginatedArtworks = artworks.slice(offset, offset + limit);
    
    return {
      artworks: paginatedArtworks as DemoArtwork[],
      total,
      hasMore: (offset + limit) < total,
    };
  }
  
  // 获取单个作品详情
  getArtwork(artworkId: string): DemoArtwork | null {
    const data = this.getStorageData();
    const artwork = data.artworks[artworkId];
    
    if (artwork) {
      // 增加浏览次数
      artwork.view_count += 1;
      data.artworks[artworkId] = artwork;
      this.setStorageData(data);
    }
    
    return artwork || null;
  }
  
  // 获取用户作品列表
  getUserArtworks(userId: string): DemoArtwork[] {
    const data = this.getStorageData();
    return Object.values(data.artworks)
      .filter((artwork: any) => artwork.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as DemoArtwork[];
  }
  
  // 点赞/取消点赞
  toggleLike(artworkId: string, userId: string): { liked: boolean; likeCount: number; authorId: string } {
    const data = this.getStorageData();
    const artwork = data.artworks[artworkId];
    
    if (!artwork) {
      throw new Error('作品不存在');
    }
    
    // 检查是否已点赞
    const existingLikeKey = Object.keys(data.likes).find(key => {
      const like = data.likes[key];
      return like.artwork_id === artworkId && like.user_id === userId;
    });
    
    if (existingLikeKey) {
      // 取消点赞
      delete data.likes[existingLikeKey];
      artwork.like_count = Math.max(0, artwork.like_count - 1);
      data.artworks[artworkId] = artwork;
      this.setStorageData(data);
      
      return { liked: false, likeCount: artwork.like_count, authorId: artwork.user_id };
    } else {
      // 添加点赞
      const like: DemoArtworkLike = {
        id: `demo-like-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        artwork_id: artworkId,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      
      data.likes[like.id] = like;
      artwork.like_count += 1;
      data.artworks[artworkId] = artwork;
      this.setStorageData(data);
      
      return { liked: true, likeCount: artwork.like_count, authorId: artwork.user_id };
    }
  }
  
  // 检查用户是否已点赞
  isLikedByUser(artworkId: string, userId: string): boolean {
    const data = this.getStorageData();
    return Object.values(data.likes).some((like: any) => 
      like.artwork_id === artworkId && like.user_id === userId
    );
  }
  
  // 获取用户点赞的作品列表
  getUserLikedArtworks(userId: string): DemoArtwork[] {
    const data = this.getStorageData();
    const userLikes = Object.values(data.likes).filter((like: any) => like.user_id === userId);
    const likedArtworkIds = userLikes.map((like: any) => like.artwork_id);
    
    return likedArtworkIds
      .map(id => data.artworks[id])
      .filter(artwork => artwork)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as DemoArtwork[];
  }
  
  // 添加评论
  addComment(artworkId: string, userId: string, content: string): DemoArtworkComment {
    const data = this.getStorageData();
    const artwork = data.artworks[artworkId];
    
    if (!artwork) {
      throw new Error('作品不存在');
    }
    
    // 检查评论内容是否包含敏感词
    const hasSensitiveContent = this.checkSensitiveContent(content);
    
    const comment: DemoArtworkComment = {
      id: `demo-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      artwork_id: artworkId,
      user_id: userId,
      content,
      is_approved: !hasSensitiveContent, // 包含敏感词的评论需要审核
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    data.comments[comment.id] = comment;
    
    // 只有通过审核的评论才计入评论数
    if (comment.is_approved) {
      artwork.comment_count += 1;
      data.artworks[artworkId] = artwork;
    }
    
    this.setStorageData(data);
    
    return comment;
  }
  
  // 获取作品评论列表
  getArtworkComments(artworkId: string): DemoArtworkComment[] {
    const data = this.getStorageData();
    return Object.values(data.comments)
      .filter((comment: any) => comment.artwork_id === artworkId && comment.is_approved)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as DemoArtworkComment[];
  }
  
  // 获取用户评论列表
  getUserComments(userId: string): DemoArtworkComment[] {
    const data = this.getStorageData();
    return Object.values(data.comments)
      .filter((comment: any) => comment.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as DemoArtworkComment[];
  }
  
  // 提交举报
  submitReport(
    targetType: 'artwork' | 'comment',
    targetId: string,
    reporterUserId: string,
    reason: string,
    description?: string
  ): DemoContentReport {
    const data = this.getStorageData();
    
    const report: DemoContentReport = {
      id: `demo-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      target_type: targetType,
      target_id: targetId,
      reporter_user_id: reporterUserId,
      reason,
      description,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    data.reports[report.id] = report;
    this.setStorageData(data);
    
    return report;
  }
  
  // 清除演示数据（用于测试）
  clearDemoData() {
    localStorage.removeItem(this.storageKey);
  }
}

export const demoCommunityService = new DemoCommunityService();
export type { DemoArtwork, DemoArtworkLike, DemoArtworkComment, DemoContentReport };
