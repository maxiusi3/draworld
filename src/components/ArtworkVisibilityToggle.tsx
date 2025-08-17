import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useArtworkVisibility } from '../hooks/useArtworkVisibility';

interface ArtworkVisibilityToggleProps {
  artworkId: string;
  isPublic: boolean;
  onToggle?: (isPublic: boolean) => void;
  className?: string;
  showLabel?: boolean;
}

export function ArtworkVisibilityToggle({
  artworkId,
  isPublic,
  onToggle,
  className = '',
  showLabel = true,
}: ArtworkVisibilityToggleProps) {
  const { toggleVisibility, isLoading } = useArtworkVisibility();

  const handleToggle = async () => {
    const newVisibility = !isPublic;
    const result = await toggleVisibility(artworkId, newVisibility);
    
    if (result.success && onToggle) {
      onToggle(newVisibility);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
        transition-colors duration-200
        ${isPublic 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isPublic ? '点击设为私密' : '点击设为公开'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPublic ? (
        <EyeIcon className="w-4 h-4" />
      ) : (
        <EyeSlashIcon className="w-4 h-4" />
      )}
      
      {showLabel && (
        <span>
          {isLoading ? '切换中...' : isPublic ? '公开' : '私密'}
        </span>
      )}
    </button>
  );
}

// 简化版本，只显示图标
export function ArtworkVisibilityIcon({
  artworkId,
  isPublic,
  onToggle,
  className = '',
}: Omit<ArtworkVisibilityToggleProps, 'showLabel'>) {
  return (
    <ArtworkVisibilityToggle
      artworkId={artworkId}
      isPublic={isPublic}
      onToggle={onToggle}
      className={className}
      showLabel={false}
    />
  );
}

// 状态显示组件（不可点击）
export function ArtworkVisibilityStatus({
  isPublic,
  className = '',
}: {
  isPublic: boolean;
  className?: string;
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded
        ${isPublic 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-600'
        }
        ${className}
      `}
    >
      {isPublic ? (
        <EyeIcon className="w-3 h-3" />
      ) : (
        <EyeSlashIcon className="w-3 h-3" />
      )}
      <span>{isPublic ? '公开' : '私密'}</span>
    </div>
  );
}
