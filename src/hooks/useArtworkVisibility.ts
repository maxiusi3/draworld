import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ToggleVisibilityResult {
  success: boolean;
  isPublic?: boolean;
  message?: string;
  artwork?: any;
}

export function useArtworkVisibility() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleVisibility = async (artworkId: string, isPublic: boolean): Promise<ToggleVisibilityResult> => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token') || 'demo-token';
      
      const response = await fetch(`/api/community/${artworkId}/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.data.message || (isPublic ? '作品已设为公开' : '作品已设为私密'));
        return {
          success: true,
          isPublic: result.data.isPublic,
          message: result.data.message,
          artwork: result.data.artwork,
        };
      } else {
        toast.error(result.data?.message || '切换失败');
        return {
          success: false,
          message: result.data?.message || '切换失败',
        };
      }
    } catch (error) {
      console.error('切换作品可见性失败:', error);
      toast.error('网络错误，请稍后重试');
      return {
        success: false,
        message: '网络错误，请稍后重试',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleVisibility,
    isLoading,
  };
}
