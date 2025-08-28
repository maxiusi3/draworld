'use client';

import { useState } from 'react';
import { PricingCards } from '@/components/ui/PricingCards';
import { PaymentModal } from '@/components/ui/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { CREDITS } from '@/lib/constants';
import { usePageView } from '@/hooks/useAnalytics';
import { trackPricingPageViewed } from '@/lib/analytics';

export default function PricingPage() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  usePageView('pricing_page');
  
  // Track pricing page view on mount
  useState(() => {
    trackPricingPageViewed('direct');
  });

  const handlePackageSelect = (packageId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/pricing';
      return;
    }
    
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Credit Package
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Transform your child's drawings into magical animated videos
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <span className="text-2xl">🎬</span>
              <span className="font-semibold">
                Each video costs {CREDITS.VIDEO_CREATION_COST} credits
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <PricingCards onPackageSelect={handlePackageSelect} />

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What's Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Animation
              </h3>
              <p className="text-gray-600">
                Advanced AI brings drawings to life with smooth, magical animations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎵</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Custom Soundtracks
              </h3>
              <p className="text-gray-600">
                Choose from different moods to get the perfect background music
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💾</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                HD Downloads
              </h3>
              <p className="text-gray-600">
                Download your videos in high quality to keep forever
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                How do credits work?
              </h3>
              <p className="text-gray-600">
                Each video generation costs {CREDITS.VIDEO_CREATION_COST} credits. You can purchase credit packages or earn free credits through daily check-ins and referrals.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do credits expire?
              </h3>
              <p className="text-gray-600">
                No! Your credits never expire. Purchase once and use them whenever you want to create videos.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I get a refund?
              </h3>
              <p className="text-gray-600">
                We offer refunds within 30 days of purchase if you haven't used any credits. Contact support for assistance.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                How can I earn free credits?
              </h3>
              <p className="text-gray-600">
                You can earn free credits through daily check-ins (+{CREDITS.DAILY_CHECKIN}), referring friends (+{CREDITS.REFERRAL_SIGNUP}), and sharing on social media (+{CREDITS.SOCIAL_SHARE}).
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Bring Drawings to Life?
            </h2>
            <p className="text-blue-100 mb-6">
              Join thousands of families creating magical memories with AI animation
            </p>
            {!user ? (
              <a
                href="/signup"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Sign Up for Free
              </a>
            ) : (
              <button
                onClick={() => handlePackageSelect('popular')}
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Get Started Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        packageId={selectedPackage}
      />
    </div>
  );
}