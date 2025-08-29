import { trackEvent } from '@/lib/analytics';

/**
 * Service for tracking user retention and engagement metrics
 */
export class RetentionTrackingService {
  private static readonly RETENTION_MILESTONES = [1, 7, 30, 90] as const;
  
  /**
   * Track user return visit
   */
  static trackUserReturn(userId: string, daysSinceLastVisit: number, daysSinceSignup: number): void {
    trackEvent('page_view', {
      user_id: userId,
      days_since_last_visit: daysSinceLastVisit,
      days_since_signup: daysSinceSignup,
      return_type: this.getReturnType(daysSinceLastVisit),
      user_lifecycle_stage: this.getLifecycleStage(daysSinceSignup),
      event_type: 'user_return',
    });
  }

  /**
   * Track user activity session
   */
  static trackActivitySession(
    userId: string,
    sessionDuration: number,
    actionsPerformed: string[],
    videosCreated: number,
    creditsSpent: number
  ): void {
    trackEvent('page_view', {
      user_id: userId,
      session_duration_minutes: Math.round(sessionDuration / (1000 * 60)),
      actions_count: actionsPerformed.length,
      unique_actions: actionsPerformed.join(','),
      videos_created: videosCreated,
      credits_spent: creditsSpent,
      engagement_score: this.calculateEngagementScore(sessionDuration, actionsPerformed.length, videosCreated),
      event_type: 'activity_session',
    });
  }

  /**
   * Track retention milestone
   */
  static trackRetentionMilestone(userId: string, milestone: number, isActive: boolean): void {
    trackEvent('page_view', {
      user_id: userId,
      retention_milestone: `day_${milestone}`,
      is_retained: isActive ? 'true' : 'false',
      milestone_type: this.getMilestoneType(milestone),
      event_type: 'retention_milestone',
    });
  }

  /**
   * Track user churn risk
   */
  static trackChurnRisk(
    userId: string,
    daysSinceLastActivity: number,
    totalVideosCreated: number,
    totalCreditsSpent: number,
    hasActivePurchases: boolean
  ): void {
    const churnRisk = this.calculateChurnRisk(
      daysSinceLastActivity,
      totalVideosCreated,
      totalCreditsSpent,
      hasActivePurchases
    );

    trackEvent('page_view', {
      user_id: userId,
      days_since_last_activity: daysSinceLastActivity,
      total_videos_created: totalVideosCreated,
      total_credits_spent: totalCreditsSpent,
      has_active_purchases: hasActivePurchases ? 'true' : 'false',
      churn_risk_level: churnRisk,
      event_type: 'churn_risk_assessment',
    });
  }

  /**
   * Track feature adoption
   */
  static trackFeatureAdoption(userId: string, feature: string, isFirstTime: boolean): void {
    trackEvent('page_view', {
      user_id: userId,
      feature_name: feature,
      is_first_time: isFirstTime ? 'true' : 'false',
      adoption_type: isFirstTime ? 'feature_discovery' : 'feature_reuse',
      event_type: 'feature_adoption',
    });
  }

  /**
   * Track user lifecycle progression
   */
  static trackLifecycleProgression(
    userId: string,
    fromStage: string,
    toStage: string,
    daysSinceSignup: number
  ): void {
    trackEvent('page_view', {
      user_id: userId,
      from_stage: fromStage,
      to_stage: toStage,
      days_since_signup: daysSinceSignup,
      progression_speed: this.getProgressionSpeed(daysSinceSignup, toStage),
      event_type: 'lifecycle_progression',
    });
  }

  /**
   * Calculate engagement score
   */
  private static calculateEngagementScore(
    sessionDuration: number,
    actionsCount: number,
    videosCreated: number
  ): number {
    const durationScore = Math.min(sessionDuration / (1000 * 60 * 10), 1) * 30; // Max 30 points for 10+ minutes
    const actionsScore = Math.min(actionsCount / 10, 1) * 40; // Max 40 points for 10+ actions
    const creationScore = videosCreated * 30; // 30 points per video created

    return Math.round(durationScore + actionsScore + creationScore);
  }

  /**
   * Calculate churn risk level
   */
  private static calculateChurnRisk(
    daysSinceLastActivity: number,
    totalVideosCreated: number,
    totalCreditsSpent: number,
    hasActivePurchases: boolean
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Days since last activity (higher = more risk)
    if (daysSinceLastActivity > 30) riskScore += 3;
    else if (daysSinceLastActivity > 14) riskScore += 2;
    else if (daysSinceLastActivity > 7) riskScore += 1;

    // Total engagement (lower = more risk)
    if (totalVideosCreated === 0) riskScore += 2;
    else if (totalVideosCreated < 3) riskScore += 1;

    if (totalCreditsSpent === 0) riskScore += 2;
    else if (totalCreditsSpent < 100) riskScore += 1;

    // Active purchases (lower risk)
    if (hasActivePurchases) riskScore -= 2;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Get return type based on days since last visit
   */
  private static getReturnType(daysSinceLastVisit: number): string {
    if (daysSinceLastVisit <= 1) return 'daily_active';
    if (daysSinceLastVisit <= 7) return 'weekly_active';
    if (daysSinceLastVisit <= 30) return 'monthly_active';
    return 'returning_user';
  }

  /**
   * Get user lifecycle stage
   */
  private static getLifecycleStage(daysSinceSignup: number): string {
    if (daysSinceSignup <= 1) return 'new_user';
    if (daysSinceSignup <= 7) return 'onboarding';
    if (daysSinceSignup <= 30) return 'early_user';
    if (daysSinceSignup <= 90) return 'established_user';
    return 'veteran_user';
  }

  /**
   * Get milestone type
   */
  private static getMilestoneType(milestone: number): string {
    switch (milestone) {
      case 1: return 'day_one_retention';
      case 7: return 'week_one_retention';
      case 30: return 'month_one_retention';
      case 90: return 'quarter_one_retention';
      default: return 'custom_retention';
    }
  }

  /**
   * Get progression speed
   */
  private static getProgressionSpeed(daysSinceSignup: number, stage: string): string {
    const expectedDays = this.getExpectedDaysForStage(stage);
    
    if (daysSinceSignup < expectedDays * 0.5) return 'fast';
    if (daysSinceSignup < expectedDays * 1.5) return 'normal';
    return 'slow';
  }

  /**
   * Get expected days for lifecycle stage
   */
  private static getExpectedDaysForStage(stage: string): number {
    switch (stage) {
      case 'onboarding': return 7;
      case 'early_user': return 30;
      case 'established_user': return 90;
      case 'veteran_user': return 365;
      default: return 30;
    }
  }

  /**
   * Get cohort analysis data structure
   */
  static getCohortAnalysisStructure(): Record<string, unknown> {
    return {
      cohort_month: '',
      users_count: 0,
      day_1_retention: 0,
      day_7_retention: 0,
      day_30_retention: 0,
      day_90_retention: 0,
      avg_videos_created: 0,
      avg_credits_spent: 0,
      conversion_rate: 0,
    };
  }
}