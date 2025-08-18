// 环境配置诊断API
// 用于检查当前环境配置状态，帮助诊断演示模式问题

export default async function handler(req, res) {
  try {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 检查环境变量（不暴露敏感信息）
    const envCheck = {
      // 基础环境
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      VERCEL_ENV: process.env.VERCEL_ENV || 'undefined',
      
      // 数据库配置检查
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlType: process.env.SUPABASE_URL ? 
        (process.env.SUPABASE_URL.includes('demo') ? 'demo' : 'production') : 'missing',
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseServiceKeyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        (process.env.SUPABASE_SERVICE_ROLE_KEY.includes('demo') ? 'demo' : 'production') : 'missing',
      
      // AI API配置检查
      hasDashscopeKey: !!process.env.DASHSCOPE_API_KEY,
      dashscopeKeyPrefix: process.env.DASHSCOPE_API_KEY ? 
        process.env.DASHSCOPE_API_KEY.substring(0, 8) + '...' : 'missing',
      
      // 认证配置检查
      hasAuthingIssuer: !!process.env.AUTHING_OIDC_ISSUER,
      authingIssuer: process.env.AUTHING_OIDC_ISSUER || 'using default',
      hasAuthingAudience: !!process.env.AUTHING_OIDC_AUDIENCE,
      authingAudience: process.env.AUTHING_OIDC_AUDIENCE || 'using default',
      
      // 阿里云配置检查（可选）
      hasAlibabaAccessKey: !!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      hasTablestoreInstance: !!process.env.TABLESTORE_INSTANCE,
      
      // 支付配置检查（可选）
      hasAlipayAppId: !!process.env.ALIPAY_APP_ID,
      hasAlipayPrivateKey: !!process.env.ALIPAY_PRIVATE_KEY,
    };

    // 演示模式检测逻辑
    const supabaseUrl = process.env.SUPABASE_URL || 'https://demo-project.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';
    
    const isDemoMode = supabaseUrl.includes('demo-project') || 
                       supabaseServiceKey.includes('demo') || 
                       !process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       !process.env.DASHSCOPE_API_KEY;

    // 配置建议
    const recommendations = [];
    
    if (isDemoMode) {
      recommendations.push('🚨 当前运行在演示模式');
      
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        recommendations.push('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量');
      }
      
      if (!process.env.DASHSCOPE_API_KEY) {
        recommendations.push('❌ 缺少 DASHSCOPE_API_KEY 环境变量');
      }
      
      if (supabaseUrl.includes('demo-project')) {
        recommendations.push('❌ SUPABASE_URL 使用演示配置');
      }
      
      if (supabaseServiceKey.includes('demo')) {
        recommendations.push('❌ SUPABASE_SERVICE_ROLE_KEY 使用演示配置');
      }
      
      recommendations.push('💡 要启用生产模式，请在Vercel中设置正确的环境变量');
    } else {
      recommendations.push('✅ 当前运行在生产模式');
    }

    // 功能状态检查
    const featureStatus = {
      authentication: isDemoMode ? 'demo' : 'production',
      database: isDemoMode ? 'memory/localStorage' : 'supabase',
      videoGeneration: !process.env.DASHSCOPE_API_KEY ? 'mock' : 'real-api',
      payments: !process.env.ALIPAY_APP_ID ? 'disabled' : 'enabled',
      storage: !process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ? 'local' : 'oss'
    };

    // 下一步行动建议
    const nextSteps = [];
    
    if (isDemoMode) {
      nextSteps.push('1. 在Vercel Dashboard中设置环境变量');
      nextSteps.push('2. 添加 SUPABASE_SERVICE_ROLE_KEY（真实值）');
      nextSteps.push('3. 添加 DASHSCOPE_API_KEY（真实值）');
      nextSteps.push('4. 重新部署应用');
      nextSteps.push('5. 验证生产模式是否启用');
    } else {
      nextSteps.push('✅ 环境配置正确，无需额外操作');
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: isDemoMode ? 'demo' : 'production',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      configuration: envCheck,
      features: featureStatus,
      recommendations,
      nextSteps,
      debug: {
        isDemoMode,
        demoModeReasons: {
          supabaseUrlContainsDemo: supabaseUrl.includes('demo-project'),
          supabaseKeyContainsDemo: supabaseServiceKey.includes('demo'),
          missingSupabaseKey: !process.env.SUPABASE_SERVICE_ROLE_KEY,
          missingDashscopeKey: !process.env.DASHSCOPE_API_KEY,
        }
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[ENV DEBUG] 环境检查失败:', error);
    return res.status(500).json({ 
      error: 'Environment check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
