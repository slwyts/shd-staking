/**
 * @file components/layout/PageContainer.tsx
 * @description 页面通用容器组件。
 *   统一页面内容区域的最大宽度、内边距和间距。
 */
import { type ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** 额外的 CSS 类名 */
  className?: string;
}

/**
 * PageContainer — 页面内容容器
 * @param children - 页面内容
 * @param className - 额外的 CSS 类名
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main className={`mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-8 ${className}`}>
      {children}
    </main>
  );
}
