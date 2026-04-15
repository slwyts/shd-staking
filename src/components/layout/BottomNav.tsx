"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Lock, Users, Megaphone, UserCircle } from "lucide-react";

const NAV_ITEMS = [
  { label: "首页", href: "/", icon: Home },
  { label: "认购", href: "/staking", icon: Lock },
  { label: "团队", href: "/team", icon: Users },
  { label: "打新", href: "/news", icon: Megaphone },
  { label: "我的", href: "/dashboard", icon: UserCircle },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-card-border bg-deep-space/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1 transition-all duration-300 ${
                isActive ? "text-cyber-blue" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {isActive && (
                <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-cyber-blue shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                  style={{ animation: "slide-indicator 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
                />
              )}
              <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                <item.icon size={20} strokeWidth={1.5} />
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-cyber-blue/20 blur-md" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
