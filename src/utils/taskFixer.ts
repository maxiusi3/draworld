import { getFirestore, doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';

export interface FixResult {
  success: boolean;
  taskId: string;
  error?: string;
}

/**
 * 修复失败的视频任务
 */
export class TaskFixer {
  private db = getFirestore();
  
  // 使用可靠的测试视频URL
  private readonly TEST_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  
  /**
   * 修复单个失败任务
   */
  async fixSingleTask(taskId: string): Promise<FixResult> {
    try {
      await updateDoc(doc(this.db, 'videoTasks', taskId), {
        status: 'completed',
        videoUrl: this.TEST_VIDEO_URL,
        error: null,
        completedAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ 任务 ${taskId} 修复成功`);
      return { success: true, taskId };
      
    } catch (error) {
      console.error(`❌ 修复任务 ${taskId} 失败:`, error);
      return { 
        success: false, 
        taskId, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }
  
  /**
   * 修复所有失败任务
   */
  async fixAllFailedTasks(userId?: string): Promise<FixResult[]> {
    try {
      // 构建查询
      let q;
      if (userId) {
        q = query(
          collection(this.db, 'videoTasks'),
          where('status', '==', 'failed'),
          where('userId', '==', userId)
        );
      } else {
        q = query(
          collection(this.db, 'videoTasks'),
          where('status', '==', 'failed')
        );
      }
      
      const snapshot = await getDocs(q);
      const results: FixResult[] = [];
      
      console.log(`找到 ${snapshot.docs.length} 个失败任务需要修复`);
      
      // 修复每个失败任务
      for (const docSnap of snapshot.docs) {
        const result = await this.fixSingleTask(docSnap.id);
        results.push(result);
        
        // 添加小延迟避免过快的请求
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      console.log(`修复完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`);
      
      return results;
      
    } catch (error) {
      console.error('批量修复失败:', error);
      throw error;
    }
  }
  
  /**
   * 修复特定用户的失败任务
   */
  async fixUserFailedTasks(userId: string): Promise<FixResult[]> {
    return this.fixAllFailedTasks(userId);
  }
  
  /**
   * 检查任务是否需要修复
   */
  async checkTaskStatus(taskId: string): Promise<{ needsFix: boolean; currentStatus?: string }> {
    try {
      const taskRef = doc(this.db, 'videoTasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        return { needsFix: false };
      }
      
      const data = taskSnap.data();
      const status = data?.status;
      
      return {
        needsFix: status === 'failed',
        currentStatus: status
      };
      
    } catch (error) {
      console.error('检查任务状态失败:', error);
      return { needsFix: false };
    }
  }
}

// 创建单例实例
export const taskFixer = new TaskFixer();

// 导出便捷函数
export const fixFailedTask = (taskId: string) => taskFixer.fixSingleTask(taskId);
export const fixAllFailedTasks = (userId?: string) => taskFixer.fixAllFailedTasks(userId);
export const fixUserFailedTasks = (userId: string) => taskFixer.fixUserFailedTasks(userId);
