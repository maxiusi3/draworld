'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { trackAction } from '@/lib/monitoring';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error?: Error;
}

interface OptimisticUpdateOptions<T> {
  optimisticUpdate: (current: T) => T;
  actualUpdate: () => Promise<T>;
  rollback?: (current: T) => T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
}

export function useOptimisticUpdate<T>(initialData: T) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
  });

  const rollbackRef = useRef<T | null>(null);

  const update = useCallback(async (options: OptimisticUpdateOptions<T>) => {
    const {
      optimisticUpdate,
      actualUpdate,
      rollback,
      onSuccess,
      onError,
    } = options;

    // Store current state for potential rollback
    rollbackRef.current = state.data;

    // Apply optimistic update
    const optimisticData = optimisticUpdate(state.data);
    setState({
      data: optimisticData,
      isOptimistic: true,
    });

    trackAction('optimistic_update_started', 'OptimisticUI');

    try {
      // Perform actual update
      const actualData = await actualUpdate();
      
      // Update with actual data
      setState({
        data: actualData,
        isOptimistic: false,
      });

      onSuccess?.(actualData);
      trackAction('optimistic_update_success', 'OptimisticUI');
    } catch (error) {
      // Rollback on error
      const rollbackData = rollback 
        ? rollback(rollbackRef.current!)
        : rollbackRef.current!;

      setState({
        data: rollbackData,
        isOptimistic: false,
        error: error as Error,
      });

      onError?.(error as Error, rollbackData);
      trackAction('optimistic_update_failed', 'OptimisticUI', { 
        error: (error as Error).message 
      });
    }
  }, [state.data]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      error: undefined,
    });
  }, [initialData]);

  return {
    ...state,
    update,
    reset,
  };
}

// Optimistic list operations
export function useOptimisticList<T extends { id: string }>(initialItems: T[]) {
  const optimistic = useOptimisticUpdate(initialItems);

  const addItem = useCallback(async (
    newItem: T,
    actualAdd: () => Promise<T>
  ) => {
    return optimistic.update({
      optimisticUpdate: (items) => [...items, newItem],
      actualUpdate: async () => {
        const actualItem = await actualAdd();
        return optimistic.data.map(item => 
          item.id === newItem.id ? actualItem : item
        );
      },
      rollback: (items) => items.filter(item => item.id !== newItem.id),
    });
  }, [optimistic]);

  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<T>,
    actualUpdate: () => Promise<T>
  ) => {
    return optimistic.update({
      optimisticUpdate: (items) => 
        items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        ),
      actualUpdate: async () => {
        const actualItem = await actualUpdate();
        return optimistic.data.map(item => 
          item.id === itemId ? actualItem : item
        );
      },
      rollback: (items) => items, // Keep original items on rollback
    });
  }, [optimistic]);

  const removeItem = useCallback(async (
    itemId: string,
    actualRemove: () => Promise<void>
  ) => {
    const itemToRemove = optimistic.data.find(item => item.id === itemId);
    
    return optimistic.update({
      optimisticUpdate: (items) => items.filter(item => item.id !== itemId),
      actualUpdate: async () => {
        await actualRemove();
        return optimistic.data.filter(item => item.id !== itemId);
      },
      rollback: (items) => 
        itemToRemove ? [...items, itemToRemove] : items,
    });
  }, [optimistic]);

  return {
    ...optimistic,
    addItem,
    updateItem,
    removeItem,
  };
}

// Optimistic counter component
interface OptimisticCounterProps {
  initialValue: number;
  onIncrement: () => Promise<number>;
  onDecrement: () => Promise<number>;
  className?: string;
}

export function OptimisticCounter({
  initialValue,
  onIncrement,
  onDecrement,
  className,
}: OptimisticCounterProps) {
  const optimistic = useOptimisticUpdate(initialValue);

  const handleIncrement = () => {
    optimistic.update({
      optimisticUpdate: (value) => value + 1,
      actualUpdate: onIncrement,
      rollback: (value) => value - 1,
    });
  };

  const handleDecrement = () => {
    optimistic.update({
      optimisticUpdate: (value) => value - 1,
      actualUpdate: onDecrement,
      rollback: (value) => value + 1,
    });
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={optimistic.isOptimistic}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        -
      </button>
      
      <span className={`font-medium ${optimistic.isOptimistic ? 'opacity-70' : ''}`}>
        {optimistic.data}
      </span>
      
      <button
        onClick={handleIncrement}
        disabled={optimistic.isOptimistic}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        +
      </button>
      
      {optimistic.error && (
        <span className="text-red-500 text-sm">Error</span>
      )}
    </div>
  );
}

// Optimistic like button
interface OptimisticLikeButtonProps {
  initialLiked: boolean;
  initialCount: number;
  onToggle: (liked: boolean) => Promise<{ liked: boolean; count: number }>;
  className?: string;
}

export function OptimisticLikeButton({
  initialLiked,
  initialCount,
  onToggle,
  className,
}: OptimisticLikeButtonProps) {
  const optimistic = useOptimisticUpdate({
    liked: initialLiked,
    count: initialCount,
  });

  const handleToggle = () => {
    const newLiked = !optimistic.data.liked;
    
    optimistic.update({
      optimisticUpdate: (state) => ({
        liked: newLiked,
        count: state.count + (newLiked ? 1 : -1),
      }),
      actualUpdate: () => onToggle(newLiked),
      rollback: (state) => ({
        liked: !newLiked,
        count: state.count + (newLiked ? -1 : 1),
      }),
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={optimistic.isOptimistic}
      className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors ${
        optimistic.data.liked
          ? 'bg-pink-100 text-pink-600'
          : 'bg-gray-100 text-gray-600'
      } hover:bg-opacity-80 disabled:opacity-50 ${className}`}
    >
      <svg
        className={`w-4 h-4 transition-transform ${
          optimistic.isOptimistic ? 'scale-110' : ''
        }`}
        fill={optimistic.data.liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{optimistic.data.count}</span>
    </button>
  );
}

// Optimistic form submission
interface OptimisticFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<T>;
  children: (props: {
    data: T;
    isSubmitting: boolean;
    error?: Error;
    updateField: (field: keyof T, value: any) => void;
    submit: () => void;
    reset: () => void;
  }) => React.ReactNode;
}

export function OptimisticForm<T extends Record<string, any>>({
  initialData,
  onSubmit,
  children,
}: OptimisticFormProps<T>) {
  const [formData, setFormData] = useState(initialData);
  const optimistic = useOptimisticUpdate(initialData);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const submit = useCallback(() => {
    optimistic.update({
      optimisticUpdate: () => formData,
      actualUpdate: () => onSubmit(formData),
    });
  }, [formData, onSubmit, optimistic]);

  const reset = useCallback(() => {
    setFormData(initialData);
    optimistic.reset();
  }, [initialData, optimistic]);

  return (
    <>
      {children({
        data: formData,
        isSubmitting: optimistic.isOptimistic,
        error: optimistic.error,
        updateField,
        submit,
        reset,
      })}
    </>
  );
}