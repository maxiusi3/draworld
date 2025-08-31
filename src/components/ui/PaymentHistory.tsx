'use client';

import { useState, useEffect } from 'react';
import { PaymentService } from '@/services/paymentService';
import { Payment } from '@/types';
import { CREDIT_PACKAGES } from '@/lib/stripe';
import { toSafeDate } from '@/lib/utils';

interface PaymentHistoryProps {
  className?: string;
  limit?: number;
  showTitle?: boolean;
}

export function PaymentHistory({ 
  className = '', 
  limit = 20, 
  showTitle = true 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async (startAfter?: string) => {
    try {
      setLoading(true);
      const result = await PaymentService.getPaymentHistory(limit, startAfter);
      
      if (startAfter) {
        setPayments(prev => [...prev, ...result.payments]);
      } else {
        setPayments(result.payments);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      setError(null);
    } catch (err: any) {
      setError('Failed to load payment history');
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && lastDoc && !loading) {
      loadPayments(lastDoc);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'canceled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      case 'canceled': return '🚫';
      default: return '❓';
    }
  };

  const getPackageName = (packageId: string) => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    return pkg?.name || packageId;
  };

  const formatDate = (timestamp: any) => {
    const date = toSafeDate(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading && payments.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        )}
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => loadPayments()}
            className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Yet</h3>
          <p className="text-gray-600">Your payment history will appear here after your first purchase.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
      )}
      
      <div className="space-y-3">
        {payments.map((payment) => {
          const totalCredits = payment.credits + payment.bonusCredits;
          
          return (
            <div
              key={payment.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {/* Package Icon */}
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xl">
                💎
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 truncate">
                    {getPackageName(payment.packageId)}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)} {payment.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDate(payment.createdAt)} • {totalCredits.toLocaleString()} credits
                </p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${(payment.amount / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {payment.status === 'succeeded' ? 'Paid' : 'Unpaid'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}