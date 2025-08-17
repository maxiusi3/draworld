// Vercel API路由：OSS STS 兼容性接口
// 注意：这是一个兼容性接口，实际上不使用真正的 OSS STS

export default function handler(req, res) {
  try {
    console.log('[STS API] OSS STS 请求');
    console.log('[STS API] Method:', req.method);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      console.log('[STS API] 处理 OPTIONS 请求');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      console.log('[STS API] 错误：不支持的方法', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证Authorization头
    const authHeader = req.headers.authorization;
    console.log('[STS API] Authorization header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[STS API] 错误：缺少或无效的 Authorization 头');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 返回模拟的 STS 凭证（实际上不会被使用）
    // 这是为了兼容现有的代码结构
    const mockCredentials = {
      accessKeyId: 'mock-access-key-id',
      accessKeySecret: 'mock-access-key-secret',
      securityToken: 'mock-security-token',
      region: 'mock-region',
      bucket: 'mock-bucket',
      expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15分钟后过期
      prefix: 'mock-prefix/'
    };

    console.log('[STS API] 返回模拟 STS 凭证');
    
    return res.status(200).json(mockCredentials);
    
  } catch (error) {
    console.error('[STS API] STS 请求失败:', error);
    return res.status(500).json({ 
      error: 'STS request failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
