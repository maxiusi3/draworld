import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://draworld.com';
  
  const robots = `User-agent: *
Allow: /
Allow: /gallery
Allow: /create
Allow: /pricing
Allow: /login
Allow: /signup
Allow: /privacy-policy
Allow: /terms-of-service

Disallow: /api/
Disallow: /account/
Disallow: /admin/
Disallow: /_next/
Disallow: /static/

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block common bot patterns that might cause issues
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}