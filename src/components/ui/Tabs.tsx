"use client";

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
  return (
    <div className={`inline-flex border border-card-border bg-white/5 p-1 cut-corners ${className}`}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`cut-corners px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-cyber-blue/15 text-cyber-blue"
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
