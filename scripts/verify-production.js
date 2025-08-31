#!/usr/bin/env node

/**
 * Production Verification Script
 * This script verifies that production fixes are working correctly.
 */

const https = require('https');

console.log('🔍 Production Error Verification Script\n');

// Test the production site
function testProductionSite() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'draworld-opal.vercel.app',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runVerification() {
  console.log('1. 🌐 Testing production site accessibility...');
  
  try {
    const response = await testProductionSite();
    if (response.statusCode === 200) {
      console.log('   ✅ Site is accessible (Status: 200)');
      
      // Check if Firebase config is likely loaded (basic check)
      if (response.data.includes('firebase') || response.data.includes('NEXT_PUBLIC_FIREBASE')) {
        console.log('   ✅ Firebase configuration detected in page');
      } else {
        console.log('   ⚠️  Firebase configuration not detected in initial page load');
      }
    } else {
      console.log(`   ❌ Site returned status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ Error accessing site: ${error.message}`);
  }

  console.log('\n2. 📋 Manual Verification Checklist:');
  console.log('   □ Open https://draworld-opal.vercel.app in browser');
  console.log('   □ Open browser Developer Tools (F12)');
  console.log('   □ Check Console tab for errors');
  console.log('   □ Verify no "Missing Firebase environment variables" error');
  console.log('   □ Verify no SVG path errors');
  console.log('   □ Test user authentication (sign up/login)');
  console.log('   □ Test video creation workflow');
  
  console.log('\n3. ✅ Expected Results After Fix:');
  console.log('   - No "Missing Firebase environment variables" error');
  console.log('   - No SVG path attribute errors');
  console.log('   - Authentication should work properly');
  console.log('   - Only browser extension errors (ignorable)');
  
  console.log('\n4. 🛠️ If Issues Persist:');
  console.log('   - Verify Vercel environment variables are set');
  console.log('   - Check if redeploy was successful');
  console.log('   - Clear browser cache and hard refresh');
  console.log('   - Check Firebase project status');
  
  console.log('\n5. 📊 Environment Variables Status:');
  console.log('   Run: vercel env ls');
  console.log('   Expected: 6 Firebase NEXT_PUBLIC_ variables for production');
}

runVerification().catch(console.error);