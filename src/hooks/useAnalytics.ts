'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as analytics from '@/lib/analytics';

export function useAnalytics() {
  const { user } = useAuth();

  // Track user identification when user changes
  useEffect(() => {
    if (user) {
      analytics.trackUserIdentify(user.uid, {
        email: user.email || undefined,
        displayName: user.displayName || undefined,
        credits: user.credits,
        createdAt: user.createdAt,
      });
    }
  }, [user]);

  // Track daily active user
  useEffect(() => {
    if (user) {
      analytics.trackDailyActive();
    }
  }, [user]);

  // Creation Flow Tracking
  const trackCreationFlow = useCallback({
    started: () => {
      analytics.trackCreationStarted();
      analytics.trackFunnelStep('video_creation', 'started', 1);
    },
    
    imageUploaded: (fileSize: number, fileType: string) => {
      analytics.trackImageUploaded(fileSize, fileType);
      analytics.trackFunnelStep('video_creation', 'image_uploaded', 2, {
        file_size: fileSize,
        file_type: fileType,
      });
    },
    
    promptEntered: (promptLength: number, mood: string) => {
      analytics.trackPromptEntered(promptLength, mood);
      analytics.trackFunnelStep('video_creation', 'prompt_entered', 3, {
        prompt_length: promptLength,
        mood,
      });
    },
    
    generationStarted: (credits: number) => {
      if (user) {
        analytics.trackVideoGenerationStarted(user.uid, credits);
        analytics.trackFunnelStep('video_creation', 'generation_started', 4, {
          user_credits: credits,
        });
      }
    },
    
    generationCompleted: (videoId: string, generationTime: number, success: boolean) => {
      analytics.trackVideoGenerationCompleted(videoId, generationTime, success);
      analytics.trackFunnelStep('video_creation', success ? 'generation_completed' : 'generation_failed', 5, {
        video_id: videoId,
        generation_time: generationTime,
        success,
      });
    },
  }, [user]);

  // Commerce Tracking
  const trackCommerce = useCallback({
    purchaseStarted: (packageId: string, amount: number, credits: number) => {
      analytics.trackCreditPurchaseStarted(packageId, amount, credits);
      analytics.trackFunnelStep('credit_purchase', 'started', 1, {
        package_id: packageId,
        amount,
        credits,
      });
    },
    
    purchaseCompleted: (transactionId: string, packageId: string, amount: number, credits: number) => {
      analytics.trackCreditPurchaseCompleted(transactionId, packageId, amount, credits);
      analytics.trackFunnelStep('credit_purchase', 'completed', 2, {
        transaction_id: transactionId,
        package_id: packageId,
        amount,
        credits,
      });
    },
  }, []);

  // Engagement Tracking
  const trackEngagement = useCallback({
    videoViewed: (videoId: string, duration: number) => {
      analytics.trackVideoViewed(videoId, duration);
    },
    
    videoShared: (videoId: string, platform: string) => {
      analytics.trackVideoShared(videoId, platform);
    },
    
    videoDownloaded: (videoId: string) => {
      analytics.trackVideoDownloaded(videoId);
    },
    
    galleryViewed: (category?: string) => {
      analytics.trackGalleryViewed(category);
    },
    
    galleryVideoClicked: (videoId: string, position: number) => {
      analytics.trackGalleryVideoClicked(videoId, position);
    },
  }, []);

  // Referral Tracking
  const trackReferral = useCallback({
    linkShared: (platform: string) => {
      analytics.trackReferralLinkShared(platform);
    },
    
    signup: (referrerUserId: string) => {
      analytics.trackReferralSignup(referrerUserId);
    },
  }, []);

  // Social Media Tracking
  const trackSocial = useCallback({
    taskSubmitted: (platform: string, taskType: string) => {
      analytics.trackSocialTaskSubmitted(platform, taskType);
    },
  }, []);

  // Error Tracking
  const trackError = useCallback((errorType: string, errorMessage: string, context?: string) => {
    analytics.trackError(errorType, errorMessage, context);
  }, []);

  // Performance Tracking
  const trackPerformance = useCallback((metricName: string, value: number, unit?: string) => {
    analytics.trackPerformance(metricName, value, unit);
  }, []);

  // Page View Tracking
  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    analytics.trackPageView(pageName, pageTitle);
  }, []);

  return {
    trackCreationFlow,
    trackCommerce,
    trackEngagement,
    trackReferral,
    trackSocial,
    trackError,
    trackPerformance,
    trackPageView,
  };
}

// Hook for page view tracking
export function usePageView(pageName: string, pageTitle?: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, pageTitle);
  }, [trackPageView, pageName, pageTitle]);
}