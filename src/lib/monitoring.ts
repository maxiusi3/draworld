// Monitoring and logging utilities
export interface MonitoringConfig {
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  userId?: string;
  sessionId?: string;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  sampleRate: number;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private config: MonitoringConfig;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      environment: process.env.NODE_ENV as any || 'development',
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      sampleRate: 1.0,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private initializeMonitoring() {
    // Initialize performance monitoring
    this.initializePerformanceMonitoring();

    // Initialize error monitoring
    this.initializeErrorMonitoring();

    // Initialize user interaction tracking
    this.initializeUserInteractionTracking();
  }

  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor navigation timing
    this.monitorNavigationTiming();
  }

  private monitorWebVitals() {
    // Monitor Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.recordMetric({
        name: 'lcp',
        value: entry.startTime,
        unit: 'ms',
        timestamp: new Date(),
      });
    });

    // Monitor First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entry) => {
      this.recordMetric({
        name: 'fid',
        value: entry.processingStart - entry.startTime,
        unit: 'ms',
        timestamp: new Date(),
      });
    });

    // Monitor Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.recordMetric({
          name: 'cls',
          value: entry.value,
          unit: 'count',
          timestamp: new Date(),
        });
      }
    });
  }

  private observePerformanceEntry(type: string, callback: (entry: any) => void) {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      this.log('warn', 'Failed to observe performance entry', { type, error });
    }
  }

  private monitorResourceLoading() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach((resource: any) => {
        this.recordMetric({
          name: 'resource_load_time',
          value: resource.duration,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {
            name: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize,
          },
        });
      });
    });
  }

  private monitorNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      
      if (navigation) {
        this.recordMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          timestamp: new Date(),
        });

        this.recordMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms',
          timestamp: new Date(),
        });
      }
    });
  }

  private initializeErrorMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      this.log('error', 'JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  private initializeUserInteractionTracking() {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.log('info', 'Page Visibility Changed', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });
    });

    // Track online/offline status
    window.addEventListener('online', () => {
      this.log('info', 'Connection Status Changed', { online: true });
    });

    window.addEventListener('offline', () => {
      this.log('warn', 'Connection Status Changed', { online: false });
    });
  }

  /**
   * Log a message with context
   */
  log(level: LogEntry['level'], message: string, data?: any, component?: string, action?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      userId: this.config.userId,
      sessionId: this.sessionId,
      component,
      action,
    };

    // Add to local log
    this.logs.push(entry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // Remote logging
    if (this.config.enableRemoteLogging && Math.random() < this.config.sampleRate) {
      this.sendLogToRemote(entry);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only last 500 metrics
    if (this.metrics.length > 500) {
      this.metrics.shift();
    }

    // Send to remote monitoring
    if (this.config.enableRemoteLogging) {
      this.sendMetricToRemote(metric);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, component?: string, data?: any) {
    this.log('info', `User Action: ${action}`, data, component, action);
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    this.log('info', 'Page View', {
      path,
      title: title || document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Track API call
   */
  trackApiCall(method: string, url: string, duration: number, status: number, error?: any) {
    this.log(error ? 'error' : 'info', 'API Call', {
      method,
      url,
      duration,
      status,
      error: error?.message,
    });

    this.recordMetric({
      name: 'api_call_duration',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      metadata: { method, url, status },
    });
  }

  /**
   * Send log entry to remote service
   */
  private async sendLogToRemote(entry: LogEntry) {
    try {
      // In a real implementation, send to your logging service
      // Example: Logtail, DataDog, CloudWatch, etc.
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Would send log to remote:', entry);
        return;
      }

      // Example implementation
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to remote:', error);
    }
  }

  /**
   * Send metric to remote service
   */
  private async sendMetricToRemote(metric: PerformanceMetric) {
    try {
      // In a real implementation, send to your metrics service
      // Example: DataDog, New Relic, CloudWatch, etc.
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Would send metric to remote:', metric);
        return;
      }

      // Example implementation
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send metric to remote:', error);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 50): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set user context
   */
  setUser(userId: string) {
    this.config.userId = userId;
  }

  /**
   * Clear user context
   */
  clearUser() {
    this.config.userId = undefined;
  }

  /**
   * Get session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.config.userId,
      environment: this.config.environment,
      startTime: new Date(),
    };
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Convenience functions
export function logDebug(message: string, data?: any, component?: string) {
  monitoring.log('debug', message, data, component);
}

export function logInfo(message: string, data?: any, component?: string) {
  monitoring.log('info', message, data, component);
}

export function logWarn(message: string, data?: any, component?: string) {
  monitoring.log('warn', message, data, component);
}

export function logError(message: string, data?: any, component?: string) {
  monitoring.log('error', message, data, component);
}

export function trackAction(action: string, component?: string, data?: any) {
  monitoring.trackAction(action, component, data);
}

export function trackPageView(path: string, title?: string) {
  monitoring.trackPageView(path, title);
}

export function recordMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms', metadata?: Record<string, any>) {
  monitoring.recordMetric({
    name,
    value,
    unit,
    timestamp: new Date(),
    metadata,
  });
}