'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CREDITS } from '@/lib/constants';
import { toSafeDate } from '@/lib/utils';

export function WelcomeNotification() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if this is a new user (created within the last minute)
      const now = new Date();
      const userCreated = toSafeDate(user.createdAt);
      const timeDiff = now.getTime() - userCreated.getTime();
      const isNewUser = timeDiff < 60000; // 1 minute

      if (isNewUser) {
        setShowWelcome(true);
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setShowWelcome(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  if (!showWelcome || !user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 animate-slide-in-right" data-testid="welcome-notification">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🎉</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              Welcome to Draworld!
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              You&apos;ve received {CREDITS.SIGNUP_BONUS} credits to start creating magical videos!
            </p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}