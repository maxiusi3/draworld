// Error types and interfaces
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

// Error codes and user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',

  // Credit system errors
  'credits/insufficient-balance': 'You don\'t have enough credits for this action.',
  'credits/invalid-amount': 'Invalid credit amount specified.',
  'credits/checkin-not-available': 'Daily check-in is not available yet.',
  'credits/transaction-failed': 'Credit transaction failed. Please try again.',

  // Video generation errors
  'video/generation-failed': 'Video generation failed. Please try again.',
  'video/invalid-image': 'Please upload a valid image file.',
  'video/image-too-large': 'Image file is too large. Please use a smaller image.',
  'video/content-moderation-failed': 'Image contains inappropriate content.',
  'video/processing-timeout': 'Video processing is taking longer than expected.',
  'video/not-found': 'Video not found.',
  'video/access-denied': 'You don\'t have permission to access this video.',

  // Payment errors
  'payment/card-declined': 'Your card was declined. Please try a different payment method.',
  'payment/insufficient-funds': 'Insufficient funds on your card.',
  'payment/expired-card': 'Your card has expired. Please use a different card.',
  'payment/processing-error': 'Payment processing failed. Please try again.',
  'payment/invalid-amount': 'Invalid payment amount.',

  // Network errors
  'network/timeout': 'Request timed out. Please check your connection and try again.',
  'network/offline': 'You appear to be offline. Please check your internet connection.',
  'network/server-error': 'Server error. Please try again later.',
  'network/rate-limited': 'Too many requests. Please wait a moment and try again.',

  // File upload errors
  'upload/file-too-large': 'File is too large. Maximum size is 10MB.',
  'upload/invalid-file-type': 'Invalid file type. Please upload a JPEG or PNG image.',
  'upload/upload-failed': 'File upload failed. Please try again.',

  // Generic errors
  'unknown': 'An unexpected error occurred. Please try again.',
  'validation': 'Please check your input and try again.',
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'conflict': 'This action conflicts with the current state.',
};

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS_LOGIC = 'business_logic',
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Format error for user display
   */
  formatError(error: any): string {
    if (typeof error === 'string') {
      return ERROR_MESSAGES[error] || error;
    }

    if (error?.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    if (error?.message) {
      // Check if message matches any known patterns
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return ERROR_MESSAGES['network/timeout'];
      }
      
      if (message.includes('timeout')) {
        return ERROR_MESSAGES['network/timeout'];
      }
      
      if (message.includes('offline')) {
        return ERROR_MESSAGES['network/offline'];
      }

      return error.message;
    }

    return ERROR_MESSAGES['unknown'];
  }

  /**
   * Categorize error
   */
  categorizeError(error: any): ErrorCategory {
    if (typeof error === 'string' || error?.code) {
      const code = error?.code || error;
      
      if (code.startsWith('auth/')) {
        return ErrorCategory.AUTHENTICATION;
      }
      
      if (code.startsWith('permission/') || code.includes('access-denied')) {
        return ErrorCategory.AUTHORIZATION;
      }
      
      if (code.startsWith('validation/') || code.includes('invalid')) {
        return ErrorCategory.VALIDATION;
      }
      
      if (code.startsWith('network/') || code.includes('timeout') || code.includes('offline')) {
        return ErrorCategory.NETWORK;
      }
    }

    if (error?.status >= 500) {
      return ErrorCategory.SERVER;
    }

    if (error?.status >= 400) {
      return ErrorCategory.CLIENT;
    }

    return ErrorCategory.CLIENT;
  }

  /**
   * Determine error severity
   */
  getErrorSeverity(error: any): ErrorSeverity {
    const category = this.categorizeError(error);
    
    switch (category) {
      case ErrorCategory.SERVER:
        return ErrorSeverity.HIGH;
      case ErrorCategory.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Log error with context
   */
  logError(error: Error, context: ErrorContext = {}) {
    const errorEntry = {
      error,
      context,
      timestamp: new Date(),
    };

    // Add to local log
    this.errorLog.push(errorEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: error.message,
        stack: error.stack,
        context,
      });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error, context);
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(error: Error, context: ErrorContext) {
    try {
      // Example: Send to Sentry, LogRocket, or custom monitoring
      const errorData = {
        message: error.message,
        stack: error.stack,
        severity: this.getErrorSeverity(error),
        category: this.categorizeError(error),
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // In a real implementation, you would send this to your monitoring service
      console.log('Error sent to monitoring:', errorData);
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context: ErrorContext = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.log(`Retrying operation in ${jitteredDelay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        
        await this.sleep(jitteredDelay);
      }
    }

    // Log final failure
    this.logError(lastError!, { ...context, retryAttempts: retryConfig.maxRetries });
    throw lastError!;
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry authentication errors
    if (error?.code?.startsWith('auth/')) {
      return true;
    }

    // Don't retry validation errors
    if (error?.status >= 400 && error?.status < 500) {
      return true;
    }

    // Don't retry permission errors
    if (error?.code?.includes('permission') || error?.code?.includes('access-denied')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export function handleApiError(error: any, context: ErrorContext = {}): string {
  errorHandler.logError(error, context);
  return errorHandler.formatError(error);
}

export function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: ErrorContext
): Promise<T> {
  return errorHandler.withRetry(operation, config, context);
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.logError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      { type: 'unhandled_rejection' }
    );
  });

  // Global error handler for JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.logError(
      new Error(event.message),
      { 
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}