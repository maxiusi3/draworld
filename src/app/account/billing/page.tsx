'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditManager } from '@/components/ui/CreditManager';
import { CreditHistory } from '@/components/ui/CreditHistory';
import { CreditBalance } from '@/components/ui/CreditBalance';
import { PaymentHistory } from '@/components/ui/PaymentHistory';
import { PricingCards } from '@/components/ui/PricingCards';
import { CREDITS } from '@/lib/constants';

export default function BillingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'orders' | 'packages'>('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your billing information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Credits</h1>
          <p className="text-gray-600">Manage your credits, view transaction history, and purchase credit packages.</p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Balance</h2>
            <CreditBalance size="lg" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{user.credits}</div>
              <div className="text-sm text-blue-600">Available Credits</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{Math.floor(user.credits / CREDITS.VIDEO_CREATION_COST)}</div>
              <div className="text-sm text-green-600">Videos You Can Create</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">$0.60</div>
              <div className="text-sm text-purple-600">Estimated Value</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'credits'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Credit History
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Credit Packages
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <CreditManager showHistory={false} showCheckIn={true} />
            )}

            {activeTab === 'credits' && (
              <CreditHistory showTitle={false} />
            )}

            {activeTab === 'orders' && (
              <PaymentHistory showTitle={false} />
            )}

            {activeTab === 'packages' && (
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Packages</h3>
                  <p className="text-gray-600">Purchase credit packages to continue creating amazing videos.</p>
                </div>
                <PricingCards />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Earn Free Credits</h3>
            <p className="text-green-100 mb-4">Invite friends and earn credits for every signup!</p>
            <button 
              onClick={() => window.location.href = '/account/referrals'}
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Start Referring
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Need More Credits?</h3>
            <p className="text-blue-100 mb-4">Purchase credit packages starting at just $1.99</p>
            <button 
              onClick={() => setActiveTab('packages')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}