'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { CREDITS } from '@/lib/constants';

interface CreditDisplayProps {
  showCheckIn?: boolean;
  className?: string;
}

export function CreditDisplay({ showCheckIn = false, className = '' }: CreditDisplayProps) {
  const { user } = useAuth();
  const {
    credits,
    isLoading: isCheckingIn,
    canPerformDailyCheckIn: canCheckIn,
    getTimeUntilNextCheckIn,
    performDailyCheckIn,
  } = useCredits();

  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!canCheckIn) {
      const updateTimer = () => {
        setTimeUntilCheckIn(getTimeUntilNextCheckIn());
      };

      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [canCheckIn, getTimeUntilNextCheckIn]);

  const handleDailyCheckIn = async () => {
    if (!canCheckIn || isCheckingIn) return;

    const result = await performDailyCheckIn();
    if (result) {
      console.log(`Daily check-in successful! Earned ${result.creditsEarned} credits.`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Credit Balance */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-2 rounded-full border border-yellow-200">
        <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">⭐</span>
        </div>
        <span className="font-semibold text-gray-800">{credits.toLocaleString()}</span>
        <span className="text-sm text-gray-600">credits</span>
      </div>

      {/* Daily Check-in Button */}
      {showCheckIn && (
        <div className="flex items-center">
          {canCheckIn ? (
            <button
              onClick={handleDailyCheckIn}
              disabled={isCheckingIn}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              {isCheckingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking in...
                </>
              ) : (
                <>
                  <span>🎁</span>
                  Daily Bonus (+{CREDITS.DAILY_CHECKIN})
                </>
              )}
            </button>
          ) : (
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <span>⏰</span>
              Next bonus: {timeUntilCheckIn}
            </div>
          )}
        </div>
      )}
    </div>
  );
}