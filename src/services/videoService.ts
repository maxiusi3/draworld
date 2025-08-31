import { VideoCreation } from '@/types';

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  mood: 'joyful' | 'calm' | 'epic' | 'mysterious';
  title?: string;
}

export interface VideoGenerationResponse {
  success: boolean;
  videoCreationId: string;
  generationId: string;
  status: string;
  creditsRemaining: number;
  error?: string;
  message?: string;
}

export interface VideoStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  title: string;
  prompt: string;
  mood: string;
  createdAt: unknown;
}

export class VideoService {
  /**
   * Validate video generation request
   */
  static validateGenerationRequest(request: VideoGenerationRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!request.imageUrl) {
      errors.push('Image URL is required');
    }
    
    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }
    
    if (!['joyful', 'calm', 'epic', 'mysterious'].includes(request.mood)) {
      errors.push('Invalid mood selected');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Start video generation
   */
  static async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Video generation failed');
      }

      return data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start video generation');
    }
  }

  /**
   * Check video generation status
   */
  static async getVideoStatus(videoCreationId: string): Promise<VideoStatusResponse> {
    try {
      const response = await fetch(`/api/video/status/${videoCreationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get video status');
      }

      return data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get video status');
    }
  }

  /**
   * Poll video status until completion
   */
  static async pollVideoStatus(
    videoCreationId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<VideoStatusResponse> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          const status = await this.getVideoStatus(videoCreationId);
          
          if (onProgress) {
            onProgress(status.status);
          }
          
          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
            return;
          }
          
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Video generation timeout'));
            return;
          }
          
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  /**
   * Get user's video creations
   */
  static async getUserVideos(limit: number = 20, startAfter?: string): Promise<{
    videos: VideoCreation[];
    hasMore: boolean;
    lastDoc: string | null;
  }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (startAfter) {
        params.append('startAfter', startAfter);
      }

      const response = await fetch(`/api/video/user?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load videos');
      }

      return data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to load videos');
    }
  }

  /**
   * Delete video
   */
  static async deleteVideo(videoCreationId: string): Promise<void> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete video');
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete video');
    }
  }

  /**
   * Update video visibility
   */
  static async updateVideoVisibility(
    videoCreationId: string,
    isPublic: boolean
  ): Promise<void> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update video visibility');
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update video visibility');
    }
  }

  /**
   * Share video (increment share count)
   */
  static async shareVideo(videoCreationId: string): Promise<{ success: boolean; shareUrl: string }> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}/share`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share video');
      }

      return {
        success: true,
        shareUrl: `${window.location.origin}/creation/${videoCreationId}/result`,
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to share video');
    }
  }

  /**
   * Update video metadata
   */
  static async updateVideo(videoCreationId: string, updates: Partial<VideoCreation>): Promise<void> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update video');
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update video');
    }
  }

  /**
   * Generate download URL for video
   */
  static async downloadVideo(videoCreationId: string): Promise<{ downloadUrl: string }> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}/download`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download URL');
      }

      return data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate download URL');
    }
  }
}