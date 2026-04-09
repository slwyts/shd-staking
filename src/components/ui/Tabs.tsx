"use client";

import { useRef, useEffect, useState } from "react";

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className = "" }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(`[data-key="${activeKey}"]`);
    if (activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeKey]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex border border-card-border bg-white/5 p-1 cut-corners ${className}`}
    >
      <div
        className="absolute top-1 bottom-1 rounded bg-cyber-blue/15 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            data-key={item.key}
            onClick={() => onChange(item.key)}
            className={`relative z-10 cut-corners px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "text-cyber-blue"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
