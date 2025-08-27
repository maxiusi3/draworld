import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { app } from './firebase';

// Initialize Firebase Analytics
let analytics: any = null;

// Only initialize analytics in browser environment
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
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
  | 'error_occurred';

export interface AnalyticsEventData {
  [key: string]: string | number | boolean;
}

/**
 * Track analytics event
 */
export function trackEvent(eventName: AnalyticsEvent, eventData?: AnalyticsEventData): void {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, eventData);
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
export function trackVideoGenerationStarted(prompt: string, mood: string): void {
  trackEvent('video_generation_started', {
    prompt_length: prompt.length,
    mood,
    timestamp: Date.now(),
  });
}

export function trackVideoGenerationCompleted(
  generationId: string,
  duration: number,
  mood: string
): void {
  trackEvent('video_generation_completed', {
    generation_id: generationId,
    generation_duration_seconds: Math.round(duration / 1000),
    mood,
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
export function trackCreditPurchaseStarted(packageId: string, amount: number): void {
  trackEvent('credit_purchase_started', {
    package_id: packageId,
    credit_amount: amount,
  });
}

export function trackCreditPurchaseCompleted(
  packageId: string,
  amount: number,
  credits: number
): void {
  trackEvent('credit_purchase_completed', {
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
 * Track gallery interactions
 */
export function trackGalleryView(galleryType: 'public' | 'personal'): void {
  trackEvent('gallery_view', {
    gallery_type: galleryType,
  });
}

export function trackVideoPlay(videoId: string, source: 'gallery' | 'personal' | 'result'): void {
  trackEvent('video_play', {
    video_id: videoId,
    source,
  });
}

export function trackVideoDownload(videoId: string): void {
  trackEvent('video_download', {
    video_id: videoId,
  });
}

/**
 * Track creation flow events
 */
export function trackImageUpload(fileSize: number, fileType: string): void {
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

/**
 *
  logEvent(analytics, 'weekly_active_user', {
    timestamp: new Date().toISOString(),
  });
};

// Error Tracking
export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'exception', {
    description: errorMessage,
    fatal: false,
    error_type: errorType,
    context,
  });
};

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
}; Track user acquisition source
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