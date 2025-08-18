// 合并的Video API - 处理视频相关的所有操作
// 支持: start (创建任务), list (获取列表), status (查询状态)

export default async function handler(req, res) {
  try {
    console.log('[VIDEO API] 请求接收');
    console.log('[VIDEO API] Method:', req.method);
    console.log('[VIDEO API] URL:', req.url);
    console.log('[VIDEO API] Query:', req.query);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[VIDEO API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[VIDEO API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[VIDEO API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 根据查询参数或请求体中的action来路由
    const action = req.query.action || req.body?.action;
    
    console.log('[VIDEO API] Action:', action);

    switch (action) {
      case 'start':
        return await handleVideoStart(req, res);
      case 'list':
        return await handleVideoList(req, res);
      case 'status':
        return await handleVideoStatus(req, res);
      default:
        // 如果没有指定action，根据HTTP方法和参数推断
        if (req.method === 'POST') {
          return await handleVideoStart(req, res);
        } else if (req.method === 'GET' && req.query.taskId) {
          return await handleVideoStatus(req, res);
        } else if (req.method === 'GET') {
          return await handleVideoList(req, res);
        } else {
          return res.status(400).json({ 
            error: 'Invalid request. Please specify action parameter or use appropriate HTTP method.' 
          });
        }
    }
    
  } catch (error) {
    console.error('[VIDEO API] 处理请求失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 处理视频任务创建
async function handleVideoStart(req, res) {
  try {
    console.log('[VIDEO START] 视频生成任务创建请求');
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed for start action' });
    }

    const body = req.body;
    console.log('[VIDEO START] 请求体:', JSON.stringify(body, null, 2));

    const { inputImageUrl, params } = body;

    if (!inputImageUrl) {
      console.log('[VIDEO START] 错误：缺少图片URL');
      return res.status(400).json({ error: 'Missing inputImageUrl' });
    }

    if (!params || !params.prompt) {
      console.log('[VIDEO START] 错误：缺少提示词');
      return res.status(400).json({ error: 'Missing prompt in params' });
    }

    console.log('[VIDEO START] 开始创建视频任务...');
    console.log('[VIDEO START] 图片URL:', inputImageUrl);
    console.log('[VIDEO START] 提示词:', params.prompt);

    // 检查是否配置了通义万相API密钥
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      console.log('[VIDEO START] 未配置API密钥，使用演示模式');
      const taskId = `mock-task-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const result = {
        taskId: taskId,
        status: 'pending',
        message: '视频生成任务已创建（演示模式）'
      };

      return res.status(200).json(result);
    }

    // 真实模式：调用通义万相2.2 API
    try {
      const apiService = new TongyiWanxiangAPIService(apiKey);
      const aliyunTaskId = await apiService.createVideoTask({
        imageUrl: inputImageUrl,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || '16:9'
      });

      const result = {
        taskId: aliyunTaskId,
        status: 'pending',
        message: '视频生成任务已创建'
      };

      return res.status(200).json(result);

    } catch (error) {
      console.error('[VIDEO START] 调用通义万相API失败:', error);
      return res.status(500).json({
        error: '创建视频任务失败: ' + error.message
      });
    }
    
  } catch (error) {
    console.error('[VIDEO START] 创建视频任务失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 处理视频任务列表获取
async function handleVideoList(req, res) {
  try {
    console.log('[VIDEO LIST] 获取用户视频任务列表');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed for list action' });
    }

    // 模拟数据
    const mockTasks = [
      {
        taskId: 'mock-task-1',
        status: 'completed',
        resultVideoUrl: 'https://example.com/video1.mp4',
        inputImageUrl: 'https://example.com/image1.jpg',
        userId: 'user123',
        createdAt: Date.now() - 3600000
      },
      {
        taskId: 'mock-task-2',
        status: 'processing',
        resultVideoUrl: null,
        inputImageUrl: 'https://example.com/image2.jpg',
        userId: 'user123',
        createdAt: Date.now() - 1800000
      }
    ];

    console.log('[VIDEO LIST] 返回任务列表，数量:', mockTasks.length);

    return res.status(200).json({
      success: true,
      tasks: mockTasks,
      total: mockTasks.length
    });
    
  } catch (error) {
    console.error('[VIDEO LIST] 获取任务列表失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 处理视频任务状态查询
async function handleVideoStatus(req, res) {
  try {
    console.log('[VIDEO STATUS] 视频任务状态查询请求');
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed for status action' });
    }

    const { taskId } = req.query;

    if (!taskId) {
      console.log('[VIDEO STATUS] 错误：缺少任务ID');
      return res.status(400).json({ error: 'Missing taskId parameter' });
    }

    console.log('[VIDEO STATUS] 查询任务状态，任务ID:', taskId);

    // 检查是否配置了通义万相API密钥
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      console.log('[VIDEO STATUS] 未配置API密钥，使用演示模式');

      // 模拟任务状态
      const mockStatus = {
        taskId: taskId,
        status: 'completed',
        resultVideoUrl: `https://example.com/video-${taskId}.mp4`,
        progress: 100,
        message: '视频生成完成（演示模式）'
      };

      return res.status(200).json(mockStatus);
    }

    // 真实模式：查询通义万相API
    try {
      const apiService = new TongyiWanxiangAPIService(apiKey);
      const status = await apiService.getTaskStatus(taskId);
      return res.status(200).json(status);

    } catch (error) {
      console.error('[VIDEO STATUS] 查询任务状态失败:', error);
      return res.status(500).json({
        error: '查询任务状态失败: ' + error.message
      });
    }
    
  } catch (error) {
    console.error('[VIDEO STATUS] 查询任务状态失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// 通义万相2.2 API服务类
class TongyiWanxiangAPIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  }

  async createVideoTask(params) {
    const { imageUrl, prompt, aspectRatio = '16:9' } = params;

    const resolutionMap = {
      '16:9': '480P',
      '4:3': '480P',
      '1:1': '480P',
      '3:4': '480P',
      '9:16': '480P',
      '21:9': '480P',
      '9:21': '480P'
    };

    const requestBody = {
      model: 'wan2.2-i2v-flash',
      input: {
        prompt: prompt,
        img_url: imageUrl
      },
      parameters: {
        resolution: resolutionMap[aspectRatio] || '480P',
        duration: 5,
        prompt_extend: true,
        watermark: false
      }
    };

    const response = await fetch(`${this.baseUrl}/services/aigc/video-generation/video-synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);

    if (result.output && result.output.task_id) {
      return result.output.task_id;
    } else {
      throw new Error(`API返回格式错误: ${responseText}`);
    }
  }

  async getTaskStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    return result;
  }
}
