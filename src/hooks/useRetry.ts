'use client';

import React, { useState, useCallback } from 'react';
import { errorHandler, RetryConfig } from '@/lib/errorHandler';
import { logError, trackAction } from '@/lib/monitoring';

interface UseRetryOptions extends Partial<RetryConfig> {
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
}

interface RetryState {
  isLoading: boolean;
  error: Error | null;
  attempt: number;
  isRetrying: boolean;
}

export function useRetry<T>(
  operation: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    attempt: 0,
    isRetrying: false,
  });

  const execute = useCallback(async (): Promise<T | undefined> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      attempt: 0,
      isRetrying: false,
    }));

    try {
      const result = await errorHandler.withRetry(
        operation,
        {
          maxRetries: options.maxRetries || 3,
          baseDelay: options.baseDelay || 1000,
          maxDelay: options.maxDelay || 10000,
          backoffFactor: options.backoffFactor || 2,
        },
        {
          component: 'useRetry',
          action: 'execute_operation',
        }
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      options.onSuccess?.();
      trackAction('retry_success', 'useRetry');
      
      return result;
    } catch (error) {
      const err = error as Error;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err,
      }));

      options.onError?.(err);
      logError('Retry operation failed', { error: err.message }, 'useRetry');
      
      throw err;
    }
  }, [operation, options]);

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (state.isLoading) return;

    setState(prev => ({
      ...prev,
      isRetrying: true,
      attempt: prev.attempt + 1,
    }));

    options.onRetry?.(state.attempt + 1);
    trackAction('manual_retry', 'useRetry', { attempt: state.attempt + 1 });

    return execute();
  }, [execute, state.isLoading, state.attempt, options]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      attempt: 0,
      isRetrying: false,
    });
  }, []);

  return {
    execute,
    retry,
    reset,
    ...state,
  };
}

// Hook for API calls with automatic retry
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  options: UseRetryOptions & {
    autoExecute?: boolean;
    dependencies?: any[];
  } = {}
) {
  const { autoExecute = false, dependencies = [], ...retryOptions } = options;
  
  const retry = useRetry(apiCall, retryOptions);

  // Auto-execute on mount or dependency change
  React.useEffect(() => {
    if (autoExecute) {
      retry.execute();
    }
  }, [autoExecute, ...dependencies]);

  return retry;
}

// Hook for form submissions with retry
export function useFormSubmission<T>(
  submitFn: (data: any) => Promise<T>,
  options: UseRetryOptions = {}
) {
  const [formData, setFormData] = useState<any>(null);
  
  const retry = useRetry(
    () => {
      if (!formData) {
        throw new Error('No form data to submit');
      }
      return submitFn(formData);
    },
    options
  );

  const submit = useCallback(async (data: any): Promise<T | undefined> => {
    setFormData(data);
    return retry.execute();
  }, [retry]);

  return {
    ...retry,
    submit,
  };
}

// Hook for file uploads with retry
export function useFileUpload(
  uploadFn: (file: File) => Promise<string>,
  options: UseRetryOptions = {}
) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const retry = useRetry(
    async () => {
      if (!file) {
        throw new Error('No file to upload');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const result = await uploadFn(file);
        setProgress(100);
        return result;
      } finally {
        clearInterval(progressInterval);
      }
    },
    {
      ...options,
      onError: (error) => {
        setProgress(0);
        options.onError?.(error);
      },
    }
  );

  const upload = useCallback(async (uploadFile: File): Promise<string | undefined> => {
    setFile(uploadFile);
    setProgress(0);
    return retry.execute();
  }, [retry]);

  return {
    ...retry,
    upload,
    progress,
  };
}