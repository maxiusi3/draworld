// 生产环境配置 - 纯生产模式
// 替代原有的demo.ts文件，只提供生产环境配置

// 生产环境积分规则
export const PRODUCTION_CREDIT_RULES = {
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
} as const;

// 获取视频生成积分要求
export const getVideoGenerationCost = (): number => {
  return PRODUCTION_CREDIT_RULES.VIDEO_GENERATION_COST;
};

// 获取环境信息（纯生产模式）
export const getEnvironmentInfo = () => {
  return {
    environment: 'production',
    isDemo: false,
    isProduction: true,
    message: '生产环境：视频生成需要60积分',
    videoGenerationCost: PRODUCTION_CREDIT_RULES.VIDEO_GENERATION_COST,
    showEnvironmentBadge: false
  };
};

// 向后兼容的演示环境信息（总是返回null，因为没有演示模式）
export const getDemoEnvironmentInfo = () => {
  return null;
};

// 向后兼容的演示环境检测（总是返回false）
export const isDemoEnvironment = (): boolean => {
  return false;
};

// 获取当前积分规则
export const getCurrentCreditRules = () => {
  return PRODUCTION_CREDIT_RULES;
};

// 获取当前环境（总是返回production）
export const getCurrentEnvironment = () => {
  return 'production';
};
