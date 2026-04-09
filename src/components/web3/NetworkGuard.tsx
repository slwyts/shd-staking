/**
 * @file components/web3/NetworkGuard.tsx
 * @description 网络检测守卫组件。
 *   如果用户连接的不是 DOR Network，显示提示并引导切换网络。
 */
"use client";

import { type ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { dorNetwork } from "@/config/chains";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface NetworkGuardProps {
  children: ReactNode;
}

/**
 * NetworkGuard — 网络守卫
 * 仅当用户连接到 DOR Network 时渲染子组件，否则提示切换
 */
export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  // 未连接钱包时直接渲染子组件（由各页面自行处理未连接状态）
  if (!isConnected) return <>{children}</>;

  // 已连接但链不匹配
  if (chainId !== dorNetwork.id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-sm text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">
            网络不匹配
          </h3>
          <p className="mb-6 text-sm text-text-secondary">
            请切换至 DOR Network 以使用本平台
          </p>
          <Button
            loading={isPending}
            onClick={() => switchChain({ chainId: dorNetwork.id })}
          >
            切换至 DOR Network
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
