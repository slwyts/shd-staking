"use client";

import { type ReactNode, useCallback } from "react";
import { useInView } from "@/hooks/common/useInView";

type AnimationDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  direction?: AnimationDirection;
  delay?: number;
  duration?: number;
  as?: "section" | "div" | "li";
}

const directionMap: Record<AnimationDirection, { from: string }> = {
  up:    { from: "translate3d(0, 30px, 0)" },
  down:  { from: "translate3d(0, -24px, 0)" },
  left:  { from: "translate3d(30px, 0, 0)" },
  right: { from: "translate3d(-30px, 0, 0)" },
  scale: { from: "scale(0.92)" },
  fade:  { from: "none" },
};

export function AnimatedSection({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.6,
  as: Tag = "div",
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ threshold: 0.08 });

  const callbackRef = useCallback(
    (node: HTMLElement | null) => {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [ref],
  );

  const fromTransform = directionMap[direction].from;

  return (
    <Tag
      ref={callbackRef}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translate3d(0,0,0) scale(1)" : fromTransform,
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
