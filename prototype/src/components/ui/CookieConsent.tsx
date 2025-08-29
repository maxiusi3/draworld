'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { CookieConsent as CookieConsentManager } from '@/lib/compliance';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = CookieConsentManager.hasConsent();
    setShowBanner(!hasConsent);
  }, []);

  const handleAcceptAll = () => {
    CookieConsentManager.setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    CookieConsentManager.setConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    CookieConsentManager.setConsent(preferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const handlePreferenceChange = (type: 'analytics' | 'marketing', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      {!showDetails ? (
        // Simple banner
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                We use cookies to enhance your experience, analyze site usage, and assist in marketing efforts. 
                By continuing to use our site, you consent to our use of cookies.{' '}
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-pink-600 hover:underline font-medium"
                >
                  Customize preferences
                </button>
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAcceptNecessary}
              >
                Necessary Only
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Detailed preferences
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cookie Preferences
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Necessary cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Essential for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Analytics cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Help us understand how visitors interact with our website to improve user experience.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      preferences.analytics 
                        ? 'bg-green-500 justify-end' 
                        : 'bg-gray-300 justify-start'
                    } px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              {/* Marketing cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Used to deliver personalized advertisements and track campaign effectiveness.
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
                    className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                      preferences.marketing 
                        ? 'bg-green-500 justify-end' 
                        : 'bg-gray-300 justify-start'
                    } px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDetails(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}