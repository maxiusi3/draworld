// 语言: TypeScript
// 说明: 错误边界高阶组件，单独文件以支持Fast Refresh

import React from 'react';
import { ErrorBoundary, Props as ErrorBoundaryProps } from './ErrorBoundary';

// 高阶组件版本
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
