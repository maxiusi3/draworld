'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditDisplay } from './CreditDisplay';
import { CreditHistory } from './CreditHistory';
import { InsufficientCreditsModal } from './InsufficientCreditsModal';
import { CREDITS } from '@/lib/constants';

interface CreditManagerProps {
  className?: string;
  showHistory?: boolean;
  showCheckIn?: boolean;
}

export function CreditManager({ 
  className = '', 
  showHistory = true, 
  showCheckIn = true 
}: CreditManagerProps) {
  const { user } = useAuth();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const checkCreditsForAction = (requiredCredits: number): boolean => {
    if (!user || user.credits < requiredCredits) {
      setShowInsufficientModal(true);
      return false;
    }
    return true;
  };

  // Example function to check if user can create a video
  const canCreateVideo = (): boolean => {
    return checkCreditsForAction(CREDITS.VIDEO_CREATION_COST);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Credit Display with Check-in */}
      <div className="mb-6">
        <CreditDisplay showCheckIn={showCheckIn} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎬</span>
            <div>
              <h4 className="font-semibold text-gray-900">Create Video</h4>
              <p className="text-sm text-gray-600">{CREDITS.VIDEO_CREATION_COST} credits</p>
            </div>
          </div>
          <button
            onClick={canCreateVideo}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Check & Create
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👥</span>
            <div>
              <h4 className="font-semibold text-gray-900">Invite Friends</h4>
              <p className="text-sm text-gray-600">+{CREDITS.REFERRAL_SIGNUP} credits each</p>
            </div>
          </div>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Share Link
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💎</span>
            <div>
              <h4 className="font-semibold text-gray-900">Buy Credits</h4>
              <p className="text-sm text-gray-600">Starting at $1.99</p>
            </div>
          </div>
          <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            View Packages
          </button>
        </div>
      </div>

      {/* Credit History */}
      {showHistory && (
        <CreditHistory />
      )}

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        requiredCredits={CREDITS.VIDEO_CREATION_COST}
        currentCredits={user.credits}
      />
    </div>
  );
}