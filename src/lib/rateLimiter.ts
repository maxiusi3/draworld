import { NextRequest } from 'next/server';

// Rate limiter configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Video generation - 5 requests per hour per user
  VIDEO_GENERATION: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  // Image upload - 20 requests per hour per user
  IMAGE_UPLOAD: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  // Authentication - 10 attempts per 15 minutes per IP
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  // Payment - 5 attempts per hour per user
  PAYMENT: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  // General API - 100 requests per hour per user
  GENERAL: { windowMs: 60 * 60 * 1000, maxRequests: 100 },
} as const;

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  async isAllowed(identifier: string): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    const now = Date.now();
    const key = `${identifier}`;
    
    // Get current rate limit data
    const current = rateLimitStore.get(key);
    
    // If no data or window has expired, reset
    if (!current || now > current.resetTime) {
      const resetTime = now + this.config.windowMs;
      rateLimitStore.set(key, { count: 1, resetTime });
      
      return {
        allowed: true,
        resetTime,
        remaining: this.config.maxRequests - 1,
      };
    }
    
    // Check if limit exceeded
    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        resetTime: current.resetTime,
        remaining: 0,
      };
    }
    
    // Increment count
    current.count++;
    rateLimitStore.set(key, current);
    
    return {
      allowed: true,
      resetTime: current.resetTime,
      remaining: this.config.maxRequests - current.count,
    };
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(result: { resetTime?: number; remaining?: number }) {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Window': this.config.windowMs.toString(),
    };

    if (result.remaining !== undefined) {
      headers['X-RateLimit-Remaining'] = result.remaining.toString();
    }

    if (result.resetTime) {
      headers['X-RateLimit-Reset'] = Math.ceil(result.resetTime / 1000).toString();
    }

    return headers;
  }
}

/**
 * Create rate limiter for specific endpoint
 */
export function createRateLimiter(config: RateLimitConfig) {
  return new RateLimiter(config);
}

/**
 * Get identifier for rate limiting (user ID or IP)
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  // Use user ID if authenticated, otherwise use IP
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}