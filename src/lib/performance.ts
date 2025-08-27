// Performance monitoring utilities
export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

/**
 * Get Core Web Vitals metrics
 */
export function getCoreWebVitals(): Promise<Partial<PerformanceMetrics>> {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {};
    
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }
    
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.largestContentfulPaint = lastEntry.startTime;
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }
      
      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cumulativeLayoutShift = clsValue;
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }
    
    // Page Load Time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      }
      
      // Time to Interactive (approximation)
      setTimeout(() => {
        metrics.timeToInteractive = performance.now();
        resolve(metrics);
      }, 100);
    });
    
    // Fallback if load event already fired
    if (document.readyState === 'complete') {
      setTimeout(() => resolve(metrics), 100);
    }
  });
}

/**
 * Get resource timing information
 */
export function getResourceTimings(): ResourceTiming[] {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map((resource) => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize || 0,
    type: getResourceType(resource.name),
  }));
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
  if (url.includes('/api/')) return 'api';
  if (url.includes('font')) return 'font';
  return 'other';
}

/**
 * Monitor performance and send to analytics
 */
export function startPerformanceMonitoring() {
  // Monitor Core Web Vitals
  getCoreWebVitals().then((metrics) => {
    console.log('Core Web Vitals:', metrics);
    
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          window.gtag('event', 'web_vital', {
            name: key,
            value: Math.round(value),
            event_category: 'performance',
          });
        }
      });
    }
  });
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.warn('Long task detected:', entry.duration, 'ms');
        
        // Send to analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'long_task', {
            duration: Math.round(entry.duration),
            event_category: 'performance',
          });
        }
      });
    });
    
    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks not supported
    }
  }
  
  // Monitor memory usage (Chrome only)
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
    });
  }
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
    });
  } else {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);
    return result;
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  const criticalResources = [
    { href: '/api/user', as: 'fetch' },
    { href: '/_next/static/css/app.css', as: 'style' },
  ];
  
  criticalResources.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load images with intersection observer
 */
export function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Optimize third-party scripts
 */
export function optimizeThirdPartyScripts() {
  // Delay non-critical scripts until user interaction
  const delayedScripts = [
    'https://www.googletagmanager.com/gtag/js',
  ];
  
  let userInteracted = false;
  
  const loadDelayedScripts = () => {
    if (userInteracted) return;
    userInteracted = true;
    
    delayedScripts.forEach((src) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });
  };
  
  // Load on first user interaction
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
    document.addEventListener(event, loadDelayedScripts, { once: true, passive: true });
  });
  
  // Fallback: load after 5 seconds
  setTimeout(loadDelayedScripts, 5000);
}

/**
 * Performance budget checker
 */
export function checkPerformanceBudget() {
  const budget = {
    pageLoadTime: 3000, // 3 seconds
    firstContentfulPaint: 1500, // 1.5 seconds
    largestContentfulPaint: 2500, // 2.5 seconds
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1, // 0.1
  };
  
  getCoreWebVitals().then((metrics) => {
    const violations: string[] = [];
    
    Object.entries(budget).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined && value > threshold) {
        violations.push(`${metric}: ${value} > ${threshold}`);
      }
    });
    
    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
    } else {
      console.log('✅ All performance budgets met!');
    }
  });
}

// Global performance monitoring setup
if (typeof window !== 'undefined') {
  // Start monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPerformanceMonitoring);
  } else {
    startPerformanceMonitoring();
  }
}