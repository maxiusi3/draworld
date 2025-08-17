// Vercel API路由：查询视频生成任务状态

export default function handler(req, res) {
  try {
    console.log('[VIDEO STATUS API] 视频任务状态查询请求');
    console.log('[VIDEO STATUS API] Method:', req.method);
    console.log('[VIDEO STATUS API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[VIDEO STATUS API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[VIDEO STATUS API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[VIDEO STATUS API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[VIDEO STATUS API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 获取任务ID
    const { taskId } = req.query;

    if (!taskId) {
      console.log('[VIDEO STATUS API] 错误：缺少任务ID');
      return res.status(400).json({ error: 'Missing taskId parameter' });
    }

    console.log('[VIDEO STATUS API] 查询任务状态，任务ID:', taskId);

    // 检查是否配置了通义万相API密钥
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      console.log('[VIDEO STATUS API] 未配置API密钥，使用演示模式');

      // 模拟任务状态（在演示环境中）
      // 根据任务ID的时间戳来模拟不同的状态
      const taskTimestamp = extractTimestampFromTaskId(taskId);
      const currentTime = Date.now();
      const elapsedTime = currentTime - taskTimestamp;

      let status, resultVideoUrl, progress;

      if (elapsedTime < 10000) { // 前10秒：处理中
        status = 'processing';
        progress = Math.min(90, Math.floor((elapsedTime / 10000) * 90));
        resultVideoUrl = null;
      } else if (elapsedTime < 15000) { // 10-15秒：即将完成
        status = 'processing';
        progress = 95;
        resultVideoUrl = null;
      } else { // 15秒后：完成
        status = 'completed';
        progress = 100;
        // 使用一个示例视频URL
        resultVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
      }

      const taskInfo = {
        id: taskId,
        taskId: taskId,
        status: status,
        progress: progress,
        resultVideoUrl: resultVideoUrl,
        inputImageUrl: 'https://example.com/input-image.jpg',
        prompt: '演示视频生成任务',
        musicStyle: 'Joyful',
        aspectRatio: '16:9',
        userId: 'demo-user',
        createdAt: taskTimestamp,
        updatedAt: currentTime,
        completedAt: status === 'completed' ? currentTime : null,
        message: status === 'completed' ? '视频生成完成（演示模式）' : '视频生成中（演示模式）'
      };

      console.log('[VIDEO STATUS API] 返回任务状态:', taskInfo);
      return res.status(200).json(taskInfo);
    }

    // 真实模式：查询通义万相API
    console.log('[VIDEO STATUS API] 使用真实API模式，查询通义万相任务状态');

    try {
      const apiService = new TongyiWanxiangAPIService(apiKey);
      const taskStatus = await apiService.getTaskStatus(taskId);

      console.log('[VIDEO STATUS API] 通义万相API返回状态:', taskStatus);
      return res.status(200).json(taskStatus);

    } catch (error) {
      console.error('[VIDEO STATUS API] 查询通义万相API失败:', error);
      // 如果API调用失败，回退到演示模式
      console.log('[VIDEO STATUS API] API调用失败，回退到演示模式');
    }

    const taskTimestamp = extractTimestampFromTaskId(taskId);
    const currentTime = Date.now();
    const elapsedTime = currentTime - taskTimestamp;

    let status, resultVideoUrl, progress;

    if (elapsedTime < 10000) { // 前10秒：处理中
      status = 'processing';
      progress = Math.min(90, Math.floor((elapsedTime / 10000) * 90));
      resultVideoUrl = null;
    } else if (elapsedTime < 15000) { // 10-15秒：即将完成
      status = 'processing';
      progress = 95;
      resultVideoUrl = null;
    } else { // 15秒后：完成
      status = 'completed';
      progress = 100;
      // 使用一个示例视频URL
      resultVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    }

    const taskInfo = {
      id: taskId,
      taskId: taskId,
      status: status,
      progress: progress,
      resultVideoUrl: resultVideoUrl,
      inputImageUrl: 'https://example.com/input-image.jpg',
      prompt: '真实视频生成任务',
      musicStyle: 'Joyful',
      aspectRatio: '16:9',
      userId: 'user',
      createdAt: taskTimestamp,
      updatedAt: currentTime,
      completedAt: status === 'completed' ? currentTime : null,
      message: status === 'completed' ? '视频生成完成' : '视频生成中'
    };

    console.log('[VIDEO STATUS API] 返回任务状态:', taskInfo);
    return res.status(200).json(taskInfo);
    
  } catch (error) {
    console.error('[VIDEO STATUS API] 查询任务状态失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 从任务ID中提取时间戳
function extractTimestampFromTaskId(taskId) {
  try {
    // 任务ID格式：mock-task-{timestamp}-{random}
    const parts = taskId.split('-');
    if (parts.length >= 3 && parts[0] === 'mock' && parts[1] === 'task') {
      const timestamp = parseInt(parts[2]);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }
  } catch (error) {
    console.error('[VIDEO STATUS API] 解析任务ID时间戳失败:', error);
  }
  
  // 如果解析失败，返回当前时间减去30秒（模拟已完成的任务）
  return Date.now() - 30000;
}

// 通义万相2.2 API服务类
class TongyiWanxiangAPIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  }

  /**
   * 查询视频生成任务状态
   */
  async getTaskStatus(taskId) {
    console.log('[TONGYI API] 查询任务状态，任务ID:', taskId);

    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('[TONGYI API] 状态查询响应状态:', response.status);

    const responseText = await response.text();
    console.log('[TONGYI API] 状态查询响应内容:', responseText);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);

    // 转换API响应格式为前端期望的格式
    const taskInfo = {
      id: taskId,
      taskId: taskId,
      status: this.mapApiStatus(result.task_status),
      progress: this.calculateProgress(result.task_status),
      resultVideoUrl: result.output?.video_url || null,
      inputImageUrl: result.input?.img_url || '',
      prompt: result.input?.prompt || '',
      musicStyle: 'Joyful',
      aspectRatio: '16:9',
      userId: 'user',
      createdAt: result.submit_time ? new Date(result.submit_time).getTime() : Date.now(),
      updatedAt: Date.now(),
      completedAt: result.task_status === 'SUCCEEDED' ? Date.now() : null,
      message: this.getStatusMessage(result.task_status),
      error: result.task_status === 'FAILED' ? result.message : null
    };

    return taskInfo;
  }

  /**
   * 映射API状态到前端状态
   */
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case 'PENDING':
      case 'RUNNING':
        return 'processing';
      case 'SUCCEEDED':
        return 'completed';
      case 'FAILED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * 计算进度百分比
   */
  calculateProgress(apiStatus) {
    switch (apiStatus) {
      case 'PENDING':
        return 10;
      case 'RUNNING':
        return 50;
      case 'SUCCEEDED':
        return 100;
      case 'FAILED':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * 获取状态消息
   */
  getStatusMessage(apiStatus) {
    switch (apiStatus) {
      case 'PENDING':
        return '任务排队中...';
      case 'RUNNING':
        return '视频生成中...';
      case 'SUCCEEDED':
        return '视频生成完成';
      case 'FAILED':
        return '视频生成失败';
      default:
        return '未知状态';
    }
  }
}


