/**
 * Generate unique referral code
 */
export function generateReferralCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const userHash = userId.slice(-4);
  return `${userHash}${timestamp}`.toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Sleep utility for testing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Credit system constants
 */
export const CREDIT_AMOUNTS = {
  SIGNUP_BONUS: 150,
  DAILY_CHECKIN: 15,
  REFERRAL_SIGNUP: 30,
  REFERRAL_FRIEND_SIGNUP: 50,
  REFERRAL_FIRST_VIDEO: 70,
  VIDEO_GENERATION_COST: 60,
  UGC_SOCIAL_TASK: 100,
} as const;

/**
 * Check if user can perform daily check-in
 */
export function canPerformDailyCheckIn(lastCheckinDate?: Date): boolean {
  if (!lastCheckinDate) {
    return true;
  }

  const now = new Date();
  const timeDiff = now.getTime() - lastCheckinDate.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  return hoursDiff >= 24;
}

/**
 * Get next check-in time
 */
export function getNextCheckinTime(lastCheckinDate?: Date): Date | null {
  if (!lastCheckinDate) {
    return null;
  }

  return new Date(lastCheckinDate.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Validate credit transaction source
 */
export function isValidCreditSource(source: string): boolean {
  const validSources = [
    'signup',
    'checkin',
    'referral',
    'purchase',
    'video_generation',
    'admin_award'
  ];
  return validSources.includes(source);
}