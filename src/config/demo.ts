// 环境配置系统
// 用于区分开发、演示、预发布和生产环境，提供不同的积分要求和功能

// 环境类型定义
export type Environment = 'development' | 'staging' | 'production' | 'demo';

// 获取当前环境
export const getCurrentEnvironment = (): Environment => {
  // 服务端环境检测
  if (typeof window === 'undefined') {
    // 明确的演示模式控制
    if (process.env.DEMO_MODE === 'true') {
      return 'demo';
    }

    // 明确的生产环境检测
    if (process.env.NODE_ENV === 'production' &&
        process.env.DASHSCOPE_API_KEY &&
        process.env.DEMO_MODE !== 'true') {
      return 'production';
    }

    // 开发环境
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }

    // Vercel环境检测
    if (process.env.VERCEL_ENV === 'preview') {
      return 'demo';
    }

    if (process.env.VERCEL_ENV === 'development' || !process.env.VERCEL_ENV) {
      return 'development';
    }

    if (process.env.VERCEL_ENV === 'staging') {
      return 'staging';
    }

    // 默认为生产环境（如果有API密钥）
    if (process.env.DASHSCOPE_API_KEY) {
      return 'production';
    }

    return 'development';
  }

  // 客户端环境检测
  const hostname = window.location.hostname;
  const port = window.location.port;

  // 开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1' ||
      port === '3000' || port === '5173' || port === '4173') {
    return 'development';
  }

  // 演示环境
  if (hostname.includes('demo') || hostname.includes('test')) {
    return 'demo';
  }

  // 预发布环境
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }

  // 生产环境
  return 'production';
};

// 检测是否为演示环境（向后兼容）
export const isDemoEnvironment = (): boolean => {
  const env = getCurrentEnvironment();
  return env === 'development' || env === 'demo';
};

// 演示环境的积分规则覆盖
export const DEMO_CREDIT_RULES = {
  // 演示环境：视频生成只需要1积分，便于测试
  VIDEO_GENERATION_COST: 1,
  
  // 其他规则保持不变
  REGISTRATION_REWARD: 150,
  DAILY_SIGNIN_REWARD: 15,
  INVITE_REGISTER_REWARD: 30,
  INVITE_FIRST_VIDEO_REWARD: 70,
  LIKE_RECEIVED_PER_5: 1,
  LIKE_GIVEN_PER_10: 1,
  LIKE_GIVEN_DAILY_LIMIT: 5,
  LIKE_THRESHOLD_FOR_REWARD: 5,
  LIKE_GIVEN_THRESHOLD_FOR_REWARD: 10,
} as const;

// 环境特定的积分规则
export const ENVIRONMENT_CREDIT_RULES = {
  development: {
    ...DEMO_CREDIT_RULES,
    VIDEO_GENERATION_COST: 1, // 开发环境：1积分便于测试
  },
  demo: {
    ...DEMO_CREDIT_RULES,
    VIDEO_GENERATION_COST: 1, // 演示环境：1积分便于展示
  },
  staging: {
    ...DEMO_CREDIT_RULES,
    VIDEO_GENERATION_COST: 10, // 预发布环境：10积分用于测试
  },
  production: {
    VIDEO_GENERATION_COST: 60, // 生产环境：60积分
    REGISTRATION_REWARD: 150,
    DAILY_SIGNIN_REWARD: 15,
    INVITE_REGISTER_REWARD: 30,
    INVITE_FIRST_VIDEO_REWARD: 70,
    LIKE_RECEIVED_PER_5: 1,
    LIKE_GIVEN_PER_10: 1,
    LIKE_GIVEN_DAILY_LIMIT: 5,
    LIKE_THRESHOLD_FOR_REWARD: 5,
    LIKE_GIVEN_THRESHOLD_FOR_REWARD: 10,
  }
} as const;

// 获取当前环境的积分规则
export const getCurrentCreditRules = () => {
  const env = getCurrentEnvironment();
  const rules = ENVIRONMENT_CREDIT_RULES[env];

  console.log(`[ENV CONFIG] 当前环境: ${env} - 视频生成: ${rules.VIDEO_GENERATION_COST}积分`);

  return rules;
};

// 获取视频生成积分要求
export const getVideoGenerationCost = (): number => {
  const rules = getCurrentCreditRules();
  return rules.VIDEO_GENERATION_COST;
};

// 环境信息和提示
export const getEnvironmentInfo = () => {
  const env = getCurrentEnvironment();
  const rules = getCurrentCreditRules();

  const environmentMessages = {
    development: '开发环境：视频生成仅需1积分，便于开发测试',
    demo: '演示环境：视频生成仅需1积分，便于功能展示',
    staging: '预发布环境：视频生成需要10积分，用于上线前测试',
    production: '生产环境：视频生成需要60积分'
  };

  return {
    environment: env,
    isDemo: env === 'development' || env === 'demo',
    isProduction: env === 'production',
    message: environmentMessages[env],
    videoGenerationCost: rules.VIDEO_GENERATION_COST,
    showEnvironmentBadge: env !== 'production'
  };
};

// 演示环境提示信息（向后兼容）
export const getDemoEnvironmentInfo = () => {
  const envInfo = getEnvironmentInfo();
  if (!envInfo.isDemo) return null;

  return {
    isDemo: true,
    message: envInfo.message,
    videoGenerationCost: envInfo.videoGenerationCost,
    environment: envInfo.environment
  };
};
