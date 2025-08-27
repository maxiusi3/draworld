'use client';

import React, { useState, useCallback, useRef } from 'react';
import { trackAction } from '@/lib/monitoring';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress: number;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  trackingComponent?: string;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const {
    initialLoading = false,
    onStart,
    onComplete,
    onError,
    trackingComponent = 'useLoadingState',
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: 0,
  });

  const startTimeRef = useRef<number | null>(null);

  const startLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
    }));
    
    startTimeRef.current = Date.now();
    onStart?.();
    trackAction('loading_started', trackingComponent);
  }, [onStart, trackingComponent]);

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
    }));

    if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      trackAction('loading_completed', trackingComponent, { duration });
    }

    onComplete?.();
  }, [onComplete, trackingComponent]);

  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error,
      progress: 0,
    }));

    if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      trackAction('loading_failed', trackingComponent, { 
        duration,
        error: error.message,
      });
    }

    onError?.(error);
  }, [onError, trackingComponent]);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      progress: 0,
    });
    startTimeRef.current = null;
  }, []);

  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    startLoading();
    
    try {
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  }, [startLoading, stopLoading, setError]);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    setProgress,
    reset,
    withLoading,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading,
        error: isLoading ? null : prev[key]?.error || null,
        progress: isLoading ? 0 : prev[key]?.progress || 0,
      },
    }));
  }, []);

  const setError = useCallback((key: string, error: Error | null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        error,
        progress: 0,
      },
    }));
  }, []);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.max(0, Math.min(100, progress)),
      },
    }));
  }, []);

  const getLoadingState = useCallback((key: string): LoadingState => {
    return loadingStates[key] || {
      isLoading: false,
      error: null,
      progress: 0,
    };
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const hasAnyError = useCallback(() => {
    return Object.values(loadingStates).some(state => state.error);
  }, [loadingStates]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setLoadingStates({});
    }
  }, []);

  return {
    loadingStates,
    setLoading,
    setError,
    setProgress,
    getLoadingState,
    isAnyLoading,
    hasAnyError,
    reset,
  };
}

// Hook for debounced loading state
export function useDebouncedLoading(delay = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show loading after delay
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
  };
}

// Hook for sequential loading steps
export function useStepLoading(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const startStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsLoading(true);
  }, []);

  const completeStep = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    
    // Move to next step if available
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      setIsLoading(false);
    }
  }, [steps.length]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsLoading(false);
    setCompletedSteps(new Set());
  }, []);

  const progress = (completedSteps.size / steps.length) * 100;

  return {
    currentStep,
    currentStepName: steps[currentStep],
    isLoading,
    completedSteps: Array.from(completedSteps),
    progress,
    startStep,
    completeStep,
    reset,
  };
}