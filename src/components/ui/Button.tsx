"use client";

import { type ButtonHTMLAttributes, type ReactNode, type MouseEvent, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-cyber-blue text-white font-medium hover:bg-cyber-blue/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-[0.97]",
  secondary:
    "border border-card-border text-text-primary hover:bg-white/5 hover:border-cyber-blue/30 active:scale-[0.97]",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-white/5",
  danger:
    "bg-error/10 text-error hover:bg-error/20 hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]",
} as const;

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
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
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      const btn = btnRef.current;
      if (btn && (variant === "primary" || variant === "secondary")) {
        const rect = btn.getBoundingClientRect();
        const circle = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = `${size}px`;
        circle.style.left = `${e.clientX - rect.left - size / 2}px`;
        circle.style.top = `${e.clientY - rect.top - size / 2}px`;
        circle.className = "ripple-circle";
        btn.appendChild(circle);
        circle.addEventListener("animationend", () => circle.remove());
      }
      props.onClick?.(e);
    },
    [disabled, loading, variant, props]
  );

  return (
    <button
      ref={btnRef}
      disabled={disabled || loading}
      className={`btn-ripple inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
      onClick={handleClick}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
