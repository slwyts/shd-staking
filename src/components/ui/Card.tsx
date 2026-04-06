import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`glass-card p-6 ${hover ? "glass-card-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
