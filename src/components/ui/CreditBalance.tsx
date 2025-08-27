'use client';

import { useAuth } from '@/contexts/AuthContext';

interface CreditBalanceProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function CreditBalance({ 
  className = '', 
  size = 'md', 
  showLabel = true 
}: CreditBalanceProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full border border-yellow-200 ${sizeClasses[size]} ${className}`}>
      <div className={`bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center ${iconSizes[size]}`}>
        <span className="text-white font-bold">⭐</span>
      </div>
      <span className="font-semibold text-gray-800">
        {user.credits.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-gray-600">
          {size === 'sm' ? '' : 'credits'}
        </span>
      )}
    </div>
  );
}