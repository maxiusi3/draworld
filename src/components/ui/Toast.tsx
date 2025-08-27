'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useReducedMotion, announceToScreenReader } from '@/lib/accessibility';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Announce to screen readers
    announceToScreenReader(`${toast.type}: ${toast.title}`, 'assertive');

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Toast container component
function ToastContainer() {
  const { toasts } = useToast();
  const prefersReducedMotion = useReducedMotion();

  if (toasts.length === 0) return null;

  const containerContent = (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      aria-live="assertive"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </div>
  );

  return typeof window !== 'undefined'
    ? createPortal(containerContent, document.body)
    : null;
}

// Individual toast item component
interface ToastItemProps {
  toast: Toast;
  index: number;
  prefersReducedMotion: boolean;
}

function ToastItem({ toast, index, prefersReducedMotion }: ToastItemProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animation classes
  const animationClasses = !prefersReducedMotion
    ? isExiting
      ? 'animate-slide-out-right'
      : isVisible
      ? 'animate-slide-in-right'
      : 'opacity-0 translate-x-full'
    : '';

  // Type-specific styles
  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: '✅',
      iconBg: 'bg-green-100 text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: '❌',
      iconBg: 'bg-red-100 text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      iconBg: 'bg-yellow-100 text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100 text-blue-600',
    },
  };

  const style = typeStyles[toast.type];

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (prefersReducedMotion) {
      removeToast(toast.id);
    } else {
      setIsExiting(true);
      setTimeout(() => removeToast(toast.id), 300);
    }
  };

  return (
    <div
      className={cn(
        'bg-white border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out',
        style.bg,
        animationClasses
      )}
      style={{
        animationDelay: !prefersReducedMotion ? `${index * 100}ms` : undefined,
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3',
          style.iconBg
        )}>
          <span className="text-sm" aria-hidden="true">
            {style.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {toast.title}
          </h4>
          
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600">
              {toast.message}
            </p>
          )}

          {toast.action && (
            <div className="mt-3">
              <button
                onClick={toast.action.onClick}
                className="text-sm font-medium text-pink-600 hover:text-pink-500 transition-colors"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { addToast } = useToast();
  
  return (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'success',
      title,
      message,
      ...options,
    });
  };
}

export function useErrorToast() {
  const { addToast } = useToast();
  
  return (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'error',
      title,
      message,
      duration: 0, // Error toasts don't auto-dismiss by default
      ...options,
    });
  };
}

export function useWarningToast() {
  const { addToast } = useToast();
  
  return (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };
}

export function useInfoToast() {
  const { addToast } = useToast();
  
  return (title: string, message?: string, options?: Partial<Toast>) => {
    addToast({
      type: 'info',
      title,
      message,
      ...options,
    });
  };
}