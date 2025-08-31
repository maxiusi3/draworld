#!/bin/bash

echo "🚀 Quick Production Fix Deployment Script"
echo "========================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Setting Firebase environment variables in Vercel..."

# Firebase configuration variables
FIREBASE_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=draworld-6898f.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=draworld-6898f"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=draworld-6898f.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=814051215268"
    "NEXT_PUBLIC_FIREBASE_APP_ID=1:814051215268:web:f251c9b76e9452ed1d6331"
)

echo "Setting environment variables..."
for var in "${FIREBASE_VARS[@]}"; do
    IFS='=' read -r key value <<< "$var"
    echo "Setting $key..."
    echo "$value" | vercel env add "$key" production
done

echo "✅ Environment variables set!"
echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Next steps:"
echo "1. Visit your production site: https://draworld-opal.vercel.app"
echo "2. Open browser console to verify errors are fixed"
echo "3. Test Firebase authentication and other features"
echo ""
echo "📖 If you still see errors, check:"
echo "   - Vercel dashboard environment variables"
echo "   - Firebase project configuration"
echo "   - Browser console for new error details"