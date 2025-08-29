import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebase';

// Initialize Firebase Analytics
let analytics: unknown = null;

// Only initialize analytics in browser environment
if (typeof window !== 'undefined' && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
    analytics = null;
  }
}

// Analytics event types
export type AnalyticsEvent = 
  | 'page_view'
  | 'sign_up'
  | 'login'
  | 'video_generation_started'
  | 'video_generation_completed'
  | 'video_generation_failed'
  | 'credit_purchase_started'
  | 'credit_purchase_completed'
  | 'daily_checkin'
  | 'daily_active'
  | 'referral_signup'
  | 'social_share'
  | 'gallery_view'
  | 'video_play'
  | 'video_download'
  | 'image_upload'
  | 'prompt_template_used'
  | 'mood_selected'
  | 'creation_shared'
  | 'insufficient_credits_modal_shown'
  | 'pricing_page_viewed'
  | 'account_created'
  | 'profile_updated'
  | 'password_reset_requested'
  | 'error_occurred'
  | 'social_task_submitted'
  | 'funnel_step'
  | 'prompt_entered'
  | 'video_viewed'
  | 'video_shared'
  | 'gallery_video_clicked'
  | 'referral_link_shared'
  | 'creation_started';

export interface AnalyticsEventData {
  [key: string]: string | number | boolean;
}

/**
 * Track analytics event
 */
export function trackEvent(eventName: AnalyticsEvent, eventData?: AnalyticsEventData): void {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName as string, eventData);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Set user ID for analytics
 */
export function setAnalyticsUserId(userId: string): void {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Analytics user ID error:', error);
  }
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(properties: Record<string, string>): void {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Analytics user properties error:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, additionalData?: AnalyticsEventData): void {
  trackEvent('page_view', {
    page_name: pageName,
    page_location: window.location.href,
    page_title: document.title,
    ...additionalData,
  });
}

/**
 * Track user signup
 */
export function trackSignup(method: 'email' | 'google', referralCode?: string): void {
  trackEvent('sign_up', {
    method,
    has_referral: referralCode ? 'true' : 'false',
  });
}

/**
 * Track user identify
 */
export function trackUserIdentify(userId: string, properties: Record<string, unknown>): void {
  setAnalyticsUserId(userId);
  setAnalyticsUserProperties(properties as Record<string, string>);
}

/**
 * Track daily active user
 */
export function trackDailyActive(): void {
  trackEvent('daily_active');
}

/**
 * Track funnel step
 */
export function trackFunnelStep(funnelName: string, stepName: string, stepNumber: number, additionalData?: AnalyticsEventData): void {
  trackEvent('funnel_step', {
    funnel_name: funnelName,
    step_name: stepName,
    step_number: stepNumber,
    ...additionalData,
  });
}

/**
 * Track prompt entered
 */
export function trackPromptEntered(promptLength: number, mood: string): void {
  trackEvent('prompt_entered', {
    prompt_length: promptLength,
    mood,
  });
}

/**
 * Track video viewed
 */
export function trackVideoViewed(videoId: string, duration: number): void {
  trackEvent('video_viewed', {
    video_id: videoId,
    view_duration: duration,
  });
}

/**
 * Track video shared
 */
export function trackVideoShared(videoId: string, platform: string): void {
  trackEvent('video_shared', {
    video_id: videoId,
    platform,
  });
}

/**
 * Track gallery video clicked
 */
export function trackGalleryVideoClicked(videoId: string, position: number): void {
  trackEvent('gallery_video_clicked', {
    video_id: videoId,
    position,
  });
}

/**
 * Track referral link shared
 */
export function trackReferralLinkShared(platform: string): void {
  trackEvent('referral_link_shared', {
    platform,
  });
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google'): void {
  trackEvent('login', {
    method,
  });
}

/**
 * Track video generation funnel
 */
export function trackVideoGenerationStarted(userId: string, credits: number): void {
  trackEvent('video_generation_started', {
    userId,
    credits,
    timestamp: Date.now(),
  });
}

export function trackVideoGenerationCompleted(
  videoId: string,
  generationTime: number,
  success: boolean
): void {
  trackEvent('video_generation_completed', {
    video_id: videoId,
    generation_duration_seconds: Math.round(generationTime / 1000),
    success,
  });
}

export function trackVideoGenerationFailed(
  error: string,
  mood: string,
  duration: number
): void {
  trackEvent('video_generation_failed', {
    error_type: error,
    mood,
    generation_duration_seconds: Math.round(duration / 1000),
  });
}

/**
 * Track credit system events
 */
export function trackCreditPurchaseStarted(packageId: string, amount: number, credits: number): void {
  trackEvent('credit_purchase_started', {
    package_id: packageId,
    credit_amount: amount,
    credits,
  });
}

export function trackCreditPurchaseCompleted(
  transactionId: string,
  packageId: string,
  amount: number,
  credits: number
): void {
  trackEvent('credit_purchase_completed', {
    transaction_id: transactionId,
    package_id: packageId,
    purchase_amount: amount,
    credits_received: credits,
  });
}

export function trackDailyCheckin(creditsEarned: number): void {
  trackEvent('daily_checkin', {
    credits_earned: creditsEarned,
  });
}

/**
 * Track referral system
 */
export function trackReferralSignup(referralCode: string): void {
  trackEvent('referral_signup', {
    referral_code: referralCode,
  });
}

/**
 * Track social sharing
 */
export function trackSocialShare(platform: string, contentType: 'video' | 'referral'): void {
  trackEvent('social_share', {
    platform,
    content_type: contentType,
  });
}

/**
 * Track creation started
 */
export function trackCreationStarted(): void {
  trackEvent('creation_started');
}

/**
 * Track social task submission
 */
export function trackSocialTaskSubmitted(platform: string, taskType: string): void {
  trackEvent('social_task_submitted', {
    platform,
    task_type: taskType,
  });
}

/**
 * Track gallery interactions
 */
export function trackGalleryView(galleryType: 'public' | 'personal'): void {
  trackEvent('gallery_view', {
    gallery_type: galleryType,
  });
}

export function trackGalleryViewed(galleryType?: string): void {
  trackEvent('gallery_view', {
    gallery_type: galleryType || 'unknown',
  });
}

export function trackVideoPlay(videoId: string, source: 'gallery' | 'personal' | 'result'): void {
  trackEvent('video_play', {
    video_id: videoId,
    source,
  });
}

export function trackVideoDownloaded(videoId: string): void {
  trackEvent('video_download', {
    video_id: videoId,
  });
}

/**
 * Track creation flow events
 */
export function trackImageUploaded(fileSize: number, fileType: string): void {
  trackEvent('image_upload', {
    file_size_kb: Math.round(fileSize / 1024),
    file_type: fileType,
  });
}

export function trackPromptTemplateUsed(templateId: string): void {
  trackEvent('prompt_template_used', {
    template_id: templateId,
  });
}

export function trackMoodSelected(mood: string): void {
  trackEvent('mood_selected', {
    mood,
  });
}

/**
 * Track conversion events
 */
export function trackInsufficientCreditsModalShown(creditsNeeded: number, currentCredits: number): void {
  trackEvent('insufficient_credits_modal_shown', {
    credits_needed: creditsNeeded,
    current_credits: currentCredits,
    credits_deficit: creditsNeeded - currentCredits,
  });
}

export function trackPricingPageViewed(source: 'header' | 'modal' | 'direct'): void {
  trackEvent('pricing_page_viewed', {
    source,
  });
}

/**
 * Track errors
 */
export function trackError(errorType: string, errorMessage: string, context?: string): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Limit message length
    context: context || 'unknown',
  });
}

// Performance Tracking
export const trackPerformance = (
  metricName: string,
  value: number,
  unit: string = 'ms'
) => {
  if (!analytics) return;
  
  logEvent(analytics, 'timing_complete', {
    name: metricName,
    value,
    unit,
  });
};

/**
 * Track user acquisition source
 */
export function trackAcquisitionSource(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const referrer = document.referrer;

  if (utmSource || utmMedium || utmCampaign || referrer) {
    setAnalyticsUserProperties({
      acquisition_source: utmSource || 'unknown',
      acquisition_medium: utmMedium || 'unknown',
      acquisition_campaign: utmCampaign || 'unknown',
      referrer_domain: referrer ? new URL(referrer).hostname : 'direct',
    });
  }
}