// 语言: JavaScript
// 说明: 视频生成状态查询API端点

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
    
    // 模拟视频生成状态（演示模式）
    const mockVideoUrl = `https://mock-storage.example.com/videos/${taskId}.mp4`;
    const now = new Date();
    
    // 返回前端期望的VideoTask格式
    const videoTask = {
      id: taskId,
      userId: userId,
      imageUrl: `https://mock-storage.example.com/images/${taskId}_input.jpg`,
      prompt: '演示模式生成的视频',
      musicStyle: 'Joyful',
      aspectRatio: '16:9',
      status: 'completed', // 演示模式直接返回完成状态
      videoUrl: mockVideoUrl,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: now.toISOString()
    };
    
    console.log('[VIDEO STATUS API] 返回任务状态:', videoTask.status);
    
    return res.status(200).json(videoTask);
    
  } catch (error) {
    console.error('[VIDEO STATUS API] 查询视频状态失败:', error);
    return res.status(500).json({ 
      error: 'Failed to get video status',
      message: error.message 
    });
  }
}
