'use client';

import { useState } from 'react';
import { CREDIT_PACKAGES } from '@/lib/stripe';
import { PaymentModal } from './PaymentModal';

interface PricingCardsProps {
  className?: string;
  onPackageSelect?: (packageId: string) => void;
}

export function PricingCards({ className = '', onPackageSelect }: PricingCardsProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    if (onPackageSelect) {
      onPackageSelect(packageId);
    } else {
      setShowPaymentModal(true);
    }
  };

  const getValuePerCredit = (pkg: typeof CREDIT_PACKAGES[0]) => {
    const totalCredits = pkg.credits + pkg.bonusCredits;
    return (pkg.price / 100) / totalCredits;
  };

  const getBestValue = () => {
    return CREDIT_PACKAGES.reduce((best, current) => {
      return getValuePerCredit(current) < getValuePerCredit(best) ? current : best;
    });
  };

  const bestValuePackage = getBestValue();

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CREDIT_PACKAGES.map((pkg) => {
          const totalCredits = pkg.credits + pkg.bonusCredits;
          const valuePerCredit = getValuePerCredit(pkg);
          const isBestValue = pkg.id === bestValuePackage.id;
          const isPopular = pkg.popular;

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
                isPopular || isBestValue
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {(isPopular || isBestValue) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {isPopular ? 'Most Popular' : 'Best Value'}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Package Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ${(pkg.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ${valuePerCredit.toFixed(3)} per credit
                  </div>
                </div>

                {/* Credits Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Credits:</span>
                    <span className="font-semibold">{pkg.credits.toLocaleString()}</span>
                  </div>
                  
                  {pkg.bonusCredits > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bonus Credits:</span>
                      <span className="font-semibold text-green-600">
                        +{pkg.bonusCredits.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Credits:</span>
                      <span className="font-bold text-blue-600">
                        {totalCredits.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Videos Count */}
                <div className="bg-gray-50 rounded-xl p-3 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.floor(totalCredits / 60)}
                    </div>
                    <div className="text-sm text-gray-600">Videos you can create</div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handlePackageSelect(pkg.id)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    isPopular || isBestValue
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Select Package
                </button>
              </div>
            </div>
          );
        })}
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