/**
 * @file components/layout/Header.tsx
 * @description 顶部导航栏组件。
 *   固定在页面顶部，包含 Logo、导航链接和钱包连接按钮。
 *   使用磨砂玻璃效果，科幻风格。
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/web3/ConnectButton";

/** 导航菜单项定义 */
const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "质押", href: "/staking" },
  { label: "仪表盘", href: "/dashboard" },
  { label: "兑换", href: "/swap" },
] as const;

/**
 * Header — 顶部导航栏
 * 固定定位 + 磨砂玻璃背景，响应式适配移动端
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-card-border bg-deep-space/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center cut-corners bg-cyber-blue">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold text-text-primary">SHD Staking</span>
        </Link>

        {/* 导航链接 — 桌面端 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cut-corners px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-cyber-blue bg-cyber-blue/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 钱包连接按钮 */}
        <ConnectButton />
      </div>

      {/* 移动端导航 */}
      <nav className="flex items-center justify-around border-t border-card-border px-2 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cut-corners px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-cyber-blue bg-cyber-blue/10"
                  : "text-text-secondary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
