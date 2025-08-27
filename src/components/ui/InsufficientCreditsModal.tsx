'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCredits } from '@/hooks/useCredits';
import { CREDITS, ROUTES } from '@/lib/constants';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
  currentCredits: number;
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  requiredCredits,
  currentCredits,
}: InsufficientCreditsModalProps) {
  const router = useRouter();
  const { credits } = useCredits();
  const [isClosing, setIsClosing] = useState(false);

  // Use real-time credits if available
  const actualCurrentCredits = credits || currentCredits;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleBuyCredits = () => {
    handleClose();
    router.push(ROUTES.PRICING);
  };

  const handleEarnCredits = () => {
    handleClose();
    router.push(ROUTES.ACCOUNT.REFERRALS);
  };

  if (!isOpen) return null;

  const shortfall = requiredCredits - actualCurrentCredits;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-2xl max-w-md w-full p-6 transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Insufficient Credits
          </h2>
          <p className="text-gray-600">
            You need <span className="font-semibold text-red-600">{shortfall} more credits</span> to create this video.
          </p>
        </div>

        {/* Credit Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Required:</span>
            <span className="font-semibold">{requiredCredits} credits</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Your balance:</span>
            <span className="font-semibold">{actualCurrentCredits} credits</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Need:</span>
              <span className="font-bold text-red-600">+{shortfall} credits</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBuyCredits}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>💎</span>
            Buy Credits
          </button>
          
          <button
            onClick={handleEarnCredits}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🎁</span>
            Earn Free Credits
          </button>

          <button
            onClick={handleClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-all duration-200"
          >
            Cancel
          </button>
        </div>

        {/* Earn Credits Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">💡 Ways to Earn Free Credits:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Daily check-in: +{CREDITS.DAILY_CHECKIN} credits</li>
            <li>• Invite friends: +{CREDITS.REFERRAL_SIGNUP} credits per signup</li>
            <li>• Share on social: +{CREDITS.SOCIAL_SHARE} credits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}