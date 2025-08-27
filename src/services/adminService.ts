export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
  banned?: boolean;
  bannedAt?: Date;
  banReason?: string;
  role?: string;
}

export interface AdminUserDetails extends AdminUser {
  stats: {
    totalVideos: number;
    totalTransactions: number;
    totalPayments: number;
    totalSpent: number;
  };
  videos: any[];
  transactions: any[];
  payments: any[];
}

export interface ModerationVideo {
  id: string;
  title: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: string;
  moderationStatus?: 'approved' | 'rejected' | null;
  isPublic: boolean;
  category?: string;
  tags?: string[];
  createdAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string;
  } | null;
}

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    newUsers: number;
    totalVideos: number;
    newVideos: number;
    totalRevenue: number;
    newRevenue: number;
    completedVideos: number;
    paidUsers: number;
  };
  metrics: {
    videoCompletionRate: number;
    paidConversionRate: number;
    averageRevenuePerUser: number;
  };
  topVideos: any[];
  recentUsers: any[];
  timeRange: string;
}

export class AdminService {
  /**
   * Get all users with pagination and search
   */
  static async getUsers(params: {
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startAfter?: string;
  } = {}): Promise<{
    users: AdminUser[];
    total: number;
    hasMore: boolean;
    lastDoc: string | null;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.search) queryParams.set('search', params.search);
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
      if (params.startAfter) queryParams.set('startAfter', params.startAfter);

      const response = await fetch(`/api/admin/users?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<AdminUserDetails> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user details');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user details');
    }
  }

  /**
   * Award credits to a user
   */
  static async awardCredits(
    userId: string,
    credits: number,
    reason?: string
  ): Promise<{ success: boolean; message: string; newBalance: number }> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'award_credits',
          credits,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to award credits');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to award credits');
    }
  }

  /**
   * Deduct credits from a user
   */
  static async deductCredits(
    userId: string,
    credits: number,
    reason?: string
  ): Promise<{ success: boolean; message: string; newBalance: number }> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deduct_credits',
          credits,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deduct credits');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to deduct credits');
    }
  }

  /**
   * Ban a user
   */
  static async banUser(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ban_user',
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to ban user');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to ban user');
    }
  }

  /**
   * Unban a user
   */
  static async unbanUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unban_user',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unban user');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unban user');
    }
  }

  /**
   * Get moderation queue
   */
  static async getModerationQueue(params: {
    status?: 'pending' | 'approved' | 'rejected' | 'all';
    limit?: number;
  } = {}): Promise<{
    videos: ModerationVideo[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.set('status', params.status);
      if (params.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(`/api/admin/moderation?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch moderation queue');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch moderation queue');
    }
  }

  /**
   * Moderate a video
   */
  static async moderateVideo(
    videoId: string,
    action: 'approve' | 'reject' | 'promote_to_gallery' | 'remove_from_gallery',
    options: {
      reason?: string;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/admin/moderation/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to moderate video');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to moderate video');
    }
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(timeRange: '7d' | '30d' | '90d' | 'all' = '7d'): Promise<AdminAnalytics> {
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch analytics');
    }
  }
}