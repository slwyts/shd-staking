"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

const VARIANTS = {
  primary:
    "bg-cyber-blue text-deep-space font-semibold hover:bg-cyber-blue/85 active:scale-[0.98]",
  secondary:
    "border border-white/15 text-text-primary hover:bg-white/5 active:scale-[0.98]",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-white/5",
  danger:
    "bg-error/15 border border-error/20 text-error hover:bg-error/25",
} as const;

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`cut-corners inline-flex items-center justify-center font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
      )}
      {children}
    </button>
  );
}
