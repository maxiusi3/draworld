'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditService } from '@/services/creditService';
import { CREDITS } from '@/lib/constants';
import { trackDailyCheckin, trackInsufficientCreditsModalShown } from '@/lib/analytics';
import { toSafeDate } from '@/lib/utils';

export function useCredits() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSufficientCredits = useCallback((requiredCredits: number): boolean => {
    const hasSufficient = user ? user.credits >= requiredCredits : false;
    
    // Track insufficient credits
    if (!hasSufficient && user) {
      trackInsufficientCreditsModalShown(requiredCredits, user.credits);
    }
    
    return hasSufficient;
  }, [user]);

  const canCreateVideo = useCallback((): boolean => {
    return checkSufficientCredits(CREDITS.VIDEO_CREATION_COST);
  }, [checkSufficientCredits]);

  const performDailyCheckIn = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await CreditService.dailyCheckIn();
      await refreshUser(); // Refresh user data to get updated credits
      
      // Track daily check-in
      if (result) {
        trackDailyCheckin(result.creditsEarned);
      }
      
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to perform daily check-in';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshUser]);

  const spendCredits = useCallback(async (
    amount: number,
    description: string,
    source: 'video_generation' | 'purchase' | 'admin_award',
    relatedId?: string
  ) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    if (!checkSufficientCredits(amount)) {
      setError('Insufficient credits');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await CreditService.spendCredits(amount, description, source, relatedId);
      await refreshUser(); // Refresh user data to get updated credits
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to spend credits';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, checkSufficientCredits, refreshUser]);

  const canPerformDailyCheckIn = useCallback((): boolean => {
    if (!user?.lastCheckinDate) return true;
    return CreditService.canPerformDailyCheckIn(toSafeDate(user.lastCheckinDate));
  }, [user]);

  const getNextCheckInTime = useCallback((): Date | null => {
    if (!user?.lastCheckinDate) return null;
    return CreditService.getNextCheckinTime(toSafeDate(user.lastCheckinDate));
  }, [user]);

  const getTimeUntilNextCheckIn = useCallback((): string => {
    const nextCheckIn = getNextCheckInTime();
    if (!nextCheckIn) return '';

    const now = new Date();
    const timeDiff = nextCheckIn.getTime() - now.getTime();

    if (timeDiff <= 0) return '';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, [getNextCheckInTime]);

  const getVideosCanCreate = useCallback((): number => {
    if (!user) return 0;
    return Math.floor(user.credits / CREDITS.VIDEO_CREATION_COST);
  }, [user]);

  const getEstimatedValue = useCallback((): string => {
    if (!user) return '$0.00';
    // Assuming 1 credit = $0.01 (based on $1.99 for 100 credits)
    const value = user.credits * 0.01;
    return `$${value.toFixed(2)}`;
  }, [user]);

  return {
    // State
    credits: user?.credits || 0,
    isLoading,
    error,

    // Actions
    performDailyCheckIn,
    spendCredits,
    checkSufficientCredits,

    // Computed values
    canCreateVideo,
    canPerformDailyCheckIn,
    getNextCheckInTime,
    getTimeUntilNextCheckIn,
    getVideosCanCreate,
    getEstimatedValue,

    // Utils
    clearError: () => setError(null),
  };
}