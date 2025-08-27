'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/accessibility';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick,
  as: Component = 'div',
}: CardProps) {
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = 'rounded-xl transition-all duration-200 ease-out';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    ghost: 'bg-gray-50 border border-transparent',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover && !prefersReducedMotion
    ? 'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]'
    : hover 
    ? 'hover:shadow-lg'
    : '';

  const clickableClasses = clickable
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2'
    : '';

  const cardClasses = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    clickableClasses,
    className
  );

  const commonProps = {
    className: cardClasses,
    onClick: clickable ? onClick : undefined,
    tabIndex: clickable ? 0 : undefined,
    role: clickable ? 'button' : undefined,
    onKeyDown: clickable ? (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    } : undefined,
  };

  return <Component {...commonProps}>{children}</Component>;
}

// Card header component
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

// Card title component
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ 
  children, 
  className, 
  as: Component = 'h3' 
}: CardTitleProps) {
  return (
    <Component className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </Component>
  );
}

// Card description component
interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600', className)}>
      {children}
    </p>
  );
}

// Card content component
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

// Card footer component
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}

// Animated card grid component
interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  staggerAnimation?: boolean;
}

export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className,
  staggerAnimation = true,
}: CardGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {React.Children.map(children, (child, index) => {
        if (!staggerAnimation || prefersReducedMotion) {
          return child;
        }

        return (
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

// Feature card component with icon
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  iconColor?: 'pink' | 'blue' | 'green' | 'purple' | 'yellow';
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  iconColor = 'pink',
}: FeatureCardProps) {
  const iconColorClasses = {
    pink: 'bg-pink-100 text-pink-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <Card hover className={className}>
      <CardContent>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
          iconColorClasses[iconColor]
        )}>
          {icon}
        </div>
        
        <CardTitle className="mb-2">
          {title}
        </CardTitle>
        
        <CardDescription>
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Stats card component
interface StatsCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  label,
  value,
  change,
  icon,
  className,
}: StatsCardProps) {
  return (
    <Card variant="elevated" className={className}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            
            {change && (
              <div className={cn(
                'flex items-center text-sm',
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}>
                <span className="mr-1">
                  {change.type === 'increase' ? '↗' : '↘'}
                </span>
                {Math.abs(change.value)}%
              </div>
            )}
          </div>
          
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}