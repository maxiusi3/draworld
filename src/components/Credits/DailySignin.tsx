// 语言: TypeScript
// 说明: 每日签到组件

import React, { useState, useEffect } from 'react';
import { useDailySignin } from '../../hooks/useCredits';
import { CalendarDaysIcon, GiftIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface DailySigninProps {
  className?: string;
  showAsButton?: boolean;
}

export const DailySignin: React.FC<DailySigninProps> = ({
  className = '',
  showAsButton = true,
}) => {
  const { signin, loading } = useDailySignin();
  const [hasSignedToday, setHasSignedToday] = useState(false);

  // 检查今日是否已签到（从localStorage读取）
  useEffect(() => {
    const today = new Date().toDateString();
    const lastSigninDate = localStorage.getItem('lastSigninDate');
    setHasSignedToday(lastSigninDate === today);
  }, []);

  const handleSignin = async () => {
    const result = await signin();
    if (result) {
      // 记录签到日期
      const today = new Date().toDateString();
      localStorage.setItem('lastSigninDate', today);
      setHasSignedToday(true);
    }
  };

  if (showAsButton) {
    return (
      <button
        onClick={handleSignin}
        disabled={loading || hasSignedToday}
        className={`
          ${className}
          flex items-center space-x-2 px-4 py-2 rounded-lg
          transition-all duration-200
          ${hasSignedToday
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {hasSignedToday ? (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            <span>已签到</span>
          </>
        ) : (
          <>
            <GiftIcon className="w-5 h-5" />
            <span>{loading ? '签到中...' : '每日签到'}</span>
          </>
        )}
      </button>
    );
  }

  // 卡片样式
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <CalendarDaysIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">每日签到</h3>
            <p className="text-sm text-gray-600">
              每日签到可获得 15 积分奖励
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {hasSignedToday ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircleIcon className="w-6 h-6" />
              <span className="font-medium">今日已签到</span>
            </div>
          ) : (
            <button
              onClick={handleSignin}
              disabled={loading}
              className="
                bg-blue-500 hover:bg-blue-600 text-white
                px-6 py-2 rounded-lg font-medium
                transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? '签到中...' : '立即签到'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 签到状态指示器（小型组件）
export const SigninIndicator: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [hasSignedToday, setHasSignedToday] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastSigninDate = localStorage.getItem('lastSigninDate');
    setHasSignedToday(lastSigninDate === today);
  }, []);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {hasSignedToday ? (
        <>
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-600">已签到</span>
        </>
      ) : (
        <>
          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
          <span className="text-xs text-gray-500">未签到</span>
        </>
      )}
    </div>
  );
};
