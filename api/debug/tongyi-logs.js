// 语言: JavaScript
// 说明: 通义万相API调用日志查看端点

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
    console.log('[TONGYI LOGS] 开始检查通义万相API配置和连接...');

    // 检查API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing API Key',
        message: 'DASHSCOPE_API_KEY环境变量未配置',
        suggestion: '请在环境变量中配置DASHSCOPE_API_KEY'
      });
    }

    console.log('[TONGYI LOGS] API Key配置检查:', {
      hasApiKey: !!apiKey,
      keyPrefix: apiKey.substring(0, 10) + '...',
      keyLength: apiKey.length
    });

    // 测试API连接 - 使用简单的模型列表查询
    const testUrl = 'https://dashscope.aliyuncs.com/api/v1/models';
    console.log('[TONGYI LOGS] 测试API连接:', testUrl);

    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('[TONGYI LOGS] 连接测试响应:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });

    const testData = await testResponse.json();
    console.log('[TONGYI LOGS] 连接测试数据:', JSON.stringify(testData, null, 2));

    // 检查视频生成模型是否可用
    const hasVideoModel = testData.data && testData.data.some(model => 
      model.id && model.id.includes('wan2.2-i2v')
    );

    // 返回诊断信息
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics: {
        apiKey: {
          configured: !!apiKey,
          prefix: apiKey.substring(0, 10) + '...',
          length: apiKey.length
        },
        connection: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok
        },
        models: {
          available: testData.data ? testData.data.length : 0,
          hasVideoModel: hasVideoModel,
          videoModels: testData.data ? testData.data.filter(m => 
            m.id && m.id.includes('wan2.2-i2v')
          ).map(m => m.id) : []
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      },
      rawResponse: testData,
      suggestions: [
        testResponse.ok ? '✅ API连接正常' : '❌ API连接失败，请检查网络和API密钥',
        hasVideoModel ? '✅ 视频生成模型可用' : '⚠️ 未找到wan2.2-i2v模型，请检查API权限',
        '💡 查看浏览器控制台获取详细日志',
        '🔧 如有问题，请检查DASHSCOPE_API_KEY是否正确'
      ]
    });

  } catch (error) {
    console.error('[TONGYI LOGS] 诊断过程出错:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
      suggestions: [
        '🔍 检查网络连接是否正常',
        '🔑 验证DASHSCOPE_API_KEY是否正确',
        '⏰ 稍后重试，可能是临时网络问题',
        '📞 如问题持续，请联系技术支持'
      ]
    });
  }
}
