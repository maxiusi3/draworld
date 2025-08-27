// Runware AI API configuration
const RUNWARE_API_URL = 'https://api.runware.ai/v1';
const RUNWARE_API_KEY = process.env.NEXT_PUBLIC_RUNWARE_API_KEY;

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  mood: 'joyful' | 'calm' | 'epic' | 'mysterious';
}

export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export class RunwareAPI {
  private apiKey: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    if (!RUNWARE_API_KEY) {
      throw new Error('Runware API key is not configured');
    }
    this.apiKey = RUNWARE_API_KEY;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string, options: RequestInit, retries: number = 0): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // If rate limited, wait and retry
      if (response.status === 429 && retries < this.maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * Math.pow(2, retries);
        
        await this.sleep(delay);
        return this.makeRequest(url, options, retries + 1);
      }

      // If server error, retry with exponential backoff
      if (response.status >= 500 && retries < this.maxRetries) {
        await this.sleep(this.retryDelay * Math.pow(2, retries));
        return this.makeRequest(url, options, retries + 1);
      }

      return response;
    } catch (error) {
      // Network error, retry
      if (retries < this.maxRetries) {
        await this.sleep(this.retryDelay * Math.pow(2, retries));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await this.makeRequest(`${RUNWARE_API_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Draworld/1.0',
        },
        body: JSON.stringify({
          image_url: request.imageUrl,
          prompt: request.prompt,
          mood: request.mood,
          output_format: 'mp4',
          duration: 5, // 5 seconds
          quality: 'high',
          aspect_ratio: '16:9',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.id) {
        throw new Error('Invalid API response: missing generation ID');
      }

      return {
        id: data.id,
        status: data.status || 'pending',
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        error: data.error,
      };
    } catch (error: any) {
      console.error('Runware API error:', error);
      throw new Error(error.message || 'Video generation request failed');
    }
  }

  async getGenerationStatus(id: string): Promise<VideoGenerationResponse> {
    try {
      const response = await this.makeRequest(`${RUNWARE_API_URL}/generation/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Draworld/1.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      return {
        id: data.id || id,
        status: data.status || 'unknown',
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        error: data.error,
      };
    } catch (error: any) {
      console.error('Runware API status check error:', error);
      throw new Error(error.message || 'Failed to check generation status');
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${RUNWARE_API_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Draworld/1.0',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Runware API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    requestsToday: number;
    requestsThisMonth: number;
    remainingCredits?: number;
  } | null> {
    try {
      const response = await this.makeRequest(`${RUNWARE_API_URL}/usage`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Draworld/1.0',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        requestsToday: data.requests_today || 0,
        requestsThisMonth: data.requests_this_month || 0,
        remainingCredits: data.remaining_credits,
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }
}

export const runwareAPI = new RunwareAPI();