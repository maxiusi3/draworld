'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName: string, pageTitle?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const analytics = useAnalytics();

  // Track page views on route changes
  useEffect(() => {
    const pageName = pathname.replace('/', '') || 'home';
    analytics.trackPageView(pageName);
  }, [pathname, analytics]);

  // Track user sessions
  useEffect(() => {
    if (user) {
      // Track daily active user
      const lastActiveDate = localStorage.getItem('lastActiveDate');
      const today = new Date().toDateString();
      
      if (lastActiveDate !== today) {
        analytics.trackPageView('daily_active');
        localStorage.setItem('lastActiveDate', today);
      }
    }
  }, [user, analytics]);

  const contextValue: AnalyticsContextType = {
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      // This could be extended to use a different tracking method
      console.log('Track Event:', eventName, properties);
    },
    trackPageView: analytics.trackPageView,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}