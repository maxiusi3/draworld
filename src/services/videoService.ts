import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../config/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
  private createVideoTaskFunction = httpsCallable(functions, 'createVideoTask');
  private getUserVideoTasksFunction = httpsCallable(functions, 'getUserVideoTasks');

  /**
   * 创建视频生成任务
   */
  async createVideoTask(params: CreateVideoTaskParams): Promise<string> {
    try {
      const result = await this.createVideoTaskFunction(params);
      const data = result.data as { taskId: string };
      return data.taskId;
    } catch (error: any) {
      console.error('创建视频任务失败:', error);
      
      let message = '创建任务失败';
      if (error.code === 'unauthenticated') {
        message = '请先登录';
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      throw error;
    }
  }

  /**
   * 监听任务状态变化
   */
  subscribeToTask(taskId: string, callback: (task: VideoTask | null) => void): () => void {
    const taskRef = doc(db, 'videoTasks', taskId);
    
    return onSnapshot(taskRef, (doc) => {
      if (doc.exists()) {
        const task = {
          id: doc.id,
          ...doc.data()
        } as VideoTask;
        callback(task);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('监听任务状态失败:', error);
      toast.error('获取任务状态失败');
    });
  }

  /**
   * 获取用户的视频任务列表
   */
  async getUserVideoTasks(userId: string, limitCount = 20, offset = 0): Promise<VideoTask[]> {
    try {
      const result = await this.getUserVideoTasksFunction({ limit: limitCount, offset });
      const data = result.data as { tasks: VideoTask[] };
      return data.tasks;
    } catch (error: any) {
      console.error('获取用户视频任务失败:', error);
      toast.error('获取任务列表失败');
      return [];
    }
  }

  /**
   * 直接从 Firestore 获取用户的视频任务列表 (实时)
   */
  subscribeToUserTasks(userId: string, callback: (tasks: VideoTask[]) => void, limitCount = 20): () => void {
    const tasksQuery = query(
      collection(db, 'videoTasks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoTask[];
      callback(tasks);
    }, (error) => {
      console.error('监听用户任务失败:', error);
      toast.error('获取任务列表失败');
    });
  }
}

export const videoService = new VideoService();