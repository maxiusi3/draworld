// 语言: TypeScript
// 说明: 统一错误处理工具，提供一致的错误提示和重试机制

import { toast } from 'react-hot-toast';

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  retryable?: boolean;
  retryDelay?: number;
}

// 标准错误消息映射
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Network connection failed. Please check your internet connection.',
  [ErrorType.AUTH]: 'Authentication failed. Please log in again.',
  [ErrorType.VALIDATION]: 'Invalid input data. Please check your information.',
  [ErrorType.SERVER]: 'Server error occurred. Please try again later.',
  [ErrorType.NOT_FOUND]: 'Requested resource not found.',
  [ErrorType.PERMISSION]: 'You do not have permission to perform this action.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// 中文错误消息映射（用户友好）
const ERROR_MESSAGES_CN: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '网络连接失败，请检查网络连接',
  [ErrorType.AUTH]: '身份验证失败，请重新登录',
  [ErrorType.VALIDATION]: '输入信息有误，请检查后重试',
  [ErrorType.SERVER]: '服务器错误，请稍后重试',
  [ErrorType.NOT_FOUND]: '请求的资源不存在',
  [ErrorType.PERMISSION]: '您没有权限执行此操作',
  [ErrorType.RATE_LIMIT]: '操作过于频繁，请稍后再试',
  [ErrorType.UNKNOWN]: '发生未知错误，请重试',
};

// HTTP状态码到错误类型的映射
const STATUS_CODE_TO_ERROR_TYPE: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTH,
  403: ErrorType.PERMISSION,
  404: ErrorType.NOT_FOUND,
  429: ErrorType.RATE_LIMIT,
  500: ErrorType.SERVER,
  502: ErrorType.SERVER,
  503: ErrorType.SERVER,
  504: ErrorType.SERVER,
};

// 重试配置
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryConfig: RetryConfig;

  private constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  static getInstance(config?: Partial<RetryConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  // 解析错误信息
  parseError(error: any): ErrorInfo {
    // 网络错误
    if (!navigator.onLine) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES_CN[ErrorType.NETWORK],
        retryable: true,
        retryDelay: 2000,
      };
    }

    // Fetch API 错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES_CN[ErrorType.NETWORK],
        retryable: true,
        retryDelay: 2000,
      };
    }

    // HTTP 响应错误
    if (error.status) {
      const errorType = STATUS_CODE_TO_ERROR_TYPE[error.status] || ErrorType.UNKNOWN;
      return {
        type: errorType,
        message: error.message || ERROR_MESSAGES_CN[errorType],
        code: error.status.toString(),
        details: error.data,
        retryable: [ErrorType.NETWORK, ErrorType.SERVER, ErrorType.RATE_LIMIT].includes(errorType),
        retryDelay: errorType === ErrorType.RATE_LIMIT ? 5000 : 2000,
      };
    }

    // API 响应错误
    if (error.response) {
      const status = error.response.status;
      const errorType = STATUS_CODE_TO_ERROR_TYPE[status] || ErrorType.UNKNOWN;
      return {
        type: errorType,
        message: error.response.data?.message || ERROR_MESSAGES_CN[errorType],
        code: status.toString(),
        details: error.response.data,
        retryable: [ErrorType.NETWORK, ErrorType.SERVER, ErrorType.RATE_LIMIT].includes(errorType),
        retryDelay: errorType === ErrorType.RATE_LIMIT ? 5000 : 2000,
      };
    }

    // 自定义错误对象
    if (error.type && error.message) {
      return {
        type: error.type,
        message: error.message,
        code: error.code,
        details: error.details,
        retryable: error.retryable || false,
        retryDelay: error.retryDelay || 2000,
      };
    }

    // 默认错误
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || ERROR_MESSAGES_CN[ErrorType.UNKNOWN],
      retryable: true,
      retryDelay: 2000,
    };
  }

  // 显示错误提示
  showError(error: any, options?: { showToast?: boolean; customMessage?: string }) {
    const errorInfo = this.parseError(error);
    const message = options?.customMessage || errorInfo.message;

    if (options?.showToast !== false) {
      toast.error(message, {
        duration: 4000,
        position: 'top-center',
      });
    }

    // 记录错误日志
    console.error('[ERROR HANDLER]', {
      type: errorInfo.type,
      message: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
      originalError: error,
    });

    return errorInfo;
  }

  // 带重试的异步操作
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: {
      maxAttempts?: number;
      onRetry?: (attempt: number, error: ErrorInfo) => void;
      shouldRetry?: (error: ErrorInfo) => boolean;
    }
  ): Promise<T> {
    const maxAttempts = options?.maxAttempts || this.retryConfig.maxAttempts;
    let lastError: ErrorInfo;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error);

        // 检查是否应该重试
        const shouldRetry = options?.shouldRetry 
          ? options.shouldRetry(lastError)
          : lastError.retryable && attempt < maxAttempts;

        if (!shouldRetry) {
          throw lastError;
        }

        // 计算延迟时间
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
          this.retryConfig.maxDelay
        );

        // 调用重试回调
        if (options?.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // 创建重试按钮
  createRetryButton(
    onRetry: () => void,
    options?: {
      text?: string;
      className?: string;
      disabled?: boolean;
    }
  ) {
    return {
      text: options?.text || '重试',
      onClick: onRetry,
      className: `px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${options?.className || ''}`,
      disabled: options?.disabled || false,
    };
  }
}

// 便捷函数
export const errorHandler = ErrorHandler.getInstance();

// 快捷方法
export const showError = (error: any, customMessage?: string) => {
  return errorHandler.showError(error, { customMessage });
};

export const withRetry = <T>(
  operation: () => Promise<T>,
  options?: Parameters<ErrorHandler['withRetry']>[1]
) => {
  return errorHandler.withRetry(operation, options);
};

// React Hook 用法示例
export const useErrorHandler = () => {
  const handleError = (error: any, customMessage?: string) => {
    return errorHandler.showError(error, { customMessage });
  };

  const executeWithRetry = <T>(
    operation: () => Promise<T>,
    options?: Parameters<ErrorHandler['withRetry']>[1]
  ) => {
    return errorHandler.withRetry(operation, options);
  };

  return {
    handleError,
    executeWithRetry,
    createRetryButton: errorHandler.createRetryButton.bind(errorHandler),
  };
};

// 错误边界组件的错误信息格式化
export const formatErrorForBoundary = (error: Error, errorInfo: any) => {
  return {
    type: ErrorType.UNKNOWN,
    message: '页面渲染出错，请刷新页面重试',
    details: {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    },
    retryable: true,
  };
};
