/**
 * Health check utility for diagnosing production issues
 * Add this to your browser console to diagnose any remaining errors
 */

function checkDraworldHealth() {
  console.log('🔍 Draworld Health Check Starting...');
  
  const results = {
    firebase: false,
    environment: false,
    services: false,
    performance: false,
    errors: []
  };

  // Check Firebase Configuration
  try {
    const firebaseConfig = {
      apiKey: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : 'N/A',
      authDomain: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : 'N/A',
      projectId: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : 'N/A',
    };
    
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'N/A') {
      console.log('✅ Firebase configuration found');
      results.firebase = true;
    } else {
      console.log('❌ Firebase configuration missing');
      results.errors.push('Firebase environment variables not set');
    }
  } catch (error) {
    console.log('❌ Firebase check failed:', error);
    results.errors.push('Firebase configuration error: ' + error.message);
  }

  // Check Environment Variables
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_RUNWARE_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables present');
      results.environment = true;
    } else {
      console.log('❌ Missing environment variables:', missingVars);
      results.errors.push('Missing environment variables: ' + missingVars.join(', '));
    }
  } catch (error) {
    console.log('❌ Environment check failed:', error);
    results.errors.push('Environment check error: ' + error.message);
  }

  // Check Service Availability
  try {
    const services = {
      fetch: typeof fetch !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      performance: typeof performance !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined'
    };
    
    const unavailableServices = Object.entries(services)
      .filter(([, available]) => !available)
      .map(([service]) => service);
    
    if (unavailableServices.length === 0) {
      console.log('✅ All required browser services available');
      results.services = true;
    } else {
      console.log('⚠️ Some services unavailable:', unavailableServices);
      results.errors.push('Unavailable services: ' + unavailableServices.join(', '));
    }
  } catch (error) {
    console.log('❌ Service check failed:', error);
    results.errors.push('Service check error: ' + error.message);
  }

  // Check Performance API
  try {
    if (typeof performance !== 'undefined' && performance.mark) {
      console.log('✅ Performance API available');
      results.performance = true;
    } else {
      console.log('⚠️ Performance API limited');
      results.errors.push('Performance API not fully available');
    }
  } catch (error) {
    console.log('❌ Performance check failed:', error);
    results.errors.push('Performance check error: ' + error.message);
  }

  // Summary
  console.log('\\n📊 Health Check Summary:');
  console.log('Firebase:', results.firebase ? '✅' : '❌');
  console.log('Environment:', results.environment ? '✅' : '❌');
  console.log('Services:', results.services ? '✅' : '❌'); 
  console.log('Performance:', results.performance ? '✅' : '❌');
  
  if (results.errors.length > 0) {
    console.log('\\n🚨 Issues Found:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('\\n🎉 All checks passed! Draworld should be working properly.');
  }

  return results;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  // Run health check after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkDraworldHealth, 2000);
    });
  } else {
    setTimeout(checkDraworldHealth, 2000);
  }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkDraworldHealth };
} else if (typeof window !== 'undefined') {
  window.checkDraworldHealth = checkDraworldHealth;
}