# 🚨 Vercel Environment Variables Troubleshooting Guide

## Current Issue
You've set the Firebase environment variables in Vercel dashboard but still getting:
```
Missing Firebase environment variables: ['NEXT_PUBLIC_FIREBASE_API_KEY', ...]
```

## 🔍 Diagnostic Steps

### Step 1: Verify Variables in Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your **draworld** project
3. Go to **Settings** → **Environment Variables**
4. Confirm ALL these variables are present with values:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Step 2: Check Environment Settings
For EACH variable, ensure:
- ✅ **Environment**: "Production" is selected
- ✅ **Branch**: Leave blank (applies to all branches)
- ✅ **Value**: Has the correct Firebase config value

### Step 3: Force Redeploy
After confirming variables are set:
1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **three dots** (⋯) menu
4. Select **"Redeploy"**
5. Wait for deployment to complete

### Step 4: Use Debug Endpoint (After Redeploy)
Once redeployed, visit:
```
https://draworld-opal.vercel.app/api/debug/env
```

This will show you exactly which variables are missing in production.

## 🛠 Common Issues & Solutions

### Issue 1: Variables Not Saved Properly
**Symptoms:** Variables appear in dashboard but still missing in production
**Solution:** 
- Re-add each variable one by one
- Make sure to click "Save" after each variable
- Don't copy-paste with extra spaces

### Issue 2: Wrong Environment Selected
**Symptoms:** Variables work in preview but not production
**Solution:**
- Ensure "Production" environment is selected for each variable
- You can also select "Preview" and "Development" for consistency

### Issue 3: Case Sensitivity
**Symptoms:** Variables seem correct but still not working
**Solution:**
- Variable names must be EXACTLY: `NEXT_PUBLIC_FIREBASE_API_KEY`
- No extra spaces, different casing, or typos

### Issue 4: Deployment Cache
**Symptoms:** Variables are correct but deployment uses old values
**Solution:**
- Click "Redeploy" (not just new git push)
- Or make a small code change and push to trigger fresh deployment

### Issue 5: Wrong Project/Team
**Symptoms:** Variables don't seem to apply
**Solution:**
- Ensure you're in the correct Vercel team/account
- Check the project name matches exactly

## 📋 Exact Values to Set

Based on your `.env.production` file, set these EXACT values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=draworld-6898f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=draworld-6898f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=draworld-6898f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=814051215268
NEXT_PUBLIC_FIREBASE_APP_ID=1:814051215268:web:f251c9b76e9452ed1d6331
```

## 🔄 Step-by-Step Recovery Process

1. **Delete All Firebase Variables** in Vercel dashboard
2. **Wait 2 minutes** for cache to clear
3. **Re-add each variable** one by one with exact values above
4. **Select "Production" environment** for each
5. **Click "Redeploy"** on latest deployment
6. **Wait for deployment** to complete (5-10 minutes)
7. **Test the site**: https://draworld-opal.vercel.app/
8. **Check debug endpoint**: https://draworld-opal.vercel.app/api/debug/env

## 🆘 If Still Not Working

1. **Check the debug endpoint response** - it will tell you exactly what's missing
2. **Try setting variables for ALL environments** (Production, Preview, Development)
3. **Contact Vercel support** if the dashboard isn't saving variables properly
4. **Consider using Vercel CLI** to set variables:
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
   # Then enter the value when prompted
   ```

## ✅ Success Indicators

You'll know it's working when:
- ✅ No console errors about missing Firebase variables
- ✅ Debug endpoint shows all variables present
- ✅ Firebase authentication and services work properly
- ✅ No "Failed to initialize Firebase" errors

## 📞 Need Help?

If you're still stuck after following this guide:
1. Share the output from: `https://draworld-opal.vercel.app/api/debug/env`
2. Screenshot of your Vercel environment variables page
3. Console errors from the live site