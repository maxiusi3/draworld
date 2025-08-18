import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatErrorForBoundary } from '../utils/errorHandler';

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误
    console.error('[ERROR BOUNDARY]', formatErrorForBoundary(error, errorInfo));
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              页面出现错误
            </h2>

            <p className="text-gray-600 mb-6">
              抱歉，页面渲染时出现了问题。您可以尝试重新加载页面或联系技术支持。
            </p>

            {/* 错误详情（开发模式） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  错误详情 (开发模式)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>错误:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>堆栈:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                重试
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                刷新页面
              </button>
            </div>

            {/* 联系支持 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                如果问题持续存在，请{' '}
                <a
                  href="mailto:support@example.com"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  联系技术支持
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 高阶组件版本已移至 withErrorBoundary.tsx 文件

// 页面级错误边界
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // 可以在这里发送错误报告到监控服务
      console.error('[PAGE ERROR]', { error, errorInfo });
    }}
  >
    {children}
  </ErrorBoundary>
);

// 组件级错误边界（更轻量）
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ErrorBoundary
    fallback={fallback || (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 text-sm">组件加载失败</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
        >
          刷新页面
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);