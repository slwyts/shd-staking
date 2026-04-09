/**
 * @file providers/Web3Provider.tsx
 * @description Web3 全局 Provider 组件。
 *   包裹 WagmiProvider 和 TanStack QueryClientProvider，
 *   为整个应用提供钱包连接和链上数据查询能力。
 */
"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/wagmi";

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider — 应用顶层 Provider
 * @param children - 子组件树
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  // 使用 useState 确保 QueryClient 在 CSR 中只创建一次
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 链上数据缓存 30 秒后自动刷新
            staleTime: 30_000,
            // 失败后重试 2 次
            retry: 2,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
