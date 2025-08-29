import { trackEvent } from '@/lib/analytics';

/**
 * Service for tracking user funnel progression
 */
export class FunnelTrackingService {
  private static funnelSteps = [
    'homepage_visit',
    'signup_started',
    'signup_completed',
    'first_image_upload',
    'first_prompt_entered',
    'first_generation_started',
    'first_generation_completed',
    'first_video_viewed',
    'first_video_shared',
    'credit_purchase_considered',
    'credit_purchase_completed',
  ] as const;

  private static sessionData: Record<string, Record<string, unknown>> = {};

  /**
   * Track funnel step with timing
   */
  static trackStep(step: typeof this.funnelSteps[number], additionalData?: Record<string, unknown>): void {
    const timestamp = Date.now();
    const sessionId = this.getSessionId();

    // Store step data
    this.sessionData[step] = {
      timestamp,
      ...additionalData,
    };

    // Calculate time since previous step
    const previousStepIndex = this.funnelSteps.indexOf(step) - 1;
    let timeSincePrevious = 0;

    if (previousStepIndex >= 0) {
      const previousStep = this.funnelSteps[previousStepIndex];
      const previousData = this.sessionData[previousStep];
      if (previousData) {
        timeSincePrevious = timestamp - previousData.timestamp;
      }
    }

    trackEvent('page_view', {
      funnel_step: step,
      session_id: sessionId,
      step_index: this.funnelSteps.indexOf(step),
      time_since_previous_step: timeSincePrevious,
      ...additionalData,
    });
  }

  /**
   * Track conversion from visitor to first video generation
   */
  static trackFirstVideoConversion(userId: string, timeToConversion: number): void {
    trackEvent('video_generation_completed', {
      user_id: userId,
      is_first_video: 'true',
      time_to_conversion_minutes: Math.round(timeToConversion / (1000 * 60)),
      conversion_type: 'visitor_to_creator',
    });
  }

  /**
   * Track conversion from free user to paid user
   */
  static trackPaidConversion(userId: string, packageId: string, timeToConversion: number): void {
    trackEvent('credit_purchase_completed', {
      user_id: userId,
      is_first_purchase: 'true',
      package_id: packageId,
      time_to_conversion_days: Math.round(timeToConversion / (1000 * 60 * 60 * 24)),
      conversion_type: 'free_to_paid',
    });
  }

  /**
   * Track referral conversion
   */
  static trackReferralConversion(referrerId: string, referredUserId: string): void {
    trackEvent('referral_signup', {
      referrer_id: referrerId,
      referred_user_id: referredUserId,
      conversion_type: 'referral',
    });
  }

  /**
   * Get or create session ID
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Calculate funnel drop-off rates
   */
  static getFunnelMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // This would typically be calculated from stored analytics data
    // For now, return placeholder structure
    this.funnelSteps.forEach((step, index) => {
      metrics[`${step}_completion_rate`] = 0;
      if (index > 0) {
        metrics[`${this.funnelSteps[index - 1]}_to_${step}_conversion`] = 0;
      }
    });

    return metrics;
  }

  /**
   * Track user retention
   */
  static trackRetention(userId: string, daysSinceSignup: number, isActive: boolean): void {
    const retentionPeriod = this.getRetentionPeriod(daysSinceSignup);
    
    trackEvent('page_view', {
      user_id: userId,
      retention_period: retentionPeriod,
      days_since_signup: daysSinceSignup,
      is_active: isActive ? 'true' : 'false',
      event_type: 'retention_check',
    });
  }

  /**
   * Get retention period label
   */
  private static getRetentionPeriod(days: number): string {
    if (days <= 1) return 'day_1';
    if (days <= 7) return 'day_7';
    if (days <= 30) return 'day_30';
    if (days <= 90) return 'day_90';
    return 'day_90_plus';
  }

  /**
   * Track engagement metrics
   */
  static trackEngagement(userId: string, sessionDuration: number, actionsCount: number): void {
    trackEvent('page_view', {
      user_id: userId,
      session_duration_minutes: Math.round(sessionDuration / (1000 * 60)),
      actions_count: actionsCount,
      engagement_level: this.getEngagementLevel(sessionDuration, actionsCount),
      event_type: 'engagement_summary',
    });
  }

  /**
   * Determine engagement level
   */
  private static getEngagementLevel(duration: number, actions: number): string {
    const durationMinutes = duration / (1000 * 60);
    
    if (durationMinutes < 1 || actions < 2) return 'low';
    if (durationMinutes < 5 || actions < 5) return 'medium';
    return 'high';
  }
}