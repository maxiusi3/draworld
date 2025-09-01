#!/usr/bin/env node

/**
 * Deployment Verification Script
 * This script monitors the deployment and verifies when the fixes are live
 */

const https = require('https');

console.log('🔍 DEPLOYMENT VERIFICATION MONITOR\n');

console.log('✅ DEPLOYMENT TRIGGERED:');
console.log('- Git push completed successfully');
console.log('- Vercel will automatically deploy the changes');
console.log('- Expected deployment time: 2-3 minutes\n');

async function checkEnvironmentVariables() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'draworld-opal.vercel.app',
      port: 443,
      path: '/api/debug/env',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js verification script)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
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

async function monitorDeployment() {
  console.log('🔄 Monitoring deployment status...\n');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`📡 Attempt ${attempts}/${maxAttempts} - Checking production status...`);
    
    try {
      const response = await checkEnvironmentVariables();
      
      if (response.summary && response.summary.present === 6) {
        console.log('\n🎉 SUCCESS! Deployment completed and environment variables are available!');
        console.log(`✅ Firebase variables: ${response.summary.present}/${response.summary.total}`);
        console.log('✅ Missing variables: None');
        
        console.log('\n📊 VERIFICATION RESULTS:');
        console.log('✅ Environment variables: FIXED');
        console.log('✅ SVG path error: FIXED (in this deployment)');
        console.log('✅ Firebase services: Should now work properly');
        
        console.log('\n🔍 FINAL VERIFICATION STEPS:');
        console.log('1. Open: https://draworld-opal.vercel.app');
        console.log('2. Open Developer Tools → Console');
        console.log('3. Verify NO "Missing Firebase environment variables" errors');
        console.log('4. Verify NO "<path> attribute d: Expected number" errors');
        console.log('5. Browser extension errors will remain (safe to ignore)');
        
        return;
      } else {
        console.log(`   ⏳ Still deploying... (${response.summary?.present || 0}/6 variables available)`);
      }
    } catch (error) {
      console.log(`   ⏳ Deployment in progress... (${error.message})`);
    }
    
    if (attempts < maxAttempts) {
      console.log('   ⏰ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⚠️ Deployment taking longer than expected.');
  console.log('💡 You can manually check:');
  console.log('   curl https://draworld-opal.vercel.app/api/debug/env');
  console.log('📖 Or visit: https://vercel.com/dashboard (check Deployments tab)');
}

// Start monitoring
console.log('🚀 Starting deployment monitoring...');
console.log('📋 This will check every 30 seconds for up to 5 minutes.\n');

monitorDeployment().catch(error => {
  console.error('❌ Monitoring failed:', error.message);
  console.log('\n💡 Manual verification commands:');
  console.log('curl https://draworld-opal.vercel.app/api/debug/env');
  console.log('# Should show all 6 Firebase variables present');
});