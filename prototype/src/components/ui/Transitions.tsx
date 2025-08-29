'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Transition types
export type TransitionType = 
  | 'fade' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right'
  | 'scale'
  | 'rotate'
  | 'bounce';

export type TransitionDuration = 'fast' | 'normal' | 'slow';

interface TransitionProps {
  show: boolean;
  type?: TransitionType;
  duration?: TransitionDuration;
  delay?: number;
  className?: string;
  children: React.ReactNode;
  onEnter?: () => void;
  onExit?: () => void;
}

const transitionClasses = {
  fade: {
    enter: 'opacity-0',
    enterActive: 'opacity-100 transition-opacity',
    exit: 'opacity-100',
    exitActive: 'opacity-0 transition-opacity',
  },
  'slide-up': {
    enter: 'translate-y-full opacity-0',
    enterActive: 'translate-y-0 opacity-100 transition-all',
    exit: 'translate-y-0 opacity-100',
    exitActive: 'translate-y-full opacity-0 transition-all',
  },
  'slide-down': {
    enter: '-translate-y-full opacity-0',
    enterActive: 'translate-y-0 opacity-100 transition-all',
    exit: 'translate-y-0 opacity-100',
    exitActive: '-translate-y-full opacity-0 transition-all',
  },
  'slide-left': {
    enter: 'translate-x-full opacity-0',
    enterActive: 'translate-x-0 opacity-100 transition-all',
    exit: 'translate-x-0 opacity-100',
    exitActive: 'translate-x-full opacity-0 transition-all',
  },
  'slide-right': {
    enter: '-translate-x-full opacity-0',
    enterActive: 'translate-x-0 opacity-100 transition-all',
    exit: 'translate-x-0 opacity-100',
    exitActive: '-translate-x-full opacity-0 transition-all',
  },
  scale: {
    enter: 'scale-95 opacity-0',
    enterActive: 'scale-100 opacity-100 transition-all',
    exit: 'scale-100 opacity-100',
    exitActive: 'scale-95 opacity-0 transition-all',
  },
  rotate: {
    enter: 'rotate-180 opacity-0',
    enterActive: 'rotate-0 opacity-100 transition-all',
    exit: 'rotate-0 opacity-100',
    exitActive: 'rotate-180 opacity-0 transition-all',
  },
  bounce: {
    enter: 'scale-95 opacity-0',
    enterActive: 'scale-100 opacity-100 transition-all duration-300 ease-out',
    exit: 'scale-100 opacity-100',
    exitActive: 'scale-95 opacity-0 transition-all duration-200 ease-in',
  },
};

const durationClasses = {
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
};

export function Transition({
  show,
  type = 'fade',
  duration = 'normal',
  delay = 0,
  className,
  children,
  onEnter,
  onExit,
}: TransitionProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show && !isVisible) {
      // Entering
      setIsVisible(true);
      setIsEntering(true);
      
      const enterTimeout = setTimeout(() => {
        setIsEntering(false);
        onEnter?.();
      }, delay);

      return () => clearTimeout(enterTimeout);
    } else if (!show && isVisible) {
      // Exiting
      setIsExiting(true);
      onExit?.();
      
      const exitTimeout = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, 300 + delay);

      return () => clearTimeout(exitTimeout);
    }
  }, [show, isVisible, delay, onEnter, onExit]);

  if (!isVisible) return null;

  const transitions = transitionClasses[type];
  const durationClass = durationClasses[duration];

  const transitionClass = cn(
    isEntering ? transitions.enter : transitions.exit,
    isEntering ? transitions.enterActive : transitions.exitActive,
    durationClass,
    className
  );

  return (
    <div className={transitionClass} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Modal transition
interface ModalTransitionProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ModalTransition({
  show,
  onClose,
  children,
  className,
}: ModalTransitionProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, handleClose]);

  return (
    <Transition show={show && !isClosing} type="fade" duration="fast">
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        
        <Transition show={show && !isClosing} type="scale" duration="normal">
          <div className={cn('relative bg-white rounded-lg shadow-xl', className)}>
            {children}
          </div>
        </Transition>
      </div>
    </Transition>
  );
}