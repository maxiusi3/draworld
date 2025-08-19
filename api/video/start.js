// 语言: JavaScript
// 说明: 视频生成任务创建API端点

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

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[VIDEO START API] 收到视频生成请求');
    
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
      console.log('[VIDEO START API] 用户ID:', userId);
    } catch (error) {
      console.error('[VIDEO START API] JWT解析失败:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { inputImageUrl, params } = req.body;
    
    if (!inputImageUrl) {
      return res.status(400).json({ 
        error: 'Missing required field: inputImageUrl' 
      });
    }
    
    const { prompt, aspectRatio = '16:9', musicStyle = 'Joyful' } = params || {};
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: params.prompt' 
      });
    }
    
    console.log('[VIDEO START API] 开始调用通义万相API...');
    console.log('[VIDEO START API] 用户ID:', userId);
    console.log('[VIDEO START API] 图片URL:', inputImageUrl);
    console.log('[VIDEO START API] 提示词:', prompt);
    console.log('[VIDEO START API] 宽高比:', aspectRatio);
    console.log('[VIDEO START API] 音乐风格:', musicStyle);

    // 检查API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error('[VIDEO START API] 缺少DASHSCOPE_API_KEY环境变量');
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Missing DASHSCOPE_API_KEY'
      });
    }

    // 调用通义万相2.2 API
    const requestBody = {
      model: 'wan2.2-i2v-flash',
      input: {
        prompt: prompt,
        img_url: inputImageUrl
      },
      parameters: {
        resolution: '720P',
        prompt_extend: true,
        watermark: false
      }
    };

    console.log('[VIDEO START API] 发送请求到通义万相API:', JSON.stringify(requestBody, null, 2));
    console.log('[VIDEO START API] API Key前缀:', apiKey.substring(0, 10) + '...');
    console.log('[VIDEO START API] 请求URL:', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis');

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[VIDEO START API] HTTP响应状态:', response.status, response.statusText);
    console.log('[VIDEO START API] 响应头:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('[VIDEO START API] 通义万相API响应:', JSON.stringify(responseData, null, 2));

    // 记录关键信息用于调试
    console.log('[VIDEO START API] 响应解析:', {
      hasOutput: !!responseData.output,
      hasTaskId: !!(responseData.output?.task_id),
      taskId: responseData.output?.task_id,
      requestId: responseData.request_id,
      usage: responseData.usage
    });

    if (!response.ok) {
      console.error('[VIDEO START API] 通义万相API调用失败:', response.status, responseData);

      // 如果是401错误，说明API Key有问题
      if (response.status === 401) {
        console.error('[VIDEO START API] API Key认证失败');
        return res.status(500).json({
          error: 'API authentication failed',
          message: 'API密钥认证失败，请检查DASHSCOPE_API_KEY配置',
          suggestion: '请联系管理员检查API密钥配置'
        });
      }

      // 如果是400错误，可能是参数问题
      if (response.status === 400) {
        console.error('[VIDEO START API] 请求参数错误:', responseData);
        return res.status(400).json({
          error: 'Invalid request parameters',
          message: '请求参数错误：' + (responseData.message || '未知错误'),
          details: responseData
        });
      }

      // 其他错误
      return res.status(500).json({
        error: 'Video generation API failed',
        message: responseData.message || `HTTP ${response.status} 错误`,
        details: responseData,
        suggestion: '请稍后重试或联系技术支持'
      });
    }

    // 提取任务ID
    const taskId = responseData.output?.task_id;
    if (!taskId) {
      console.error('[VIDEO START API] API响应中缺少task_id:', responseData);
      return res.status(500).json({
        error: 'Invalid API response',
        message: 'Missing task_id in response'
      });
    }

    console.log('[VIDEO START API] 视频生成任务创建成功，任务ID:', taskId);

    // 返回前端期望的格式
    return res.status(200).json({
      taskId: taskId // 前端期望的字段名
    });
    
  } catch (error) {
    console.error('[VIDEO START API] 视频生成任务创建失败:', error);

    // 如果是网络错误，提供更详细的错误信息
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.name === 'FetchError') {
      console.error('[VIDEO START API] 网络连接错误:', error.message);
      return res.status(500).json({
        error: 'Network connection failed',
        message: '无法连接到通义万相API服务',
        details: error.message,
        suggestion: '请检查网络连接或稍后重试'
      });
    }

    return res.status(500).json({
      error: 'Failed to start video generation',
      message: error.message,
      suggestion: '请稍后重试或联系技术支持'
    });
  }
}
