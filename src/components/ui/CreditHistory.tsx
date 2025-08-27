'use client';

import { useState, useEffect } from 'react';
import { CreditService } from '@/services/creditService';
import { CreditTransaction } from '@/types';

interface CreditHistoryProps {
  className?: string;
  limit?: number;
  showTitle?: boolean;
}

export function CreditHistory({ 
  className = '', 
  limit = 50, 
  showTitle = true 
}: CreditHistoryProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (startAfter?: string) => {
    try {
      setLoading(true);
      const result = await CreditService.getCreditHistory(limit, startAfter);
      
      if (startAfter) {
        setTransactions(prev => [...prev, ...result.transactions]);
      } else {
        setTransactions(result.transactions);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      setError(null);
    } catch (err) {
      setError('Failed to load credit history');
      console.error('Error loading credit history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && lastDoc && !loading) {
      loadTransactions(lastDoc);
    }
  };

  const getTransactionIcon = (source: string, type: string) => {
    if (type === 'spent') return '💸';
    
    switch (source) {
      case 'signup': return '🎉';
      case 'checkin': return '🎁';
      case 'referral': return '👥';
      case 'purchase': return '💎';
      case 'admin_award': return '⭐';
      default: return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'earned' ? 'text-green-600' : 'text-red-600';
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'earned' ? '+' : '';
    return `${prefix}${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
        )}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
        )}
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => loadTransactions()}
            className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600">Your credit transactions will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit History</h3>
      )}
      
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              {getTransactionIcon(transaction.source, transaction.type)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {transaction.description}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(transaction.createdAt)}
              </p>
            </div>

            {/* Amount */}
            <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
              {formatAmount(transaction.amount, transaction.type)}
            </div>
          </div>
        ))}
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