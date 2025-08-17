// Vercel API路由：获取用户视频任务列表

export default function handler(req, res) {
  try {
    console.log('[API] /api/video/list 被调用');
    console.log('[API] Method:', req.method);
    console.log('[API] Headers:', JSON.stringify(req.headers, null, 2));

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
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

    console.log('[API] 返回模拟数据，任务数量:', mockTasks.length);

    return res.status(200).json({
      tasks: mockTasks,
      message: '模拟数据 - Authing认证集成演示'
    });

  } catch (error) {
    console.error('[API] /api/video/list 发生错误:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
