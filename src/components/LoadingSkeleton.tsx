import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'list' | 'text' | 'circle' | 'rectangle';
  count?: number;
  height?: string;
  width?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rectangle',
  count = 1,
  height,
  width,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-64 w-full';
      case 'list':
        return 'h-20 w-full';
      case 'text':
        return 'h-4 w-3/4';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'rectangle':
      default:
        return height && width ? '' : 'h-4 w-full';
    }
  };

  const style = {
    ...(height && { height }),
    ...(width && { width }),
  };

  const skeletonElement = (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2 last:mb-0">
          {skeletonElement}
        </div>
      ))}
    </>
  );
};

// 预定义的骨架屏组件
export const ArtworkCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {/* 缩略图骨架 */}
    <LoadingSkeleton variant="card" className="aspect-video rounded-none" />
    
    {/* 内容骨架 */}
    <div className="p-4 sm:p-5 space-y-3">
      {/* 标题骨架 */}
      <LoadingSkeleton height="20px" width="85%" />
      <LoadingSkeleton height="16px" width="60%" />
      
      {/* 描述骨架 */}
      <div className="space-y-2">
        <LoadingSkeleton height="14px" width="100%" />
        <LoadingSkeleton height="14px" width="75%" />
      </div>
      
      {/* 创作者信息骨架 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <LoadingSkeleton variant="circle" className="w-4 h-4" />
          <LoadingSkeleton height="14px" width="80px" />
        </div>
        <LoadingSkeleton height="12px" width="60px" />
      </div>
      
      {/* 互动数据骨架 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <LoadingSkeleton variant="circle" className="w-4 h-4" />
            <LoadingSkeleton height="14px" width="20px" />
          </div>
          <div className="flex items-center space-x-1">
            <LoadingSkeleton variant="circle" className="w-4 h-4" />
            <LoadingSkeleton height="14px" width="20px" />
          </div>
        </div>
        <LoadingSkeleton height="20px" width="40px" className="rounded-full" />
      </div>
    </div>
  </div>
);

export const ArtworkListSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    <div className="flex flex-col sm:flex-row">
      {/* 缩略图骨架 */}
      <div className="sm:w-48 sm:h-32 h-48 bg-gray-200 animate-pulse flex-shrink-0" />
      
      {/* 内容骨架 */}
      <div className="flex-1 p-4 sm:p-6 space-y-3">
        <LoadingSkeleton height="20px" width="80%" />
        <div className="space-y-2">
          <LoadingSkeleton height="14px" width="100%" />
          <LoadingSkeleton height="14px" width="70%" />
        </div>
        
        <div className="flex items-center space-x-4 pt-2">
          <div className="flex items-center space-x-1">
            <LoadingSkeleton variant="circle" className="w-4 h-4" />
            <LoadingSkeleton height="14px" width="20px" />
          </div>
          <div className="flex items-center space-x-1">
            <LoadingSkeleton variant="circle" className="w-4 h-4" />
            <LoadingSkeleton height="14px" width="60px" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SearchResultsSkeleton: React.FC<{ viewMode: 'grid' | 'list'; count?: number }> = ({ 
  viewMode, 
  count = 6 
}) => (
  <div className={viewMode === 'grid' 
    ? 'grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'space-y-4'
  }>
    {Array.from({ length: count }).map((_, index) => (
      viewMode === 'grid' ? (
        <ArtworkCardSkeleton key={index} />
      ) : (
        <ArtworkListSkeleton key={index} />
      )
    ))}
  </div>
);

export default LoadingSkeleton;
