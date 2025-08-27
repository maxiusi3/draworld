import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimiter';

// Rate limiters for different endpoints
const authRateLimiter = createRateLimiter(RATE_LIMITS.AUTH);
const generalRateLimiter = createRateLimiter(RATE_LIMITS.GENERAL);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    let rateLimiter = generalRateLimiter;
    
    // Use specific rate limiter for auth endpoints
    if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/signup')) {
      rateLimiter = authRateLimiter;
    }
    
    // Get identifier for rate limiting
    const identifier = getRateLimitIdentifier(request);
    
    // Check rate limit
    const result = await rateLimiter.isAllowed(identifier);
    
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: result.resetTime,
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      const headers = rateLimiter.getHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    const headers = rateLimiter.getHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // Security headers for all requests
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://api.runware.ai https://*.googleapis.com https://*.firebaseapp.com; frame-src https://js.stripe.com;"
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};