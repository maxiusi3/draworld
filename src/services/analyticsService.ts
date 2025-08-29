import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface AnalyticsEvent {
  id?: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  properties: Record<string, unknown>;
  timestamp: Timestamp;
  userAgent?: string;
  referrer?: string;
  page?: string;
}

export interface FunnelStep {
  step: string;
  users: number;
  conversionRate?: number;
}

export interface ConversionMetrics {
  totalVisitors: number;
  signups: number;
  firstVideoCreations: number;
  purchases: number;
  signupRate: number;
  videoCreationRate: number;
  purchaseRate: number;
}

export interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
}

export class AnalyticsService {
  private static sessionId = this.generateSessionId();

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track user behavior events
   */
  static async trackEvent(
    eventName: string, 
    properties: Record<string, unknown> = {},
    userId?: string
  ) {
    try {
      const event: AnalyticsEvent = {
        eventName,
        userId,
        sessionId: this.sessionId,
        properties,
        timestamp: Timestamp.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      };

      // Store in Firestore for custom analytics
      await addDoc(collection(db, 'analyticsEvents'), event);

      // Also log for development
      console.log('Analytics Event:', eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Legacy track method for backward compatibility
   */
  static async track(event: string, properties: Record<string, unknown> = {}, userId?: string): Promise<void> {
    await this.trackEvent(event, properties, userId);
  }

  /**
   * Track video sharing events
   */
  static async trackVideoShare(videoId: string, platform: string, method: 'direct' | 'modal' = 'modal'): Promise<void> {
    await this.track('video_shared', {
      videoId,
      platform,
      method,
      category: 'engagement',
    });
  }

  /**
   * Track social task submissions
   */
  static async trackSocialTaskSubmission(platform: string, hasUrl: boolean): Promise<void> {
    await this.track('social_task_submitted', {
      platform,
      hasUrl,
      category: 'ugc',
    });
  }

  /**
   * Track gallery interactions
   */
  static async trackGalleryView(category?: string, sortBy?: string): Promise<void> {
    await this.track('gallery_viewed', {
      category: category || 'all',
      sortBy: sortBy || 'trending',
      category_type: 'navigation',
    });
  }

  /**
   * Track video plays
   */
  static async trackVideoPlay(videoId: string, source: 'gallery' | 'homepage' | 'profile' | 'share_page'): Promise<void> {
    await this.track('video_played', {
      videoId,
      source,
      category: 'engagement',
    });
  }

  /**
   * Get funnel analysis for video creation flow
   */
  static async getCreationFunnelAnalysis(timeRange: number = 30): Promise<FunnelStep[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const steps = [
        'creation_started',
        'image_uploaded', 
        'prompt_entered',
        'generation_started',
        'generation_completed'
      ];

      const funnelData: FunnelStep[] = [];
      let previousUsers = 0;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        const eventsQuery = query(
          collection(db, 'analyticsEvents'),
          where('eventName', '==', 'funnel_step'),
          where('properties.step_name', '==', step),
          where('timestamp', '>=', Timestamp.fromDate(startDate))
        );

        const snapshot = await getDocs(eventsQuery);
        const uniqueUsers = new Set(snapshot.docs.map(doc => doc.data().userId)).size;

        const conversionRate = i === 0 ? 100 : previousUsers > 0 ? (uniqueUsers / previousUsers) * 100 : 0;

        funnelData.push({
          step,
          users: uniqueUsers,
          conversionRate: Math.round(conversionRate * 100) / 100,
        });

        previousUsers = uniqueUsers;
      }

      return funnelData;
    } catch (error) {
      console.error('Failed to get funnel analysis:', error);
      return [];
    }
  }

  /**
   * Get conversion metrics
   */
  static async getConversionMetrics(timeRange: number = 30): Promise<ConversionMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      // Get page views (visitors)
      const pageViewsQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'page_view'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const pageViewsSnapshot = await getDocs(pageViewsQuery);
      const totalVisitors = new Set(pageViewsSnapshot.docs.map(doc => doc.data().sessionId)).size;

      // Get signups
      const signupsQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'sign_up'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const signupsSnapshot = await getDocs(signupsQuery);
      const signups = signupsSnapshot.size;

      // Get first video creations
      const videoCreationsQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'video_generation_success'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const videoCreationsSnapshot = await getDocs(videoCreationsQuery);
      const firstVideoCreations = new Set(videoCreationsSnapshot.docs.map(doc => doc.data().userId)).size;

      // Get purchases
      const purchasesQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'purchase'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const purchases = new Set(purchasesSnapshot.docs.map(doc => doc.data().userId)).size;

      return {
        totalVisitors,
        signups,
        firstVideoCreations,
        purchases,
        signupRate: totalVisitors > 0 ? (signups / totalVisitors) * 100 : 0,
        videoCreationRate: signups > 0 ? (firstVideoCreations / signups) * 100 : 0,
        purchaseRate: signups > 0 ? (purchases / signups) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get conversion metrics:', error);
      return {
        totalVisitors: 0,
        signups: 0,
        firstVideoCreations: 0,
        purchases: 0,
        signupRate: 0,
        videoCreationRate: 0,
        purchaseRate: 0,
      };
    }
  }

  /**
   * Calculate K-factor for referrals
   */
  static async calculateKFactor(timeRange: number = 30): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      // Get total users who shared referral links
      const referralSharesQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'share'),
        where('properties.content_type', '==', 'referral_link'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const sharesSnapshot = await getDocs(referralSharesQuery);
      const usersWhoShared = new Set(sharesSnapshot.docs.map(doc => doc.data().userId)).size;

      // Get referral signups
      const referralSignupsQuery = query(
        collection(db, 'analyticsEvents'),
        where('eventName', '==', 'referral_signup'),
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
      const referralSignupsSnapshot = await getDocs(referralSignupsQuery);
      const referralSignups = referralSignupsSnapshot.size;

      // K-factor = (referral signups / users who shared)
      return usersWhoShared > 0 ? referralSignups / usersWhoShared : 0;
    } catch (error) {
      console.error('Failed to calculate K-factor:', error);
      return 0;
    }
  }
}