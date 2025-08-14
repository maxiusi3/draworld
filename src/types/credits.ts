// 语言: TypeScript
// 说明: 积分系统相关类型定义

export interface UserCredits {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyLikeGiven: number;
  lastDailyReset: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export enum CreditTransactionType {
  EARN = 'EARN',
  SPEND = 'SPEND'
}

export enum CreditTransactionReason {
  // 获得积分的原因
  REGISTRATION = 'REGISTRATION',           // 注册奖励
  DAILY_SIGNIN = 'DAILY_SIGNIN',          // 每日签到
  INVITE_REGISTER = 'INVITE_REGISTER',     // 邀请注册奖励
  INVITE_FIRST_VIDEO = 'INVITE_FIRST_VIDEO', // 被邀请者首次生成视频奖励
  LIKE_RECEIVED = 'LIKE_RECEIVED',         // 被点赞奖励
  LIKE_GIVEN = 'LIKE_GIVEN',              // 点赞奖励
  PURCHASE = 'PURCHASE',                   // 购买积分
  
  // 消费积分的原因
  VIDEO_GENERATION = 'VIDEO_GENERATION',   // 视频生成消费
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  reason: CreditTransactionReason;
  referenceId?: string; // 关联的订单ID、视频ID、邀请码等
  description?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceYuan: number;
  bonusCredits: number;
  isActive: boolean;
  sortOrder: number;
}

export interface InviteCode {
  code: string;
  inviterId: string;
  inviteeId?: string;
  isUsed: boolean;
  registeredAt?: string;
  firstVideoAt?: string;
  createdAt: string;
}

// API 请求/响应类型
export interface CreditBalanceResponse {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CreditTransactionListResponse {
  transactions: CreditTransaction[];
  total: number;
  hasMore: boolean;
}

export interface DailySigninResponse {
  success: boolean;
  creditsEarned: number;
  alreadySignedToday: boolean;
}

export interface ConsumeCreditsRequest {
  amount: number;
  reason: CreditTransactionReason;
  referenceId?: string;
  description?: string;
}

export interface ConsumeCreditsResponse {
  success: boolean;
  newBalance: number;
  transactionId: string;
}

export interface GenerateInviteCodeResponse {
  inviteCode: string;
  inviteUrl: string;
}

export interface UseInviteCodeRequest {
  inviteCode: string;
}

export interface UseInviteCodeResponse {
  success: boolean;
  creditsEarned: number;
  inviterName?: string;
}

// 积分规则常量
export const CREDIT_RULES = {
  // 获得积分
  REGISTRATION_REWARD: 150,
  DAILY_SIGNIN_REWARD: 15,
  INVITE_REGISTER_REWARD: 30,
  INVITE_FIRST_VIDEO_REWARD: 70,
  LIKE_RECEIVED_PER_5: 1,
  LIKE_GIVEN_PER_10: 1,
  LIKE_GIVEN_DAILY_LIMIT: 5,
  
  // 消费积分
  VIDEO_GENERATION_COST: 60,
  
  // 其他规则
  LIKE_THRESHOLD_FOR_REWARD: 5,
  LIKE_GIVEN_THRESHOLD_FOR_REWARD: 10,
} as const;
