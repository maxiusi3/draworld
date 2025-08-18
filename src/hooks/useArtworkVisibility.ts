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
      // 从sessionStorage获取认证会话
      const authSession = localStorage.getItem('auth_session');
      let token = null;

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          token = session.tokens?.access_token;
        } catch (error) {
          console.error('解析认证会话失败:', error);
        }
      }

      if (!token) {
        throw new Error('用户未登录，请先登录');
      }

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
