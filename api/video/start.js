// Vercel API路由：创建视频生成任务

export default async function handler(req, res) {
  try {
    console.log('[VIDEO START API] 视频生成任务创建请求');
    console.log('[VIDEO START API] Method:', req.method);
    console.log('[VIDEO START API] Headers:', JSON.stringify(req.headers, null, 2));
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[VIDEO START API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('[VIDEO START API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[VIDEO START API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[VIDEO START API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 解析请求体
    const body = req.body;
    console.log('[VIDEO START API] 请求体:', JSON.stringify(body, null, 2));

    const { inputImageUrl, params } = body;

    if (!inputImageUrl) {
      console.log('[VIDEO START API] 错误：缺少图片URL');
      return res.status(400).json({ error: 'Missing inputImageUrl' });
    }

    if (!params || !params.prompt) {
      console.log('[VIDEO START API] 错误：缺少提示词');
      return res.status(400).json({ error: 'Missing prompt in params' });
    }

    console.log('[VIDEO START API] 开始创建视频任务...');
    console.log('[VIDEO START API] 图片URL:', inputImageUrl);
    console.log('[VIDEO START API] 提示词:', params.prompt);
    console.log('[VIDEO START API] 宽高比:', params.aspectRatio || '16:9');
    console.log('[VIDEO START API] 音乐风格:', params.musicStyle || 'Joyful');

    // 检查是否配置了通义万相API密钥
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      console.log('[VIDEO START API] 未配置API密钥，使用演示模式');
      // 生成模拟任务ID（在演示环境中）
      const taskId = `mock-task-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      console.log('[VIDEO START API] 生成任务ID:', taskId);

      const result = {
        taskId: taskId,
        status: 'pending',
        message: '视频生成任务已创建（演示模式）'
      };

      return res.status(200).json(result);
    }

    // 真实模式：调用通义万相2.2 API
    console.log('[VIDEO START API] 使用真实API模式，调用通义万相2.2');

    try {
      const apiService = new TongyiWanxiangAPIService(apiKey);
      const aliyunTaskId = await apiService.createVideoTask({
        imageUrl: inputImageUrl,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || '16:9'
      });

      console.log('[VIDEO START API] 通义万相API返回taskId:', aliyunTaskId);

      const result = {
        taskId: aliyunTaskId,
        status: 'pending',
        message: '视频生成任务已创建'
      };

      return res.status(200).json(result);

    } catch (error) {
      console.error('[VIDEO START API] 调用通义万相API失败:', error);
      return res.status(500).json({
        error: '创建视频任务失败: ' + error.message
      });
    }

    console.log('[VIDEO START API] 任务创建成功:', result);

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('[VIDEO START API] 创建视频任务失败:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 通义万相2.2 API服务类
class TongyiWanxiangAPIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  }

  /**
   * 创建视频生成任务
   */
  async createVideoTask(params) {
    const { imageUrl, prompt, aspectRatio = '16:9' } = params;

    // 映射宽高比到分辨率
    const resolutionMap = {
      '16:9': '480P',  // 使用480P降低成本
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

    console.log('[TONGYI API] 创建视频任务请求体:', JSON.stringify(requestBody));

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

    console.log('[TONGYI API] 响应状态:', response.status);

    const responseText = await response.text();
    console.log('[TONGYI API] 响应内容:', responseText);

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
}
