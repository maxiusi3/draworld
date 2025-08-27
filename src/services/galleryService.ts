import { VideoCreation } from '@/types';

export interface GalleryVideo {
  id: string;
  title?: string;
  prompt: string;
  mood: string;
  category?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  views: number;
  shares: number;
  likes: number;
  createdAt: any;
  creatorAge?: number;
}

export interface GalleryResponse {
  videos: GalleryVideo[];
  hasMore: boolean;
  lastDoc: string | null;
}

export type SortOption = 'trending' | 'newest' | 'popular';
export type CategoryOption = 'all' | 'animals' | 'fantasy' | 'nature' | 'vehicles';

export class GalleryService {
  /**
   * Get public gallery videos
   */
  static async getGalleryVideos(
    limit: number = 20,
    startAfter?: string,
    category: CategoryOption = 'all',
    sort: SortOption = 'trending'
  ): Promise<GalleryResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sort,
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const response = await fetch(`/api/gallery?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get gallery videos');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get gallery videos');
    }
  }

  /**
   * Get featured/promoted videos for homepage
   */
  static async getFeaturedVideos(limit: number = 6): Promise<GalleryVideo[]> {
    try {
      const response = await this.getGalleryVideos(limit, undefined, 'all', 'trending');
      return response.videos;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get featured videos');
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<Record<CategoryOption, number>> {
    // This would typically be implemented with aggregation queries
    // For now, return mock data
    return {
      all: 0,
      animals: 0,
      fantasy: 0,
      nature: 0,
      vehicles: 0,
    };
  }

  /**
   * Search videos by prompt or title
   */
  static async searchVideos(
    query: string,
    limit: number = 20,
    startAfter?: string
  ): Promise<GalleryResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        q: query,
      });

      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const response = await fetch(`/api/gallery/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search videos');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search videos');
    }
  }

  /**
   * Get trending hashtags or prompts
   */
  static async getTrendingPrompts(limit: number = 10): Promise<string[]> {
    // This would typically analyze popular prompts
    // For now, return some example prompts
    return [
      'dragon flying over mountains',
      'unicorn in magical forest',
      'robot saving the world',
      'cat playing with butterflies',
      'spaceship to the moon',
      'princess in castle',
      'dinosaur in jungle',
      'superhero flying',
      'mermaid underwater',
      'wizard casting spell',
    ].slice(0, limit);
  }

  /**
   * Validate category
   */
  static isValidCategory(category: string): category is CategoryOption {
    return ['all', 'animals', 'fantasy', 'nature', 'vehicles'].includes(category);
  }

  /**
   * Validate sort option
   */
  static isValidSortOption(sort: string): sort is SortOption {
    return ['trending', 'newest', 'popular'].includes(sort);
  }

  /**
   * Get category display name
   */
  static getCategoryDisplayName(category: CategoryOption): string {
    const displayNames: Record<CategoryOption, string> = {
      all: 'All',
      animals: 'Animals',
      fantasy: 'Fantasy',
      nature: 'Nature',
      vehicles: 'Vehicles',
    };
    return displayNames[category];
  }

  /**
   * Get sort option display name
   */
  static getSortDisplayName(sort: SortOption): string {
    const displayNames: Record<SortOption, string> = {
      trending: 'Trending',
      newest: 'Newest',
      popular: 'Most Popular',
    };
    return displayNames[sort];
  }

  /**
   * Get category icon
   */
  static getCategoryIcon(category: CategoryOption): string {
    const icons: Record<CategoryOption, string> = {
      all: '🎨',
      animals: '🐾',
      fantasy: '🦄',
      nature: '🌿',
      vehicles: '🚗',
    };
    return icons[category];
  }
}