// 语言: TypeScript
// 说明: 图片上传服务（使用 Vercel API 路由）

import toast from 'react-hot-toast';

export class OSSStorageService {
  async uploadUserImage(file: File, userId: string): Promise<string> {
    try {
      console.log('[STORAGE SERVICE] 开始上传图片...');
      console.log('[STORAGE SERVICE] 文件名:', file.name);
      console.log('[STORAGE SERVICE] 文件大小:', file.size);
      console.log('[STORAGE SERVICE] 用户ID:', userId);

      // 将文件转换为 base64
      const base64Data = await this.fileToBase64(file);
      console.log('[STORAGE SERVICE] 文件已转换为 base64');

      // 获取认证 token
      const token = await this.getAuthToken();
      console.log('[STORAGE SERVICE] 获取到的 token:', token ? token.substring(0, 20) + '...' : 'null');

      if (!token) {
        console.error('[STORAGE SERVICE] 无法获取认证 token，检查用户登录状态');
        throw new Error('无法获取认证 token，请确保已登录');
      }

      // 调用上传 API
      const uploadUrl = `${window.location.origin}/api/upload/image`;
      console.log('[STORAGE SERVICE] 上传 URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageData: base64Data,
          fileName: file.name,
          contentType: file.type
        })
      });

      console.log('[STORAGE SERVICE] 上传响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[STORAGE SERVICE] 上传失败响应:', errorText);
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[STORAGE SERVICE] 上传成功:', result);

      if (!result.success || !result.url) {
        throw new Error('上传响应格式错误');
      }

      return result.url;

    } catch (e) {
      console.error('[STORAGE SERVICE] 上传图片失败:', e);
      toast.error('上传图片失败');
      throw e;
    }
  }

  // 将文件转换为 base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/jpeg;base64, 前缀，只保留 base64 数据
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 获取认证 token
  private async getAuthToken(): Promise<string | null> {
    try {
      console.log('[STORAGE SERVICE] 开始获取认证 token...');

      // 方法1：从 localStorage 获取认证信息（正确的格式）
      const authSession = localStorage.getItem('auth_session');
      console.log('[STORAGE SERVICE] localStorage auth_session:', authSession ? 'found' : 'not found');

      if (authSession) {
        try {
          const session = JSON.parse(authSession);
          console.log('[STORAGE SERVICE] 解析认证会话成功');
          console.log('[STORAGE SERVICE] 会话结构:', Object.keys(session));

          // 正确的路径：session.tokens.id_token
          if (session.tokens?.id_token) {
            console.log('[STORAGE SERVICE] 找到 ID token (id_token)');
            return session.tokens.id_token;
          }

          // 备用路径：session.tokens.access_token
          if (session.tokens?.access_token) {
            console.log('[STORAGE SERVICE] 找到 access token');
            return session.tokens.access_token;
          }

          // 打印详细的 tokens 结构用于调试
          if (session.tokens) {
            console.log('[STORAGE SERVICE] tokens 结构:', Object.keys(session.tokens));
            console.log('[STORAGE SERVICE] tokens 内容:', session.tokens);
          }

        } catch (parseError) {
          console.error('[STORAGE SERVICE] 解析认证会话失败:', parseError);
        }
      }

      // 方法2：尝试从 sessionStorage 获取（authAdapter 可能使用 sessionStorage）
      const sessionAuthSession = sessionStorage.getItem('auth_session');
      if (sessionAuthSession) {
        try {
          const session = JSON.parse(sessionAuthSession);
          console.log('[STORAGE SERVICE] 从 sessionStorage 找到认证会话');

          if (session.tokens?.id_token) {
            console.log('[STORAGE SERVICE] 从 sessionStorage 找到 ID token');
            return session.tokens.id_token;
          }

          if (session.tokens?.access_token) {
            console.log('[STORAGE SERVICE] 从 sessionStorage 找到 access token');
            return session.tokens.access_token;
          }
        } catch (parseError) {
          console.error('[STORAGE SERVICE] 解析 sessionStorage 认证会话失败:', parseError);
        }
      }

      // 生产环境：如果没有找到token，抛出错误
      console.error('[STORAGE SERVICE] 未找到认证 token');
      throw new Error('用户未登录，请先登录');

    } catch (error) {
      console.error('[STORAGE SERVICE] 获取认证 token 失败:', error);
      throw new Error('获取认证信息失败，请重新登录');
    }
  }
}

export const storageServiceOSS = new OSSStorageService();

