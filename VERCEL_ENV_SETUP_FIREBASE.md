# 🔥 URGENT: Set Firebase Environment Variables in Vercel

## 🚨 Current Issue
The Firebase environment variables are not properly configured in Vercel, causing the application to fail initialization.

## 📋 Required Actions

### 1. Go to Vercel Dashboard
Navigate to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

### 2. Add These Environment Variables

**IMPORTANT:** Add each variable with these EXACT names and values:

#### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=draworld-6898f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=draworld-6898f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=draworld-6898f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=814051215268
NEXT_PUBLIC_FIREBASE_APP_ID=1:814051215268:web:f251c9b76e9452ed1d6331
```

#### Runware AI Configuration
```
NEXT_PUBLIC_RUNWARE_API_URL=https://api.runware.ai
RUNWARE_API_KEY=aNCXDzYXMuZQiFPzSFhpxnt5bGEy6o4F
```

#### App Configuration
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://draworld-opal.vercel.app
NEXT_PUBLIC_API_URL=https://draworld-opal.vercel.app/api
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_MOCK_PAYMENTS=false
```

### 3. Important Settings for Each Variable

- **Environment:** Select "Production" (and "Preview" if you want)
- **Branch:** Leave blank (applies to all branches)

### 4. After Adding Variables

1. **Redeploy:** Go to Deployments tab → Click "Redeploy" on latest deployment
2. **OR** Push any small change to trigger automatic deployment

## 🔍 Verification Steps

After deployment completes:

1. Visit: https://draworld-opal.vercel.app/
2. Open Browser DevTools (F12) → Console
3. Check that you NO LONGER see the error:
   ```
   Missing Firebase environment variables: ['NEXT_PUBLIC_FIREBASE_API_KEY', ...]
   ```

## 📝 Notes

- ✅ The `.env.production` file is for local reference only
- ✅ Vercel requires environment variables to be set in the dashboard
- ✅ All `NEXT_PUBLIC_` variables are exposed to the browser
- ✅ Server-side variables (without NEXT_PUBLIC_) are kept secret

## 🚀 Expected Result

After setting these variables, your Firebase services should initialize properly and all console errors should be resolved.