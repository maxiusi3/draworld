// 语言: JavaScript
// 说明: 视频生成状态查询API端点

// 在Vercel环境中，fetch是全局可用的，但为了兼容性，我们可以添加条件导入
const fetch = globalThis.fetch || (await import('node-fetch')).default;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[VIDEO STATUS API] 收到状态查询请求');
    
    // 验证Authorization头
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    
    // 简化的JWT解析（演示模式）
    let userId;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
      console.log('[VIDEO STATUS API] 用户ID:', userId);
    } catch (error) {
      console.error('[VIDEO STATUS API] JWT解析失败:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { taskId } = req.query;
    
    if (!taskId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: taskId' 
      });
    }
    
    console.log('[VIDEO STATUS API] 查询任务ID:', taskId);

    // 检查API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error('[VIDEO STATUS API] 缺少DASHSCOPE_API_KEY环境变量');
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Missing DASHSCOPE_API_KEY'
      });
    }

    // 调用通义万相任务状态查询API
    console.log('[VIDEO STATUS API] 调用通义万相状态查询API...');

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const responseData = await response.json();
    console.log('[VIDEO STATUS API] 通义万相API响应:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('[VIDEO STATUS API] 通义万相API调用失败:', response.status, responseData);

      // 如果是404错误，说明任务不存在，返回更友好的错误信息
      if (response.status === 404) {
        console.log('[VIDEO STATUS API] 任务不存在，可能是任务ID无效或任务已过期');
        return res.status(404).json({
          error: 'Task not found',
          message: '任务不存在或已过期',
          taskId: taskId,
          suggestion: '请检查任务ID是否正确，或重新创建视频生成任务'
        });
      }

      // 如果是401错误，说明API Key有问题
      if (response.status === 401) {
        console.error('[VIDEO STATUS API] API Key认证失败');
        return res.status(500).json({
          error: 'API authentication failed',
          message: 'API密钥认证失败',
          suggestion: '请检查DASHSCOPE_API_KEY配置'
        });
      }

      // 其他错误，提供详细信息
      return res.status(500).json({
        error: 'Video status API failed',
        message: responseData.message || `HTTP ${response.status} 错误`,
        details: responseData,
        taskId: taskId
      });
    }

    // 解析任务状态
    const taskStatus = responseData.output?.task_status;
    const taskMetrics = responseData.output?.task_metrics;
    const results = responseData.output?.results;

    console.log('[VIDEO STATUS API] 任务状态:', taskStatus);
    console.log('[VIDEO STATUS API] 任务指标:', taskMetrics);
    console.log('[VIDEO STATUS API] 完整API响应结构:', {
      hasOutput: !!responseData.output,
      hasTaskStatus: !!taskStatus,
      hasResults: !!(results && results.length > 0),
      resultCount: results ? results.length : 0
    });

    // 检查响应格式是否正确
    if (!responseData.output) {
      console.error('[VIDEO STATUS API] API响应格式异常，缺少output字段:', responseData);
      return res.status(500).json({
        error: 'Invalid API response format',
        message: 'API响应格式异常',
        details: responseData,
        taskId: taskId
      });
    }

    if (!taskStatus) {
      console.error('[VIDEO STATUS API] API响应中缺少task_status字段');
      return res.status(500).json({
        error: 'Missing task status',
        message: '无法获取任务状态',
        details: responseData,
        taskId: taskId
      });
    }

    // 映射通义万相状态到前端期望的状态
    let frontendStatus;
    let videoUrl = null;
    let completedAt = null;

    switch (taskStatus) {
      case 'PENDING':
      case 'RUNNING':
        frontendStatus = 'processing';
        break;
      case 'SUCCEEDED':
        frontendStatus = 'completed';
        // 提取视频URL
        if (results && results.length > 0 && results[0].url) {
          videoUrl = results[0].url;
          completedAt = new Date().toISOString();
        }
        break;
      case 'FAILED':
        frontendStatus = 'failed';
        break;
      default:
        frontendStatus = 'processing';
    }

    const now = new Date();

    // 返回前端期望的VideoTask格式
    const videoTask = {
      id: taskId,
      userId: userId,
      imageUrl: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Generated+Image',
      prompt: '通义万相2.2生成的视频',
      musicStyle: 'Joyful',
      aspectRatio: '16:9',
      status: frontendStatus,
      videoUrl: videoUrl,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: completedAt,
      // 添加原始API响应信息用于调试
      _debug: {
        originalStatus: taskStatus,
        taskMetrics: taskMetrics,
        hasResults: !!(results && results.length > 0)
      }
    };

    console.log('[VIDEO STATUS API] 返回任务状态:', frontendStatus);
    console.log('[VIDEO STATUS API] 视频URL:', videoUrl);

    return res.status(200).json(videoTask);
    
  } catch (error) {
    console.error('[VIDEO STATUS API] 查询视频状态失败:', error);

    // 如果是网络错误或超时，提供降级响应
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.name === 'FetchError') {
      console.log('[VIDEO STATUS API] 网络错误，返回处理中状态');
      return res.status(200).json({
        id: taskId,
        userId: 'unknown',
        imageUrl: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Processing',
        prompt: '视频生成中...',
        musicStyle: 'Joyful',
        aspectRatio: '16:9',
        status: 'processing',
        videoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        _debug: {
          error: 'Network error, showing fallback status',
          originalError: error.message
        }
      });
    }

    return res.status(500).json({
      error: 'Failed to get video status',
      message: error.message,
      taskId: taskId,
      suggestion: '请稍后重试或联系技术支持'
    });
  }
}
