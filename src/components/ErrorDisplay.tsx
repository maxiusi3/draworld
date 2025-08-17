import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  WifiIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { ErrorType, ErrorInfo } from '../utils/errorHandler';

interface ErrorDisplayProps {
  error: ErrorInfo | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLoading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDetails?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryLoading = false,
  className = '',
  size = 'md',
  showIcon = true,
  showDetails = false,
}) => {
  // 标准化错误信息
  const errorInfo: ErrorInfo = typeof error === 'string' 
    ? { type: ErrorType.UNKNOWN, message: error, retryable: true }
    : error;

  // 获取错误图标
  const getErrorIcon = () => {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return WifiIcon;
      case ErrorType.AUTH:
        return ShieldExclamationIcon;
      case ErrorType.RATE_LIMIT:
        return ClockIcon;
      case ErrorType.SERVER:
        return ServerIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  // 获取错误颜色
  const getErrorColor = () => {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return 'text-orange-600';
      case ErrorType.AUTH:
        return 'text-purple-600';
      case ErrorType.RATE_LIMIT:
        return 'text-yellow-600';
      case ErrorType.SERVER:
        return 'text-red-600';
      default:
        return 'text-red-600';
    }
  };

  // 获取背景颜色
  const getBackgroundColor = () => {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return 'bg-orange-50 border-orange-200';
      case ErrorType.AUTH:
        return 'bg-purple-50 border-purple-200';
      case ErrorType.RATE_LIMIT:
        return 'bg-yellow-50 border-yellow-200';
      case ErrorType.SERVER:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  // 尺寸样式
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          icon: 'w-5 h-5',
          title: 'text-sm font-medium',
          message: 'text-xs',
          button: 'px-3 py-1 text-xs',
        };
      case 'lg':
        return {
          container: 'p-8',
          icon: 'w-12 h-12',
          title: 'text-xl font-semibold',
          message: 'text-base',
          button: 'px-6 py-3 text-base',
        };
      default: // md
        return {
          container: 'p-6',
          icon: 'w-8 h-8',
          title: 'text-lg font-semibold',
          message: 'text-sm',
          button: 'px-4 py-2 text-sm',
        };
    }
  };

  const ErrorIcon = getErrorIcon();
  const sizeStyles = getSizeStyles();

  return (
    <div className={`
      border rounded-lg ${getBackgroundColor()} ${sizeStyles.container} ${className}
    `}>
      <div className="flex items-start space-x-3">
        {/* 错误图标 */}
        {showIcon && (
          <div className="flex-shrink-0">
            <ErrorIcon className={`${sizeStyles.icon} ${getErrorColor()}`} />
          </div>
        )}

        {/* 错误内容 */}
        <div className="flex-1 min-w-0">
          {/* 错误标题 */}
          <h3 className={`${sizeStyles.title} ${getErrorColor()} mb-1`}>
            {getErrorTitle(errorInfo.type)}
          </h3>

          {/* 错误消息 */}
          <p className={`${sizeStyles.message} text-gray-700 mb-3`}>
            {errorInfo.message}
          </p>

          {/* 错误详情（开发模式或显式启用） */}
          {showDetails && errorInfo.details && (
            <details className="mb-3">
              <summary className="cursor-pointer text-xs text-gray-500 mb-1">
                错误详情
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 text-gray-600">
                {JSON.stringify(errorInfo.details, null, 2)}
              </pre>
            </details>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center space-x-3">
            {/* 重试按钮 */}
            {errorInfo.retryable && onRetry && (
              <button
                onClick={onRetry}
                disabled={retryLoading}
                className={`
                  ${sizeStyles.button} bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center space-x-2
                `}
              >
                <ArrowPathIcon className={`w-4 h-4 ${retryLoading ? 'animate-spin' : ''}`} />
                <span>{retryLoading ? '重试中...' : '重试'}</span>
              </button>
            )}

            {/* 关闭按钮 */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`
                  ${sizeStyles.button} bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                  transition-colors
                `}
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 获取错误标题
function getErrorTitle(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.NETWORK:
      return '网络连接错误';
    case ErrorType.AUTH:
      return '身份验证失败';
    case ErrorType.VALIDATION:
      return '输入验证错误';
    case ErrorType.SERVER:
      return '服务器错误';
    case ErrorType.NOT_FOUND:
      return '资源不存在';
    case ErrorType.PERMISSION:
      return '权限不足';
    case ErrorType.RATE_LIMIT:
      return '操作过于频繁';
    default:
      return '发生错误';
  }
}

// 预设的错误显示组件
export const NetworkError: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => (
  <ErrorDisplay
    error={{
      type: ErrorType.NETWORK,
      message: '网络连接失败，请检查网络连接后重试',
      retryable: true,
    }}
    {...props}
  />
);

export const AuthError: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => (
  <ErrorDisplay
    error={{
      type: ErrorType.AUTH,
      message: '身份验证失败，请重新登录',
      retryable: false,
    }}
    {...props}
  />
);

export const ServerError: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => (
  <ErrorDisplay
    error={{
      type: ErrorType.SERVER,
      message: '服务器暂时不可用，请稍后重试',
      retryable: true,
    }}
    {...props}
  />
);

export const NotFoundError: React.FC<Omit<ErrorDisplayProps, 'error'>> = (props) => (
  <ErrorDisplay
    error={{
      type: ErrorType.NOT_FOUND,
      message: '请求的资源不存在',
      retryable: false,
    }}
    {...props}
  />
);

// 内联错误显示（用于表单等）
export const InlineError: React.FC<{ message: string; className?: string }> = ({ 
  message, 
  className = '' 
}) => (
  <div className={`flex items-center space-x-2 text-red-600 text-sm ${className}`}>
    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
    <span>{message}</span>
  </div>
);

export default ErrorDisplay;
