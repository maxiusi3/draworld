import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/accessibility";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  as?: "button" | "a" | "link";
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  ariaDescribedBy?: string;
};

const base =
"inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
  "bg-pink-500 hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/25 text-white focus:ring-pink-400 ring-offset-white",
  secondary:
  "bg-gray-200 hover:bg-gray-300 hover:shadow-md text-gray-900 focus:ring-gray-500 ring-offset-white",
  ghost:
  "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 ring-offset-white"
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg"
};

export function Button({
  as = "button",
  href,
  children,
  className = "",
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  leftIcon,
  rightIcon,
  type = "button",
  ariaLabel,
  ariaDescribedBy,
  ...props
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const cls = cn(
    base,
    variants[variant],
    sizes[size],
    loading && "cursor-wait",
    !prefersReducedMotion && "transform hover:scale-105 active:scale-95",
    className
  );

  const content = (
    <>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          data-testid="loading-spinner"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      <span>{loading ? loadingText : children}</span>
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  );

  if (as === "link" && href) {
    return (
      <Link 
        href={href} 
        className={cls} 
        onClick={onClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {content}
      </Link>
    );
  }
  
  if (as === "a" && href) {
    return (
      <a 
        href={href} 
        className={cls} 
        onClick={onClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {content}
      </a>
    );
  }
  
  return (
    <button 
      className={cls} 
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      {...props}
    >
      {content}
    </button>
  );
}