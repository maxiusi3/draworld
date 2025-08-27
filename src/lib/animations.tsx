// Animation utilities and configurations for smooth transitions
import React from 'react';

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const EASING = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Framer Motion variants for common animations
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// CSS-based animation classes
export const animationClasses = {
  // Fade animations
  'fade-in': 'animate-[fadeIn_0.3s_ease-out]',
  'fade-out': 'animate-[fadeOut_0.3s_ease-out]',
  'fade-in-up': 'animate-[fadeInUp_0.3s_ease-out]',
  'fade-in-down': 'animate-[fadeInDown_0.3s_ease-out]',
  
  // Slide animations
  'slide-in-left': 'animate-[slideInLeft_0.3s_ease-out]',
  'slide-in-right': 'animate-[slideInRight_0.3s_ease-out]',
  'slide-out-left': 'animate-[slideOutLeft_0.3s_ease-out]',
  'slide-out-right': 'animate-[slideOutRight_0.3s_ease-out]',
  
  // Scale animations
  'scale-in': 'animate-[scaleIn_0.3s_ease-out]',
  'scale-out': 'animate-[scaleOut_0.3s_ease-out]',
  
  // Bounce animations
  'bounce-in': 'animate-[bounceIn_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]',
  
  // Rotation animations
  'rotate-in': 'animate-[rotateIn_0.3s_ease-out]',
  
  // Pulse animations
  'pulse-soft': 'animate-[pulseSoft_2s_ease-in-out_infinite]',
  
  // Shake animation for errors
  'shake': 'animate-[shake_0.5s_ease-in-out]',
} as const;

// Transition classes for hover effects
export const transitionClasses = {
  'transition-all': 'transition-all duration-300 ease-out',
  'transition-colors': 'transition-colors duration-200 ease-out',
  'transition-transform': 'transition-transform duration-200 ease-out',
  'transition-opacity': 'transition-opacity duration-200 ease-out',
  'transition-shadow': 'transition-shadow duration-200 ease-out',
} as const;

// Hover effect classes
export const hoverEffects = {
  'hover-lift': 'hover:transform hover:-translate-y-1 hover:shadow-lg',
  'hover-scale': 'hover:transform hover:scale-105',
  'hover-glow': 'hover:shadow-lg hover:shadow-pink-500/25',
  'hover-brighten': 'hover:brightness-110',
  'hover-fade': 'hover:opacity-80',
} as const;

// Loading animation keyframes (to be added to Tailwind config)
export const keyframes = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  fadeOut: {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  },
  fadeInUp: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  fadeInDown: {
    '0%': { opacity: '0', transform: 'translateY(-20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  slideInLeft: {
    '0%': { opacity: '0', transform: 'translateX(-20px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
  slideInRight: {
    '0%': { opacity: '0', transform: 'translateX(20px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
  slideOutLeft: {
    '0%': { opacity: '1', transform: 'translateX(0)' },
    '100%': { opacity: '0', transform: 'translateX(-20px)' },
  },
  slideOutRight: {
    '0%': { opacity: '1', transform: 'translateX(0)' },
    '100%': { opacity: '0', transform: 'translateX(20px)' },
  },
  scaleIn: {
    '0%': { opacity: '0', transform: 'scale(0.9)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  scaleOut: {
    '0%': { opacity: '1', transform: 'scale(1)' },
    '100%': { opacity: '0', transform: 'scale(0.9)' },
  },
  bounceIn: {
    '0%': { opacity: '0', transform: 'scale(0.3)' },
    '50%': { opacity: '1', transform: 'scale(1.05)' },
    '70%': { transform: 'scale(0.9)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  rotateIn: {
    '0%': { opacity: '0', transform: 'rotate(-180deg)' },
    '100%': { opacity: '1', transform: 'rotate(0deg)' },
  },
  pulseSoft: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.7' },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },
};

// Animation utility functions
export function createStaggeredAnimation(
  items: any[],
  baseDelay: number = 100
) {
  return items.map((item, index) => ({
    ...item,
    style: {
      ...item.style,
      animationDelay: `${index * baseDelay}ms`,
    },
  }));
}

export function getRandomDelay(min: number = 0, max: number = 500): string {
  const delay = Math.random() * (max - min) + min;
  return `${delay}ms`;
}

// Intersection Observer hook for scroll animations
export function useScrollAnimation(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Disconnect after first intersection to prevent re-triggering
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Prefers reduced motion check
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Animation wrapper component
interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: keyof typeof animationClasses;
  delay?: number;
  className?: string;
  triggerOnScroll?: boolean;
}

export function AnimatedElement({
  children,
  animation = 'fade-in-up',
  delay = 0,
  className = '',
  triggerOnScroll = false,
}: AnimatedElementProps) {
  const { ref, isVisible } = useScrollAnimation();
  const shouldAnimate = triggerOnScroll ? isVisible : true;
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${shouldAnimate ? animationClasses[animation] : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}