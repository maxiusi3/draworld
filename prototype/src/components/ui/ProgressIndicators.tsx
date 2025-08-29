'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScreenReaderOnly } from './Accessibility';

// Multi-step progress indicator
interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function StepProgress({
  steps,
  currentStep,
  className,
  orientation = 'horizontal',
}: StepProgressProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      className={cn(
        'flex',
        isHorizontal ? 'space-x-8' : 'flex-col space-y-4',
        className
      )}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isError = step.status === 'error';

        return (
          <div
            key={step.id}
            className={cn(
              'flex items-center',
              !isHorizontal && 'flex-row'
            )}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                  isCompleted && !isError && 'border-pink-600 bg-pink-600 text-white',
                  isCurrent && !isError && 'border-pink-600 bg-white text-pink-600',
                  isError && 'border-red-600 bg-red-600 text-white',
                  !isCompleted && !isCurrent && !isError && 'border-gray-300 bg-white text-gray-500'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted && !isError ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : isError ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    isHorizontal ? 'ml-4 h-0.5 w-16' : 'mt-4 ml-4 h-16 w-0.5',
                    isCompleted ? 'bg-pink-600' : 'bg-gray-300'
                  )}
                />
              )}
            </div>

            <div className={cn('ml-4', !isHorizontal && 'flex-1')}>
              <div
                className={cn(
                  'text-sm font-medium',
                  isCurrent && 'text-pink-600',
                  isCompleted && 'text-gray-900',
                  isError && 'text-red-600',
                  !isCompleted && !isCurrent && !isError && 'text-gray-500'
                )}
              >
                {step.title}
              </div>
              {step.description && (
                <div className="text-sm text-gray-500">
                  {step.description}
                </div>
              )}
            </div>

            <ScreenReaderOnly>
              {isCompleted && 'Completed'}
              {isCurrent && 'Current step'}
              {isError && 'Error in this step'}
            </ScreenReaderOnly>
          </div>
        );
      })}
    </nav>
  );
}

// Circular progress indicator
interface CircularProgressProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showPercentage?: boolean;
  color?: 'pink' | 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

export function CircularProgress({
  progress,
  size = 'md',
  strokeWidth = 4,
  showPercentage = true,
  color = 'pink',
  className,
}: CircularProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const sizeMap = {
    sm: { size: 40, fontSize: 'text-xs' },
    md: { size: 60, fontSize: 'text-sm' },
    lg: { size: 80, fontSize: 'text-base' },
    xl: { size: 120, fontSize: 'text-lg' },
  };

  const colorMap = {
    pink: 'stroke-pink-600',
    blue: 'stroke-blue-600',
    green: 'stroke-green-600',
    yellow: 'stroke-yellow-600',
    red: 'stroke-red-600',
  };

  const { size: circleSize, fontSize } = sizeMap[size];
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={circleSize}
        height={circleSize}
        className="transform -rotate-90"
      >
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(colorMap[color], 'transition-all duration-500 ease-out')}
        />
      </svg>
      
      {showPercentage && (
        <div className={cn('absolute inset-0 flex items-center justify-center', fontSize)}>
          <span className="font-medium text-gray-900">
            {Math.round(animatedProgress)}%
          </span>
        </div>
      )}
      
      <ScreenReaderOnly>
        Progress: {Math.round(progress)} percent complete
      </ScreenReaderOnly>
    </div>
  );
}