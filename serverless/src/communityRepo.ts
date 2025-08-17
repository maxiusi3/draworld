// 语言: TypeScript
// 说明: 社区系统数据访问层，基于TableStore实现

import TableStore from 'tablestore';
import { v4 as uuidv4 } from 'uuid';

export interface Artwork {
  tenantId: string;
  artworkId: string;
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  isPublic: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  tags: string[];
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  updatedAt: number;
}

export interface Like {
  tenantId: string;
  likeId: string;
  userId: string;
  artworkId: string;
  authorId: string;
  createdAt: number;
}

export interface Comment {
  tenantId: string;
  commentId: string;
  userId: string;
  artworkId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  updatedAt: number;
}

export class CommunityRepository {
  private client: any;
  private instanceName: string;
  private tenantId: string;
  private likeRateLimit: Map<string, number[]> = new Map();
  private likeDebounce: Map<string, number> = new Map();

  constructor(instanceName: string, tenantId: string = 'default') {
    this.instanceName = instanceName;
    this.tenantId = tenantId;
    this.client = new TableStore.Client({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
      secretAccessKey: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
      endpoint: `https://${instanceName}.cn-hangzhou.ots.aliyuncs.com`,
      instancename: instanceName,
    });
  }

  // 检查点赞频率限制
  private checkLikeRateLimit(userId: string, artworkId: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟窗口
    const maxRequests = 30; // 每分钟最多30次
    const debounceMs = 2000; // 2秒去抖

    // 检查去抖
    const debounceKey = `${userId}_${artworkId}`;
    const lastAction = this.likeDebounce.get(debounceKey);
    if (lastAction && now - lastAction < debounceMs) {
      return {
        allowed: false,
        message: `请等待${Math.ceil((debounceMs - (now - lastAction)) / 1000)}秒后再操作`,
      };
    }

    // 检查频率限制
    const rateLimitKey = `${userId}`;
    const requests = this.likeRateLimit.get(rateLimitKey) || [];

    // 清理过期请求
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        message: '点赞操作过于频繁，请稍后再试',
      };
    }

    // 记录本次请求
    validRequests.push(now);
    this.likeRateLimit.set(rateLimitKey, validRequests);
    this.likeDebounce.set(debounceKey, now);

    return { allowed: true };
  }

  // 创建作品
  async createArtwork(artwork: Omit<Artwork, 'tenantId' | 'artworkId' | 'likeCount' | 'commentCount' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<Artwork | null> {
    try {
      const artworkId = uuidv4();
      const now = Date.now();

      const newArtwork: Artwork = {
        tenantId: this.tenantId,
        artworkId,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        ...artwork,
      };

      const params = {
        tableName: 'artworks',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': artworkId }
        ],
        attributeColumns: [
          { 'userId': artwork.userId },
          { 'title': artwork.title },
          { 'description': artwork.description },
          { 'videoUrl': artwork.videoUrl },
          { 'thumbnailUrl': artwork.thumbnailUrl },
          { 'isPublic': artwork.isPublic },
          { 'likeCount': 0 },
          { 'commentCount': 0 },
          { 'viewCount': 0 },
          { 'tags': JSON.stringify(artwork.tags) },
          { 'moderationStatus': artwork.moderationStatus },
          { 'createdAt': now },
          { 'updatedAt': now },
        ],
      };

      await this.client.putRow(params);
      return newArtwork;
    } catch (error) {
      console.error('创建作品失败:', error);
      return null;
    }
  }

  // 获取作品详情
  async getArtwork(artworkId: string): Promise<Artwork | null> {
    try {
      const params = {
        tableName: 'artworks',
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': artworkId }
        ],
      };

      const result = await this.client.getRow(params);
      if (!result.row || !result.row.attributes) {
        return null;
      }

      const attrs = result.row.attributes;
      return {
        tenantId: this.tenantId,
        artworkId,
        userId: attrs.userId[0],
        title: attrs.title[0],
        description: attrs.description[0],
        videoUrl: attrs.videoUrl[0],
        thumbnailUrl: attrs.thumbnailUrl[0],
        isPublic: attrs.isPublic?.[0] || false,
        likeCount: attrs.likeCount?.[0] || 0,
        commentCount: attrs.commentCount?.[0] || 0,
        viewCount: attrs.viewCount?.[0] || 0,
        tags: JSON.parse(attrs.tags?.[0] || '[]'),
        moderationStatus: attrs.moderationStatus?.[0] || 'PENDING',
        createdAt: attrs.createdAt?.[0] || Date.now(),
        updatedAt: attrs.updatedAt?.[0] || Date.now(),
      };
    } catch (error) {
      console.error('获取作品失败:', error);
      return null;
    }
  }

  // 获取公开作品列表（分页）
  async getPublicArtworks(limit: number = 20, lastArtworkId?: string): Promise<Artwork[]> {
    try {
      const params = {
        tableName: 'artworks',
        direction: TableStore.Direction.BACKWARD, // 按创建时间倒序
        inclusiveStartPrimaryKey: lastArtworkId ? [
          { 'tenantId': this.tenantId },
          { 'artworkId': lastArtworkId }
        ] : [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MAX }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MIN }
        ],
        limit,
      };

      const result = await this.client.getRange(params);
      const artworks: Artwork[] = [];

      for (const row of result.rows) {
        const attrs = row.attributes;
        // 只返回公开且已审核通过的作品
        if (attrs.isPublic?.[0] && attrs.moderationStatus?.[0] === 'APPROVED') {
          artworks.push({
            tenantId: this.tenantId,
            artworkId: row.primaryKey[1].value,
            userId: attrs.userId[0],
            title: attrs.title[0],
            description: attrs.description[0],
            videoUrl: attrs.videoUrl[0],
            thumbnailUrl: attrs.thumbnailUrl[0],
            isPublic: attrs.isPublic[0],
            likeCount: attrs.likeCount?.[0] || 0,
            commentCount: attrs.commentCount?.[0] || 0,
            viewCount: attrs.viewCount?.[0] || 0,
            tags: JSON.parse(attrs.tags?.[0] || '[]'),
            moderationStatus: attrs.moderationStatus[0],
            createdAt: attrs.createdAt?.[0] || Date.now(),
            updatedAt: attrs.updatedAt?.[0] || Date.now(),
          });
        }
      }

      return artworks;
    } catch (error) {
      console.error('获取公开作品列表失败:', error);
      return [];
    }
  }

  // 获取用户作品列表
  async getUserArtworks(userId: string, limit: number = 20): Promise<Artwork[]> {
    try {
      const params = {
        tableName: 'artworks',
        direction: TableStore.Direction.BACKWARD,
        inclusiveStartPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MAX }
        ],
        exclusiveEndPrimaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': TableStore.INF_MIN }
        ],
        limit: 1000, // 扫描更多记录以过滤用户作品
      };

      const result = await this.client.getRange(params);
      const artworks: Artwork[] = [];

      for (const row of result.rows) {
        const attrs = row.attributes;
        if (attrs.userId && attrs.userId[0] === userId) {
          artworks.push({
            tenantId: this.tenantId,
            artworkId: row.primaryKey[1].value,
            userId: attrs.userId[0],
            title: attrs.title[0],
            description: attrs.description[0],
            videoUrl: attrs.videoUrl[0],
            thumbnailUrl: attrs.thumbnailUrl[0],
            isPublic: attrs.isPublic?.[0] || false,
            likeCount: attrs.likeCount?.[0] || 0,
            commentCount: attrs.commentCount?.[0] || 0,
            viewCount: attrs.viewCount?.[0] || 0,
            tags: JSON.parse(attrs.tags?.[0] || '[]'),
            moderationStatus: attrs.moderationStatus?.[0] || 'PENDING',
            createdAt: attrs.createdAt?.[0] || Date.now(),
            updatedAt: attrs.updatedAt?.[0] || Date.now(),
          });

          if (artworks.length >= limit) break;
        }
      }

      return artworks;
    } catch (error) {
      console.error('获取用户作品列表失败:', error);
      return [];
    }
  }

  // 切换作品公开/私密状态
  async toggleArtworkVisibility(artworkId: string, userId: string, isPublic: boolean): Promise<boolean> {
    try {
      // 先验证作品所有权
      const artwork = await this.getArtwork(artworkId);
      if (!artwork || artwork.userId !== userId) {
        return false;
      }

      const params = {
        tableName: 'artworks',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': artworkId }
        ],
        attributeColumns: [
          { 'isPublic': isPublic },
          { 'updatedAt': Date.now() },
        ],
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('切换作品可见性失败:', error);
      return false;
    }
  }

  // 点赞作品
  async likeArtwork(userId: string, artworkId: string): Promise<{ success: boolean; liked: boolean; likeCount: number; authorId?: string; message?: string }> {
    try {
      // 检查频率限制
      const rateLimitCheck = this.checkLikeRateLimit(userId, artworkId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          liked: false,
          likeCount: 0,
          message: rateLimitCheck.message,
        };
      }

      const likeId = `${userId}_${artworkId}`;

      // 检查是否已经点赞
      const existingLike = await this.getLike(likeId);
      
      if (existingLike) {
        // 取消点赞
        await this.removeLike(likeId);
        await this.updateArtworkLikeCount(artworkId, -1);
        
        const artwork = await this.getArtwork(artworkId);
        return {
          success: true,
          liked: false,
          likeCount: artwork?.likeCount || 0,
          authorId: artwork?.userId,
        };
      } else {
        // 添加点赞
        const artwork = await this.getArtwork(artworkId);
        if (!artwork) {
          return { success: false, liked: false, likeCount: 0 };
        }

        const like: Like = {
          tenantId: this.tenantId,
          likeId,
          userId,
          artworkId,
          authorId: artwork.userId,
          createdAt: Date.now(),
        };

        await this.addLike(like);
        await this.updateArtworkLikeCount(artworkId, 1);

        return {
          success: true,
          liked: true,
          likeCount: artwork.likeCount + 1,
          authorId: artwork.userId,
        };
      }
    } catch (error) {
      console.error('点赞作品失败:', error);
      return { success: false, liked: false, likeCount: 0 };
    }
  }

  // 获取点赞记录
  private async getLike(likeId: string): Promise<Like | null> {
    try {
      const params = {
        tableName: 'likes',
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'likeId': likeId }
        ],
      };

      const result = await this.client.getRow(params);
      if (!result.row || !result.row.attributes) {
        return null;
      }

      const attrs = result.row.attributes;
      return {
        tenantId: this.tenantId,
        likeId,
        userId: attrs.userId[0],
        artworkId: attrs.artworkId[0],
        authorId: attrs.authorId[0],
        createdAt: attrs.createdAt?.[0] || Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  // 添加点赞
  private async addLike(like: Like): Promise<boolean> {
    try {
      const params = {
        tableName: 'likes',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'likeId': like.likeId }
        ],
        attributeColumns: [
          { 'userId': like.userId },
          { 'artworkId': like.artworkId },
          { 'authorId': like.authorId },
          { 'createdAt': like.createdAt },
        ],
      };

      await this.client.putRow(params);
      return true;
    } catch (error) {
      console.error('添加点赞失败:', error);
      return false;
    }
  }

  // 移除点赞
  private async removeLike(likeId: string): Promise<boolean> {
    try {
      const params = {
        tableName: 'likes',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'likeId': likeId }
        ],
      };

      await this.client.deleteRow(params);
      return true;
    } catch (error) {
      console.error('移除点赞失败:', error);
      return false;
    }
  }

  // 更新作品点赞数
  private async updateArtworkLikeCount(artworkId: string, delta: number): Promise<boolean> {
    try {
      const params = {
        tableName: 'artworks',
        condition: new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null),
        primaryKey: [
          { 'tenantId': this.tenantId },
          { 'artworkId': artworkId }
        ],
        attributeColumns: [
          { 'likeCount': TableStore.increment(delta) },
          { 'updatedAt': Date.now() },
        ],
      };

      await this.client.updateRow(params);
      return true;
    } catch (error) {
      console.error('更新作品点赞数失败:', error);
      return false;
    }
  }
}
