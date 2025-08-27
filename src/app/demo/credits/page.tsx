'use client';

import { useState } from 'react';
import { 
  CreditDisplay, 
  CreditBalance, 
  CreditHistory, 
  CreditManager, 
  InsufficientCreditsModal 
} from '@/components/ui';
import { useCredits } from '@/hooks/useCredits';
import { CREDITS } from '@/lib/constants';

export default function CreditsDemoPage() {
  const { canCreateVideo, spendCredits, credits } = useCredits();
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const handleTestVideoCreation = async () => {
    if (!canCreateVideo()) {
      setShowInsufficientModal(true);
      return;
    }

    const result = await spendCredits(
      CREDITS.VIDEO_CREATION_COST,
      'Test video creation',
      'video_generation',
      'demo-video-123'
    );

    if (result) {
      alert(`Video creation successful! Spent ${CREDITS.VIDEO_CREATION_COST} credits.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit System Demo</h1>
          <p className="text-gray-600">Showcase of all credit management components</p>
        </div>

        {/* Component Showcase */}
        <div className="space-y-8">
          {/* Credit Display Components */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Display Components</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CreditDisplay (with check-in)</h3>
                <CreditDisplay showCheckIn={true} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CreditDisplay (without check-in)</h3>
                <CreditDisplay showCheckIn={false} />
              </div>
              
              <div className="flex gap-4 items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">CreditBalance (small)</h3>
                  <CreditBalance size="sm" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">CreditBalance (medium)</h3>
                  <CreditBalance size="md" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">CreditBalance (large)</h3>
                  <CreditBalance size="lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Test Actions */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
            
            <div className="flex gap-4">
              <button
                onClick={handleTestVideoCreation}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Test Video Creation ({CREDITS.VIDEO_CREATION_COST} credits)
              </button>
              
              <button
                onClick={() => setShowInsufficientModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Show Insufficient Credits Modal
              </button>
            </div>
          </section>

          {/* Credit Manager */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Manager</h2>
            <CreditManager />
          </section>

          {/* Credit History */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit History</h2>
            <CreditHistory />
          </section>
        </div>

        {/* Insufficient Credits Modal */}
        <InsufficientCreditsModal
          isOpen={showInsufficientModal}
          onClose={() => setShowInsufficientModal(false)}
          requiredCredits={CREDITS.VIDEO_CREATION_COST}
          currentCredits={credits}
        />
      </div>
    </div>
  );
}