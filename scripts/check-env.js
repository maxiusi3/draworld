#!/usr/bin/env node

/**
 * Environment Variables Checker for Firebase Configuration
 * This script helps verify that all required Firebase environment variables are properly set.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'NEXT_PUBLIC_RUNWARE_API_URL',
  'RUNWARE_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
];

console.log('🔥 Firebase Environment Variables Checker\n');

// Check required variables
console.log('📋 Required Firebase Variables:');
const missing = [];
const present = [];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    present.push(envVar);
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    missing.push(envVar);
    console.log(`❌ ${envVar}: NOT SET`);
  }
});

// Check optional variables
console.log('\n🔧 Optional Variables:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${envVar}: NOT SET (optional)`);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Required variables set: ${present.length}/${requiredEnvVars.length}`);
console.log(`❌ Missing required variables: ${missing.length}`);

if (missing.length > 0) {
  console.log('\n🚨 Action Required:');
  console.log('The following variables must be set in Vercel dashboard:');
  missing.forEach(envVar => {
    console.log(`   - ${envVar}`);
  });
  console.log('\n📖 See VERCEL_ENV_SETUP_FIREBASE.md for detailed instructions');
  process.exit(1);
} else {
  console.log('\n🎉 All required Firebase environment variables are properly configured!');
  process.exit(0);
}