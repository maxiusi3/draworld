'use client';

import { useState } from 'react';
import { 
  PaymentModal, 
  PaymentHistory, 
  PricingCards 
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { CREDIT_PACKAGES } from '@/lib/stripe';

export default function PaymentsDemoPage() {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('popular');

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to test the payment system.</p>
          <a
            href="/login"
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment System Demo</h1>
          <p className="text-gray-600">Test Stripe integration and payment components</p>
        </div>

        {/* Test Environment Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800">Test Environment</h3>
              <p className="text-yellow-700 text-sm">
                This is a demo environment. Use test card numbers like 4242 4242 4242 4242 for testing.
              </p>
            </div>
          </div>
        </div>

        {/* Component Showcase */}
        <div className="space-y-8">
          {/* Pricing Cards */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Cards Component</h2>
            <PricingCards onPackageSelect={handlePackageSelect} />
          </section>

          {/* Test Actions */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-medium transition-colors text-left"
                >
                  <div className="text-sm opacity-90">Test Payment</div>
                  <div className="font-semibold">{pkg.name}</div>
                  <div className="text-sm opacity-90">${(pkg.price / 100).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Test Card Information */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Card Numbers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Successful Payments</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-mono">4242 4242 4242 4242</div>
                    <div className="text-green-600">Visa - Always succeeds</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="font-mono">5555 5555 5555 4444</div>
                    <div className="text-green-600">Mastercard - Always succeeds</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Failed Payments</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="font-mono">4000 0000 0000 0002</div>
                    <div className="text-red-600">Card declined</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="font-mono">4000 0000 0000 9995</div>
                    <div className="text-red-600">Insufficient funds</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Use any future expiry date (e.g., 12/34), any 3-digit CVC, and any postal code.
              </p>
            </div>
          </section>

          {/* Payment History */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
            <PaymentHistory />
          </section>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          packageId={selectedPackage}
        />
      </div>
    </div>
  );
}