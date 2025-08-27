# Production Configuration Guide

## Environment Variables

### Required Environment Variables

Create these environment variables in your Vercel dashboard:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Runware AI API
NEXT_PUBLIC_RUNWARE_API_URL=https://api.runware.ai/v1
RUNWARE_API_KEY=your_runware_api_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min
NEXTAUTH_URL=https://your-domain.com

# Monitoring and Cron Jobs
CRON_SECRET=your_cron_secret_for_vercel_crons
METRICS_API_KEY=your_metrics_api_key_for_monitoring
```

## Firebase Production Setup

### 1. Create Production Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project or use existing
firebase projects:create your-production-project-id

# Initialize Firebase in your project
firebase init
```

### 2. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public gallery items are readable by all
    match /videoCreations/{videoId} {
      allow read: if resource.data.isPublic == true;
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Admin-only collections
    match /adminSettings/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload images to their own folder
    match /users/{userId}/images/{imageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public videos are readable by all
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Thumbnails are publicly readable
    match /thumbnails/{thumbnailId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Deploy Firebase Functions
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy to production
firebase deploy --only functions --project your-production-project-id
```

## Stripe Production Setup

### 1. Activate Live Mode
1. Complete Stripe account verification
2. Switch to Live mode in Stripe Dashboard
3. Update API keys in environment variables

### 2. Configure Webhooks
Create webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

### 3. Test Payment Flow
```bash
# Use Stripe CLI to test webhooks locally first
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test with live payment methods in production
```

## Runware AI Production Setup

### 1. Upgrade API Plan
- Contact Runware to upgrade to production plan
- Get production API keys
- Configure rate limits and quotas

### 2. Test API Integration
```bash
# Test API connectivity
curl -X POST https://api.runware.ai/v1/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Domain and SSL Setup

### 1. Configure Custom Domain
1. Purchase domain from registrar
2. Add domain to Vercel project
3. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### 2. SSL Certificate
- Vercel automatically provisions SSL certificates
- Verify HTTPS redirect is working
- Test SSL configuration with SSL Labs

## Monitoring Setup

### 1. Uptime Monitoring
```bash
# Example with UptimeRobot API
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_API_KEY&format=json&type=1&url=https://your-domain.com&friendly_name=Draworld"
```

### 2. Error Tracking (Sentry)
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

### 3. Performance Monitoring
```javascript
// Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your existing config
}, {
  silent: true,
  org: "your-org",
  project: "draworld",
});
```

## Security Configuration

### 1. Content Security Policy
```javascript
// Add to next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.com *.firebase.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: *.firebase.com *.runware.ai;
      font-src 'self';
      connect-src 'self' *.firebase.com *.runware.ai *.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### 2. Rate Limiting
```javascript
// Implement in middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

## Performance Optimization

### 1. Image Optimization
```javascript
// Configure in next.config.js
module.exports = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'runware.ai'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 2. Caching Strategy
```javascript
// Configure cache headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
```

## Backup and Recovery

### 1. Database Backups
```bash
# Firestore backup (set up in Firebase Console)
# Enable automatic backups with retention policy
```

### 2. Code Backups
```bash
# Ensure code is backed up in GitHub
git remote add backup https://github.com/your-org/draworld-backup.git
git push backup main
```

## Launch Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Payment processing tested
- [ ] Error tracking configured
- [ ] Monitoring alerts set up
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] Backup systems tested

### Launch Day
- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Monitor error rates
- [ ] Test critical user flows
- [ ] Monitor performance metrics
- [ ] Check payment processing
- [ ] Verify email notifications

### Post-Launch (First Week)
- [ ] Daily monitoring checks
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Bug fixes and patches
- [ ] Marketing campaign launch
- [ ] Customer support setup

## Scaling Considerations

### 1. Database Scaling
- Monitor Firestore usage and quotas
- Implement data archiving for old records
- Consider read replicas for heavy read workloads

### 2. Function Scaling
- Monitor Vercel function execution times
- Optimize cold start performance
- Consider upgrading to Pro plan for better performance

### 3. CDN and Caching
- Implement Redis for session storage
- Use Vercel Edge Functions for global performance
- Configure aggressive caching for static assets

## Cost Optimization

### 1. Monitor Usage
- Set up billing alerts in all services
- Monitor API usage and costs
- Implement usage-based pricing tiers

### 2. Optimize Resources
- Compress images and videos
- Implement lazy loading
- Use efficient database queries
- Cache frequently accessed data

## Support and Maintenance

### 1. Documentation
- Keep deployment docs updated
- Document troubleshooting procedures
- Maintain API documentation

### 2. Regular Maintenance
- Weekly security updates
- Monthly performance reviews
- Quarterly cost optimization reviews
- Annual security audits