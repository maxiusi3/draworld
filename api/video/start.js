// 语言: JavaScript
// 说明: 视频生成任务创建API端点

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
    
    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[VIDEO START API] 视频生成任务创建成功');
    console.log('[VIDEO START API] 任务ID:', taskId);
    console.log('[VIDEO START API] 用户ID:', userId);
    console.log('[VIDEO START API] 图片URL:', inputImageUrl);
    console.log('[VIDEO START API] 提示词:', prompt);
    console.log('[VIDEO START API] 宽高比:', aspectRatio);
    console.log('[VIDEO START API] 音乐风格:', musicStyle);
    
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
