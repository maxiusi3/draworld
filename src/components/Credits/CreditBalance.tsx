// 语言: TypeScript
// 说明: 积分余额显示组件

import React from 'react';
import { useCreditBalance } from '../../hooks/useCredits';
import { creditsService, CreditsService } from '../../services/creditsService';
import { CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreditBalanceProps {
  showRechargeButton?: boolean;
  size?: 'small' | 'medium' | 'large';
  onRechargeClick?: () => void;
  className?: string;
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  showRechargeButton = true,
  size = 'medium',
  onRechargeClick,
  className = '',
}) => {
  const { balance, loading, error } = useCreditBalance();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="w-12 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <CurrencyDollarIcon className="w-5 h-5" />
        <span className="text-sm">--</span>
      </div>
    );
  }

  const sizeClasses = {
    small: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      button: 'w-6 h-6',
      buttonIcon: 'w-3 h-3',
    },
    medium: {
      icon: 'w-5 h-5',
      text: 'text-base',
      button: 'w-7 h-7',
      buttonIcon: 'w-4 h-4',
    },
    large: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      button: 'w-8 h-8',
      buttonIcon: 'w-5 h-5',
    },
  };

  const classes = sizeClasses[size];

  const handleRechargeClick = () => {
    if (onRechargeClick) {
      onRechargeClick();
    } else {
      // 默认行为：跳转到充值页面或打开充值弹窗
      console.log('打开充值页面');
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <CurrencyDollarIcon className={`${classes.icon} text-yellow-500`} />
        <span className={`${classes.text} font-semibold text-gray-900`}>
          {balance?.toLocaleString() || '0'}
        </span>
      </div>
      
      {showRechargeButton && (
        <button
          onClick={handleRechargeClick}
          className={`
            ${classes.button} 
            bg-blue-500 hover:bg-blue-600 
            text-white rounded-full 
            flex items-center justify-center 
            transition-colors duration-200
            shadow-sm hover:shadow-md
          `}
          title="充值积分"
        >
          <PlusIcon className={classes.buttonIcon} />
        </button>
      )}
    </div>
  );
};

// 简化版积分显示组件（仅显示数字）
export const SimpleCreditBalance: React.FC<{
  className?: string;
  showIcon?: boolean;
}> = ({ className = '', showIcon = true }) => {
  const { balance, loading } = useCreditBalance();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-12 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!balance) {
    return <span className={className}>--</span>;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {showIcon && <CurrencyDollarIcon className="w-4 h-4 text-yellow-500" />}
      <span className="font-semibold">
        {balance?.toLocaleString() || '0'}
      </span>
    </div>
  );
};

// 积分不足提示组件
export const InsufficientCreditsAlert: React.FC<{
  requiredCredits: number;
  onRechargeClick?: () => void;
}> = ({ requiredCredits, onRechargeClick }) => {
  const { balance } = useCreditBalance();

  if (!balance || balance >= requiredCredits) {
    return null;
  }

  const shortfall = requiredCredits - balance;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <CurrencyDollarIcon className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            积分余额不足
          </h3>
          <p className="mt-1 text-sm text-red-700">
            当前余额：{balance?.toLocaleString() || '0'} 积分
            <br />
            所需积分：{requiredCredits.toLocaleString()} 积分
            <br />
            还需充值：{shortfall.toLocaleString()} 积分
          </p>
          {onRechargeClick && (
            <div className="mt-3">
              <button
                onClick={onRechargeClick}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                立即充值
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
