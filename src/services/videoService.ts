import { VideoCreation } from '@/types';
import { Timestamp } from 'firebase/firestore';

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
  createdAt: Timestamp;
}

export class VideoService {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to start video generation';
      throw new Error(errorMessage);
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to check video status');
    }
  }

  /**
   * Poll video status until completion
   */
  static async pollVideoStatus(
    videoCreationId: string,
    onStatusUpdate?: (status: VideoStatusResponse) => void,
    maxAttempts: number = 60, // 5 minutes with 5-second intervals
    interval: number = 5000 // 5 seconds
  ): Promise<VideoStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.getVideoStatus(videoCreationId);
          
          // Call status update callback if provided
          onStatusUpdate?.(status);

          // Check if generation is complete
          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          // Check if generation failed
          if (status.status === 'failed') {
            reject(new Error(status.error || 'Video generation failed'));
            return;
          }

          // Check if max attempts reached
          if (attempts >= maxAttempts) {
            reject(new Error('Video generation timeout - please check back later'));
            return;
          }

          // Continue polling if still processing
          if (status.status === 'pending' || status.status === 'processing') {
            setTimeout(poll, interval);
          } else {
            reject(new Error(`Unexpected status: ${status.status}`));
          }

        } catch (error: any) {
          reject(error);
        }
      };

      // Start polling
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
        throw new Error(data.error || 'Failed to get user videos');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user videos');
    }
  }

  /**
   * Delete a video creation
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete video');
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update video visibility');
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record video share');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Don't throw error for share tracking failures
      console.warn('Failed to record video share:', error.message);
      return {
        success: false,
        shareUrl: `${window.location.origin}/creation/${videoCreationId}/result`
      };
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update video');
    }
  }

  /**
   * Generate download URL for video
   */
  static async downloadVideo(videoCreationId: string): Promise<{ downloadUrl: string }> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}/download`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate download URL');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate download URL');
    }
  }

  /**
   * Report video for content moderation
   */
  static async reportVideo(videoCreationId: string, reportData: {
    reason: string;
    description?: string;
  }): Promise<{ success: boolean; reportId: string }> {
    try {
      const response = await fetch(`/api/video/${videoCreationId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to report video');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to report video');
    }
  }

  /**
   * Get mood-specific music/sound settings
   */
  static getMoodSettings(mood: 'joyful' | 'calm' | 'epic' | 'mysterious') {
    const moodSettings = {
      joyful: {
        musicStyle: 'upbeat',
        tempo: 'fast',
        instruments: ['piano', 'strings', 'percussion'],
        energy: 'high',
      },
      calm: {
        musicStyle: 'ambient',
        tempo: 'slow',
        instruments: ['piano', 'strings', 'flute'],
        energy: 'low',
      },
      epic: {
        musicStyle: 'cinematic',
        tempo: 'medium',
        instruments: ['orchestra', 'brass', 'percussion'],
        energy: 'high',
      },
      mysterious: {
        musicStyle: 'atmospheric',
        tempo: 'slow',
        instruments: ['synth', 'strings', 'ambient'],
        energy: 'medium',
      },
    };

    return moodSettings[mood];
  }

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

    if (!request.prompt) {
      errors.push('Prompt is required');
    } else if (request.prompt.length > 300) {
      errors.push('Prompt must be 300 characters or less');
    }

    if (!request.mood) {
      errors.push('Mood is required');
    } else {
      const validMoods = ['joyful', 'calm', 'epic', 'mysterious'];
      if (!validMoods.includes(request.mood)) {
        errors.push('Invalid mood selected');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}