import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { CreditTransaction } from '@/types';

// Firebase Functions
const dailyCheckInFn = httpsCallable(functions, 'dailyCheckIn');
const spendCreditsFn = httpsCallable(functions, 'spendCredits');
const awardCreditsFn = httpsCallable(functions, 'awardCredits');
const getCreditHistoryFn = httpsCallable(functions, 'getCreditHistory');

export interface DailyCheckInResult {
  success: boolean;
  creditsEarned: number;
  newBalance: number;
}

export interface SpendCreditsResult {
  success: boolean;
  creditsSpent: number;
  newBalance: number;
}

export interface CreditHistoryResult {
  transactions: CreditTransaction[];
  hasMore: boolean;
  lastDoc: string | null;
}

export class CreditService {
  /**
   * Check if daily check-in is available
   */
  static canPerformDailyCheckIn(lastCheckinDate?: Date): boolean {
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
  static getNextCheckinTime(lastCheckinDate?: Date): Date | null {
    if (!lastCheckinDate) {
      return null;
    }

    return new Date(lastCheckinDate.getTime() + 24 * 60 * 60 * 1000);
  }

  /**
   * Perform daily check-in
   */
  static async dailyCheckIn(): Promise<DailyCheckInResult> {
    try {
      const result = await dailyCheckInFn();
      return result.data as DailyCheckInResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to perform daily check-in');
    }
  }

  /**
   * Spend credits
   */
  static async spendCredits(
    amount: number,
    description: string,
    source: 'video_generation' | 'purchase' | 'admin_award',
    relatedId?: string
  ): Promise<SpendCreditsResult> {
    try {
      const result = await spendCreditsFn({
        amount,
        description,
        source,
        relatedId,
      });
      return result.data as SpendCreditsResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to spend credits');
    }
  }

  /**
   * Award credits (admin only)
   */
  static async awardCredits(
    userId: string,
    amount: number,
    description: string,
    source: 'admin_award' | 'referral' | 'signup' = 'admin_award',
    relatedId?: string
  ): Promise<{ success: boolean; creditsAwarded: number }> {
    try {
      const result = await awardCreditsFn({
        userId,
        amount,
        description,
        source,
        relatedId,
      });
      return result.data as { success: boolean; creditsAwarded: number };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to award credits');
    }
  }

  /**
   * Get credit history
   */
  static async getCreditHistory(
    limit: number = 50,
    startAfter?: string
  ): Promise<CreditHistoryResult> {
    try {
      const result = await getCreditHistoryFn({
        limit,
        startAfter,
      });
      return result.data as CreditHistoryResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get credit history');
    }
  }
}