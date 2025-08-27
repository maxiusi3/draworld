export interface SocialTaskSubmission {
  type: 'instagram_share' | 'tiktok_share' | 'twitter_share' | 'facebook_share';
  platform: string;
  postUrl?: string;
  hashtags?: string[];
}

export interface CreateSocialTaskRequest {
  type: 'instagram_share' | 'tiktok_share' | 'twitter_share' | 'facebook_share';
  platform: string;
  postUrl?: string;
  hashtags?: string[];
}

export interface SocialTasksResponse {
  tasks: SocialTask[];
  total: number;
}

export interface SocialTask {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  platform: string;
  postUrl?: string;
  hashtags: string[];
  status: 'pending' | 'approved' | 'rejected';
  creditsAwarded: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export class SocialTaskService {
  /**
   * Submit a social media task for review
   */
  static async submitTask(submission: SocialTaskSubmission | CreateSocialTaskRequest): Promise<{
    success: boolean;
    taskId: string;
    message: string;
  }> {
    try {
      const response = await fetch('/api/social-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit task');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit social media task');
    }
  }

  /**
   * Get user's social media tasks
   */
  static async getUserTasks(limit: number = 20): Promise<SocialTasksResponse> {
    try {
      const response = await fetch(`/api/social-tasks?limit=${limit}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tasks');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch social media tasks');
    }
  }

  /**
   * Get task type display name
   */
  static getTaskTypeLabel(type: string): string {
    switch (type) {
      case 'instagram_share':
        return 'Instagram Share';
      case 'tiktok_share':
        return 'TikTok Share';
      case 'twitter_share':
        return 'Twitter Share';
      case 'facebook_share':
        return 'Facebook Share';
      default:
        return type;
    }
  }

  /**
   * Get platform-specific sharing instructions
   */
  static getSharingInstructions(platform: string): {
    title: string;
    instructions: string[];
    hashtags: string[];
  } {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return {
          title: 'Share on Instagram',
          instructions: [
            'Post your Draworld video to your Instagram feed or story',
            'Include the hashtag #draworldapp in your caption',
            'Make sure your post is public so we can find it',
            'Copy and paste the post URL below',
          ],
          hashtags: ['#draworldapp', '#kidsart', '#aianimation', '#creativity'],
        };
      case 'tiktok':
        return {
          title: 'Share on TikTok',
          instructions: [
            'Upload your Draworld video to TikTok',
            'Include #draworldapp in your caption',
            'Set your video to public visibility',
            'Share the link to your TikTok video',
          ],
          hashtags: ['#draworldapp', '#kidsart', '#aiart', '#animation'],
        };
      case 'twitter':
        return {
          title: 'Share on Twitter',
          instructions: [
            'Tweet your Draworld video',
            'Include the hashtag #draworldapp',
            'Make sure your tweet is public',
            'Copy the tweet URL',
          ],
          hashtags: ['#draworldapp', '#kidsart', '#aianimation'],
        };
      case 'facebook':
        return {
          title: 'Share on Facebook',
          instructions: [
            'Post your Draworld video to Facebook',
            'Include #draworldapp in your post',
            'Set the post to public',
            'Copy the post URL',
          ],
          hashtags: ['#draworldapp', '#kidsart', '#creativity'],
        };
      default:
        return {
          title: 'Share on Social Media',
          instructions: [
            'Post your Draworld video',
            'Include the hashtag #draworldapp',
            'Make sure your post is public',
            'Copy the post URL',
          ],
          hashtags: ['#draworldapp'],
        };
    }
  }

  /**
   * Validate post URL format
   */
  static validatePostUrl(url: string, platform: string): boolean {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      switch (platform.toLowerCase()) {
        case 'instagram':
          return domain.includes('instagram.com');
        case 'tiktok':
          return domain.includes('tiktok.com');
        case 'twitter':
          return domain.includes('twitter.com') || domain.includes('x.com');
        case 'facebook':
          return domain.includes('facebook.com');
        default:
          return true; // Allow any valid URL for other platforms
      }
    } catch {
      return false;
    }
  }

  /**
   * Get task status information for display
   */
  static getTaskStatusInfo(status: string): {
    label: string;
    color: string;
  } {
    switch (status) {
      case 'pending':
        return { label: 'Under Review', color: 'text-yellow-400' };
      case 'approved':
        return { label: 'Approved', color: 'text-green-400' };
      case 'rejected':
        return { label: 'Rejected', color: 'text-red-400' };
      default:
        return { label: 'Unknown', color: 'text-gray-400' };
    }
  }

  /**
   * Get reward amount for task type
   */
  static getTaskReward(type: string): number {
    switch (type) {
      case 'instagram_share':
      case 'tiktok_share':
        return 100;
      case 'twitter_share':
      case 'facebook_share':
        return 50;
      default:
        return 0;
    }
  }
}