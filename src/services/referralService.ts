import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Referral } from '@/types';

// Firebase Functions
const processReferralSignupFn = httpsCallable(functions, 'processReferralSignup');
const getReferralStatsFn = httpsCallable(functions, 'getReferralStats');

export interface ReferralSignupResult {
  success: boolean;
  friendBonus: number;
  referrerBonus: number;
}

export interface ReferralStatsResult {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalEarnings: number;
  referrals: Referral[];
}

export class ReferralService {
  /**
   * Process referral signup
   */
  static async processReferralSignup(referralCode: string): Promise<ReferralSignupResult> {
    try {
      const result = await processReferralSignupFn({ referralCode });
      return result.data as ReferralSignupResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process referral');
    }
  }

  /**
   * Get referral statistics
   */
  static async getReferralStats(): Promise<ReferralStatsResult> {
    try {
      const result = await getReferralStatsFn();
      return result.data as ReferralStatsResult;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get referral stats');
    }
  }

  /**
   * Generate referral URL
   */
  static generateReferralUrl(referralCode: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/signup?ref=${referralCode}`;
  }
}