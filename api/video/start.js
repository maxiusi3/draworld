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

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('[VIDEO START API] 通义万相API响应:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('[VIDEO START API] 通义万相API调用失败:', response.status, responseData);
      return res.status(500).json({
        error: 'Video generation API failed',
        message: responseData.message || 'Unknown error',
        details: responseData
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
    return res.status(500).json({ 
      error: 'Failed to start video generation',
      message: error.message 
    });
  }
}
