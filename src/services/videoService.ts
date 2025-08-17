import toast from 'react-hot-toast';
import { functionsClient } from '../lib/adapters/client';


export interface VideoTask {
  id: string;
  userId: string;
  imageUrl: string;
  prompt: string;
  musicStyle: string;
  aspectRatio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

export interface CreateVideoTaskParams {
  imageUrl: string;
  prompt: string;
  musicStyle: 'Joyful' | 'Warm' | 'Epic' | 'Mysterious' | 'Calm';
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21';
}

class VideoService {
  /**
   * 创建视频生成任务（改为调用后端 /api/video/start）
   */
  async createVideoTask(params: CreateVideoTaskParams): Promise<string> {
    try {
      const res = await functionsClient.createVideo({
        inputImageUrl: params.imageUrl,
        params: { prompt: params.prompt, aspectRatio: params.aspectRatio, musicStyle: params.musicStyle }
      });
      if (!res.taskId) throw new Error('Invalid API response');
      return res.taskId;
    } catch (error: any) {
      console.error('创建视频任务失败:', error);
      let message = '创建任务失败';
      let shouldRetry = false;

      // 根据错误代码提供具体的错误信息
      switch (error.code) {
        case 'unauthenticated':
          message = '请先登录后再试';
          break;
        case 'permission-denied':
          message = '权限不足，请检查登录状态';
          break;
        case 'unavailable':
          message = '服务暂时不可用，请稍后重试';
          shouldRetry = true;
          break;
        case 'deadline-exceeded':
          message = '请求超时，请稍后重试';
          shouldRetry = true;
          break;
        case 'resource-exhausted':
          message = 'API配额不足，请稍后重试';
          shouldRetry = true;
          break;
        case 'invalid-argument':
          message = error.message || '请求参数无效';
          break;
        case 'internal':
          message = error.message || '系统内部错误，请稍后重试';
          shouldRetry = true;
          break;
        default:
          if (error.message) {
            message = error.message;
          }
          shouldRetry = true;
      }

      // 显示错误信息
      toast.error(message + (shouldRetry ? '\n\n点击重试按钮可以重新尝试' : ''));

      throw error;
    }
  }



  /**
   * 监听任务状态变化
   */
  subscribeToTask(taskId: string, callback: (task: VideoTask | null) => void): () => void {
    // TODO: 迁移后改为基于自建 API 的长轮询或 SSE
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const task = await functionsClient.getVideoStatus(taskId as string);
          callback(task as any);
        } catch (e) {
          console.error('轮询任务状态失败', e);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }

  /**
   * 获取用户的视频任务列表
   */
  async getUserVideoTasks(_userId: string, limitCount = 20, _offset = 0): Promise<VideoTask[]> {
    try {
      // 始终使用当前域名，避免跨域问题
      const apiUrl = `${window.location.origin}/api/video/list?limit=${limitCount}`;
      console.log('[VIDEO SERVICE] API调用URL:', apiUrl);
      console.log('[VIDEO SERVICE] 当前域名:', window.location.origin);

      const resp = await fetch(apiUrl, {
        headers: { 'Authorization': 'Bearer ' + (await (await import('../lib/adapters/authAdapter')).authAdapter.getIdToken()) }
      });
      if (!resp.ok) throw new Error('获取列表失败');
      const data = await resp.json();
      return (data.tasks || []) as VideoTask[];
    } catch (error: any) {
      console.error('获取用户视频任务失败:', error);
      toast.error('获取任务列表失败');
      return [];
    }
  }



  /**
   * 获取用户任务列表（暂以轮询或按钮刷新方式，从自建 API 获取）
   */
  subscribeToUserTasks(userId: string, callback: (tasks: VideoTask[]) => void, limitCount = 20): () => void {
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          // 始终使用当前域名，避免跨域问题
          const apiUrl = `${window.location.origin}/api/video/list?limit=${limitCount}`;
          console.log('[VIDEO SERVICE POLL] API调用URL:', apiUrl);

          const resp = await fetch(apiUrl, {
            headers: { 'Authorization': 'Bearer ' + (await (await import('../lib/adapters/authAdapter')).authAdapter.getIdToken()) }
          });
          if (resp.ok) {
            const data = await resp.json();
            callback((data.tasks || []) as VideoTask[]);
          }
        } catch (e) {
          console.error('轮询用户任务失败', e);
        }
        await new Promise(r => setTimeout(r, 5000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }
}

export const videoService = new VideoService();