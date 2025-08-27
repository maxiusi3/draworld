'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReferralService, ReferralStatsResult } from '@/services/referralService';

interface UseReferralsReturn {
  stats: ReferralStatsResult | null;
  loading: boolean;
  error: string | null;
  loadStats: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useReferrals(): UseReferralsReturn {
  const [stats, setStats] = useState<ReferralStatsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ReferralService.getReferralStats();
      setStats(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
    refresh,
    clearError,
  };
}

