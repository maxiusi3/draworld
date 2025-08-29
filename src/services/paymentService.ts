import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Payment } from '@/types';

// Firebase Functions
const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
const getPaymentHistoryFn = httpsCallable(functions, 'getPaymentHistory');

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentHistoryResult {
  payments: Payment[];
  hasMore: boolean;
  lastDoc: string | null;
}

export class PaymentService {
  /**
   * Create payment intent for credit purchase
   */
  static async createPaymentIntent(packageId: string): Promise<PaymentIntentResult> {
    try {
      const result = await createPaymentIntentFn({ packageId });
      return result.data as PaymentIntentResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(
    limit: number = 20,
    startAfter?: string
  ): Promise<PaymentHistoryResult> {
    try {
      const result = await getPaymentHistoryFn({
        limit,
        startAfter,
      });
      return result.data as PaymentHistoryResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get payment history';
      throw new Error(errorMessage);
    }
  }
}