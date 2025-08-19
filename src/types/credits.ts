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
  INVITATION_REWARD = 'INVITATION_REWARD', // 邀请新用户奖励
  INVITATION_BONUS = 'INVITATION_BONUS',   // 邀请码注册奖励
  INVITATION_VIDEO_REWARD = 'INVITATION_VIDEO_REWARD', // 被邀请用户首次视频奖励
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
  reward: number;
  message: string;
  newBalance?: number;
  transactionId?: string;
  isNewUser?: boolean;
  nextSigninTime?: string;
  lastSigninTime?: string;
}

export interface ConsumeCreditsRequest {
  amount: number;
  reason: CreditTransactionReason;
  referenceId?: string;
  description?: string;
}

export interface ConsumeCreditsResponse {
  success: boolean;
  newBalance?: number;
  transactionId?: string;
  error?: string;
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

// 积分购买系统类型
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  priceYuan: number;
  originalPrice?: number; // 原价，用于显示折扣
  isPopular?: boolean; // 是否为热门套餐
  isActive: boolean;
  sortOrder: number;
  description?: string;
}

export interface Order {
  id: string;
  orderId: string; // 订单ID，与id保持一致或作为别名
  userId: string;
  packageId: string;
  packageName: string;
  credits: number;
  bonusCredits?: number; // 赠送积分
  totalCredits?: number; // 总积分（基础+赠送）
  amount: number; // 支付金额（元）
  priceYuan?: number; // 价格（元）- 用于显示
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string; // 第三方支付订单号
  createdAt: string;
  paidAt?: string;
  expiredAt?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',     // 待支付
  PAID = 'PAID',          // 已支付
  FAILED = 'FAILED',      // 支付失败
  CANCELLED = 'CANCELLED', // 已取消
  REFUNDED = 'REFUNDED',  // 已退款
}

export enum PaymentMethod {
  WECHAT = 'WECHAT',       // 微信支付
  ALIPAY = 'ALIPAY',       // 支付宝
}

// API 请求/响应类型
export interface CreateOrderRequest {
  packageId: string;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  paymentInfo?: PaymentInfo;
  message?: string;
}

export interface PaymentInfo {
  paymentUrl?: string;     // 支付链接
  qrCode?: string;         // 二维码数据
  paymentId: string;       // 支付订单号
  expiredAt: string;       // 过期时间
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: OrderStatus;
  paidAt?: string;
  creditsAdded?: number;
  isExpired?: boolean; // 订单是否已过期
  expiredAt?: string; // 过期时间
  failureReason?: string; // 失败原因
}

export interface CreditPackagesResponse {
  packages: CreditPackage[];
}

// 支付回调
export interface PaymentCallbackRequest {
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed';
  signature: string; // 签名验证
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
