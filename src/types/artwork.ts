// 语言: TypeScript
// 说明: 创意广场作品相关类型定义

export interface Artwork {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string; // 原始提示词
  musicStyle?: string;
  aspectRatio?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isPublic: boolean;
  status: ArtworkStatus;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum ArtworkStatus {
  PENDING = 'PENDING',     // 待审核
  APPROVED = 'APPROVED',   // 已通过
  REJECTED = 'REJECTED',   // 已拒绝
  PRIVATE = 'PRIVATE',     // 私有
}

export interface ArtworkLike {
  id: string;
  artworkId: string;
  userId: string;
  createdAt: string;
}

export interface ArtworkComment {
  id: string;
  artworkId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ArtworkView {
  id: string;
  artworkId: string;
  userId?: string; // 可选，支持匿名浏览
  viewedAt: string;
}

// API 请求/响应类型
export interface CreateArtworkRequest {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  musicStyle?: string;
  aspectRatio?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateArtworkRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface ArtworkListResponse {
  artworks: Artwork[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ArtworkDetailResponse {
  artwork: Artwork;
  isLiked: boolean;
  userCanEdit: boolean;
}

export interface LikeArtworkResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
  creditsEarned?: number; // 点赞奖励积分
}

export interface CommentArtworkRequest {
  content: string;
}

export interface CommentArtworkResponse {
  comment: ArtworkComment;
  creditsEarned?: number; // 评论奖励积分
}

export interface ArtworkCommentsResponse {
  comments: ArtworkComment[];
  total: number;
  hasMore: boolean;
}

// 筛选和排序选项
export enum ArtworkSortBy {
  LATEST = 'LATEST',           // 最新
  POPULAR = 'POPULAR',         // 最热门（综合点赞、评论、浏览）
  MOST_LIKED = 'MOST_LIKED',   // 最多点赞
  MOST_VIEWED = 'MOST_VIEWED', // 最多浏览
}

export interface ArtworkFilterOptions {
  sortBy?: ArtworkSortBy;
  tags?: string[];
  userId?: string; // 筛选特定用户的作品
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

export interface ArtworkListRequest {
  page?: number;
  limit?: number;
  filter?: ArtworkFilterOptions;
}

// 用户作品统计
export interface UserArtworkStats {
  totalArtworks: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  publicArtworks: number;
  privateArtworks: number;
}

// 热门标签
export interface PopularTag {
  tag: string;
  count: number;
}

export interface PopularTagsResponse {
  tags: PopularTag[];
}

// 推荐作品
export interface RecommendedArtworksResponse {
  artworks: Artwork[];
  reason: string; // 推荐理由
}

// 作品举报
export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM = 'SPAM',
  COPYRIGHT = 'COPYRIGHT',
  HARASSMENT = 'HARASSMENT',
  OTHER = 'OTHER',
}

export interface ReportArtworkRequest {
  reason: ReportReason;
  description?: string;
}

export interface ReportArtworkResponse {
  success: boolean;
  reportId: string;
}

// 作品收藏
export interface ArtworkFavorite {
  id: string;
  artworkId: string;
  userId: string;
  createdAt: string;
}

export interface FavoriteArtworkResponse {
  success: boolean;
  isFavorited: boolean;
  creditsEarned?: number; // 收藏奖励积分（给作品创作者）
}

export interface UserFavoritesResponse {
  favorites: (ArtworkFavorite & { artwork: Artwork })[];
  total: number;
  hasMore: boolean;
}
