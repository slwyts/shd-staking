import { type ReactNode } from "react";

const VARIANTS = {
  blue: "bg-cyber-blue/10 text-cyber-blue border-cyber-blue/20",
  purple: "bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20",
  green: "bg-accent-green/10 text-accent-green border-accent-green/20",
  orange: "bg-amber-orange/10 text-amber-orange border-amber-orange/20",
  gray: "bg-white/5 text-text-secondary border-white/10",
} as const;

interface BadgeProps {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
  className?: string;
  pulse?: boolean;
}

export function Badge({ variant = "blue", children, className = "", pulse = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 hover:scale-105 ${VARIANTS[variant]} ${pulse ? "animate-glow-pulse" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
