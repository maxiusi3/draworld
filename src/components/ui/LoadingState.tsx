'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  size = 'md',
  variant = 'spinner',
  message,
  className,
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center',
    fullScreen && 'fixed inset-0 bg-white bg-opacity-80 z-50',
    !fullScreen && 'p-4',
    className
  );

  const renderSpinner = () => (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-pink-500',
        sizeClasses[size]
      )}
      data-testid="loading-spinner"
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1" data-testid="loading-dots">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-pink-500 rounded-full animate-pulse',
            size === 'sm' && 'w-1 h-1',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3',
            size === 'xl' && 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        'bg-pink-500 rounded-full animate-pulse',
        sizeClasses[size]
      )}
      data-testid="loading-pulse"
    />
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm" data-testid="loading-skeleton">
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {message && (
        <p className="mt-3 text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}

// Skeleton components for specific use cases
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} data-testid="text-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded animate-pulse',
            i === lines - 1 && 'w-3/4' // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border rounded-lg', className)} data-testid="card-skeleton">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
      </div>
      <TextSkeleton lines={2} />
    </div>
  );
}

export function ImageSkeleton({ 
  aspectRatio = 'square',
  className 
}: { 
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
}) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 rounded animate-pulse',
        aspectClasses[aspectRatio],
        className
      )}
      data-testid="image-skeleton"
    />
  );
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-10 bg-gray-200 rounded animate-pulse',
        className
      )}
      data-testid="button-skeleton"
    />
  );
}

// Loading overlay component
export function LoadingOverlay({
  isVisible,
  message,
  children,
}: {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {isVisible && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <LoadingState message={message} />
        </div>
      )}
    </div>
  );
}

// Progress bar component
export function ProgressBar({
  progress,
  message,
  className,
}: {
  progress: number;
  message?: string;
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)} data-testid="progress-bar">
      {message && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">{message}</span>
          <span className="text-sm font-medium text-gray-900">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}