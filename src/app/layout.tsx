/**
 * @file app/layout.tsx
 * @description 应用根布局。
 *   包裹 Web3Provider、Header 和 Footer，
 *   所有页面共享此布局结构。
 */
"use client";

import "@/styles/globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <Web3Provider>
          {/* 顶部导航栏（固定定位，高度 64px） */}
          <Header />
          {/* 主内容区，上方留出 Header 的高度 */}
          <div className="pt-16 md:pt-16">{children}</div>
          {/* 底部 */}
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
