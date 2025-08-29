import { lazy, ComponentType } from 'react';

// Dynamic import with error handling and retry logic
export function dynamicImport<T = unknown>(
  importFn: () => Promise<{ default: T }>,
  options: {
    retries?: number;
    retryDelay?: number;
    fallback?: ComponentType;
  } = {}
): Promise<{ default: T }> {
  const { retries = 3, retryDelay = 1000 } = options;
  
  let attempt = 0;
  
  const tryImport = async (): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      attempt++;
      
      if (attempt <= retries) {
        console.warn(`Import failed, retrying (${attempt}/${retries})...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return tryImport();
      }
      
      throw error;
    }
  };
  
  return tryImport();
}

// Lazy load components with error boundaries
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  return lazy(() => dynamicImport(importFn, { fallback }));
}

// Preload components for better UX
export function preloadComponent(importFn: () => Promise<unknown>) {
  if (typeof window !== 'undefined') {
    // Preload on idle or after a delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn());
    } else {
      setTimeout(() => importFn(), 2000);
    }
  }
}

// Route-based code splitting
export const routes = {
  // Auth routes
  LoginPage: lazyLoad(() => import('@/app/login/page')),
  SignupPage: lazyLoad(() => import('@/app/signup/page')),
  ForgotPasswordPage: lazyLoad(() => import('@/app/forgot-password/page')),
  ResetPasswordPage: lazyLoad(() => import('@/app/reset-password/page')),
  
  // Main app routes
  CreatePage: lazyLoad(() => import('@/app/create/page')),
  GalleryPage: lazyLoad(() => import('@/app/gallery/page')),
  PricingPage: lazyLoad(() => import('@/app/pricing/page')),
  
  // Account routes
  ProfilePage: lazyLoad(() => import('@/app/account/profile/page')),
  CreationsPage: lazyLoad(() => import('@/app/account/creations/page')),
  BillingPage: lazyLoad(() => import('@/app/account/billing/page')),
  ReferralsPage: lazyLoad(() => import('@/app/account/referrals/page')),
  PrivacyPage: lazyLoad(() => import('@/app/account/privacy/page')),
  
  // Admin routes
  AdminPage: lazyLoad(() => import('@/app/admin/page')),
  AdminUsersPage: lazyLoad(() => import('@/app/admin/users/page')),
  AdminAnalyticsPage: lazyLoad(() => import('@/app/admin/analytics/page')),
  AdminModerationPage: lazyLoad(() => import('@/app/admin/moderation/page')),
  AdminSocialTasksPage: lazyLoad(() => import('@/app/admin/social-tasks/page')),
  
  // Legal routes
  TermsPage: lazyLoad(() => import('@/app/terms-of-service/page')),
  PrivacyPolicyPage: lazyLoad(() => import('@/app/privacy-policy/page')),
};

// Component-based code splitting
export const components = {
  // Heavy components
  ImageCropper: lazyLoad(() => import('@/components/ui/ImageCropper')),
  VideoPlayer: lazyLoad(() => import('@/components/ui/VideoPlayer')),
  PaymentModal: lazyLoad(() => import('@/components/ui/PaymentModal')),
  SocialShareModal: lazyLoad(() => import('@/components/ui/SocialShareModal')),
  
  // Admin components
  AdminLayout: lazyLoad(() => import('@/components/layout/AdminLayout')),
  
  // Chart components (if using charts)
  AnalyticsChart: lazyLoad(() => 
    dynamicImport(() => import('@/components/analytics/AnalyticsChart'))
  ),
};

// Feature-based code splitting
export const features = {
  // Payment processing
  stripeElements: () => dynamicImport(() => import('@stripe/react-stripe-js')),
  
  // Image processing
  cropper: () => dynamicImport(() => import('react-cropper')),
  
  // Analytics
  analytics: () => dynamicImport(() => import('@/lib/analytics')),
  
  // Social sharing
  socialShare: () => dynamicImport(() => import('@/lib/socialShare')),
};

// Utility to check if a module is already loaded
export function isModuleLoaded(moduleName: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if module is in webpack's module cache
  return !!(window as Record<string, unknown>).__webpack_require__?.cache?.[moduleName];
}

// Bundle size analyzer helper
export function logBundleSize(componentName: string, startTime: number) {
  if (process.env.NODE_ENV === 'development') {
    const loadTime = performance.now() - startTime;
    console.log(`📦 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
  }
}

// Preload critical routes based on user behavior
export function preloadCriticalRoutes() {
  if (typeof window === 'undefined') return;
  
  // Preload create page for authenticated users
  const isAuthenticated = document.cookie.includes('auth-token');
  if (isAuthenticated) {
    preloadComponent(() => import('@/app/create/page'));
    preloadComponent(() => import('@/components/ui/ImageUploader'));
  }
  
  // Preload gallery on homepage
  if (window.location.pathname === '/') {
    preloadComponent(() => import('@/app/gallery/page'));
  }
  
  // Preload payment components on pricing page
  if (window.location.pathname === '/pricing') {
    preloadComponent(() => import('@/components/ui/PaymentModal'));
    preloadComponent(() => import('@stripe/react-stripe-js'));
  }
}

// Smart preloading based on user interactions
export function setupSmartPreloading() {
  if (typeof window === 'undefined') return;
  
  // Preload on hover
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.hostname === window.location.hostname) {
      const path = link.pathname;
      
      // Preload based on route
      switch (path) {
        case '/create':
          preloadComponent(() => import('@/app/create/page'));
          break;
        case '/gallery':
          preloadComponent(() => import('@/app/gallery/page'));
          break;
        case '/pricing':
          preloadComponent(() => import('@/app/pricing/page'));
          break;
      }
    }
  }, { passive: true });
  
  // Preload on focus (keyboard navigation)
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      const link = target as HTMLAnchorElement;
      if (link.hostname === window.location.hostname) {
        // Similar preloading logic as hover
      }
    }
  }, { passive: true });
}

// Initialize smart preloading
if (typeof window !== 'undefined') {
  // Setup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalRoutes();
      setupSmartPreloading();
    });
  } else {
    preloadCriticalRoutes();
    setupSmartPreloading();
  }
}