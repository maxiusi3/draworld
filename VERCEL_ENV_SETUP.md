# 🚨 URGENT: Vercel Environment Variables Setup Required

## ❌ Current Issue
Your production deployment is missing essential environment variables, causing multiple console errors.

## ✅ Required Action: Set These in Vercel Dashboard

### **Go to Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **exact values** for **Production**, **Preview**, and **Development**:

```bash
# Firebase Configuration (Essential)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=draworld-6898f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=draworld-6898f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=draworld-6898f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=814051215268
NEXT_PUBLIC_FIREBASE_APP_ID=1:814051215268:web:f251c9b76e9452ed1d6331

# API Configuration (Essential)
NEXT_PUBLIC_RUNWARE_API_KEY=aNCXDzYXMuZQiFPzSFhpxnt5bGEy6o4F
NEXT_PUBLIC_RUNWARE_API_URL=https://api.runware.ai
NEXT_PUBLIC_APP_URL=https://draworld-opal.vercel.app
NEXT_PUBLIC_API_URL=https://draworld-opal.vercel.app/api

# Feature Flags (Essential)
NEXT_PUBLIC_MOCK_PAYMENTS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

## 🔧 Step-by-Step Instructions:

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Your Project**: draworld
3. **Go to Settings** → **Environment Variables**
4. **For Each Variable Above**:
   - Click "Add New"
   - Enter Name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Enter Value (e.g., `AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA`)
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

## 🚀 After Setting Variables:

**Option 1**: Redeploy automatically
- Push any small change to your repository
- GitHub Actions will trigger new deployment

**Option 2**: Manual redeploy
```bash
vercel --prod
```

## ✅ Expected Results:

After setting these variables and redeploying:
- ✅ No more "Missing Firebase environment variables" errors
- ✅ Authentication will work properly  
- ✅ API calls will succeed
- ✅ No more CSP violations
- ✅ Clean console with no errors

## 🎯 Priority Order:

1. **Set Firebase variables first** (fixes authentication)
2. **Set API configuration** (fixes API calls)
3. **Set feature flags** (enables all features)
4. **Redeploy** (applies changes)

## ⚠️ Important Notes:

- **These are PUBLIC Firebase config values** - safe to use in frontend
- **NEXT_PUBLIC_ prefix** is required for frontend access
- **Apply to all environments** (Production, Preview, Development)
- **Values are case-sensitive** - copy exactly as shown

Your site will work perfectly once these environment variables are set! 🎉