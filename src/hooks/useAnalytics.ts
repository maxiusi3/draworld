'use client';

import { useRouter } from 'next/router';
import { useEffect, useCallback } from 'react';
import { trackEvent, trackUserIdentify, trackDailyActive, trackPageView as trackPageViewAnalytics } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

// Custom hook for analytics
export const useAnalytics = () => {
  const { user } = useAuth();

  // Track user identify
  useEffect(() => {
    if (user) {
      trackUserIdentify(user.id, {
        email: user.email,
        displayName: user.displayName,
      });
    }
  }, [user]);

  // Track daily active user
  useEffect(() => {
    if (user) {
      trackDailyActive();
    }
  }, [user]);

  // Memoize tracking functions to prevent re-renders
  const trackCreationFlow = useCallback(
    (event: 'creation_started' | 'image_upload' | 'prompt_entered' | 'mood_selected' | 'video_generation_started', data?: object) => {
      if (user) {
        trackEvent(event, { ...data, userId: user.id });
      }
    },
    [user]
  );

  const trackCommerce = useCallback(
    (event: 'pricing_page_viewed' | 'credit_purchase_started' | 'credit_purchase_completed', data?: object) => {
      if (user) {
        trackEvent(event, { ...data, userId: user.id });
      }
    },
    [user]
  );

  const trackEngagement = useCallback(
    (event: 'video_shared' | 'video_download', data?: object) => {
      if (user) {
        trackEvent(event, { ...data, userId: user.id });
      }
    },
    [user]
  );

  const trackReferral = useCallback(
    (event: 'referral_link_shared' | 'referral_signup', data?: object) => {
      if (user) {
        trackEvent(event, { ...data, referrerId: user.id });
      }
    },
    [user]
  );

  const trackSocial = useCallback(
    (event: 'social_share', data?: object) => {
      if (user) {
        trackEvent(event, { ...data, userId: user.id });
      }
    },
    [user]
  );

  const trackError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      trackEvent('error_occurred', {
        errorMessage: error.message,
        errorStack: error.stack || 'N/A',
        ...context,
      });
    },
    []
  );

  const trackPerformance = useCallback(
    (metricName: string, value: number, category?: string) => {
      trackEvent('timing_complete' as any, {
        metricName,
        value,
        ...(category && { category }),
      });
    },
    []
  );

  return {
    trackCreationFlow,
    trackCommerce,
    trackEngagement,
    trackReferral,
    trackSocial,
    trackError,
    trackPerformance,
  };
};

// Custom hook for page views
export const usePageView = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackPageViewAnalytics(url, { userId: user?.id || 'guest' });
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    // Initial page view
    trackPageViewAnalytics(router.asPath, { userId: user?.id || 'guest' });

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, user]);
};