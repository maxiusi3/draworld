import { apiClient } from '@/lib/apiClient';

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
  static async submitTask(submission: SocialTaskSubmission): Promise<void> {
    await apiClient.post('/social-tasks', submission);
  }

  static validateSocialUrl(url: string, platform: string): { valid: boolean; error?: string } {
    const patterns: { [key: string]: RegExp } = {
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel)\/[\w-]+\/?/,
      tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
      twitter: /^(https?:\/\/)?(www\.)?twitter\.com\/\w+\/status\/\d+/,
      facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/(photo(\.php|s)|permalink\.php|story\.php|watch|video\.php)/,
    };
    const isValid = patterns[platform]?.test(url) ?? false;
    if (isValid) {
      return { valid: true };
    }
    return { valid: false, error: `Invalid ${platform} post URL.` };
  }

  static getSharingTemplate(platform: string, videoTitle?: string): { text: string; hashtags: string[]; suggestedText: string } {
    const commonHashtags = ['#draworld', '#draworldapp', '#aianimation'];
    const baseText = `Check out this cool video I made with Draworld! ${videoTitle ? `"${videoTitle}"` : ''}`;

    switch (platform) {
      case 'instagram':
        return {
          text: `${baseText}`,
          hashtags: commonHashtags,
          suggestedText: 'Post your creation on your Instagram feed or Reels. Include the hashtags in your caption. Make sure your post is public.',
        };
      case 'tiktok':
        return {
          text: `${baseText}`,
          hashtags: commonHashtags,
          suggestedText: 'Post your creation on TikTok. Include the hashtags in your video description. Make sure your video is public.',
        };
      case 'twitter':
        return {
          text: `${baseText}`,
          hashtags: commonHashtags,
          suggestedText: 'Tweet your creation. Include the hashtags in your tweet. Make sure your tweet is public.',
        };
      case 'facebook':
        return {
          text: `${baseText}`,
          hashtags: commonHashtags,
          suggestedText: 'Post your creation on your Facebook profile or a public page. Include the hashtags in your post. Make sure your post privacy is set to Public.',
        };
      default:
        return {
          text: baseText,
          hashtags: commonHashtags,
          suggestedText: 'Share your creation on your favorite social media platform.',
        };
    }
  }
}