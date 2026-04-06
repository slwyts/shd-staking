/**
 * @file components/web3/ConnectButton.tsx
 * @description 钱包连接按钮组件。
 *   未连接时显示「连接钱包」，已连接时显示缩略地址和断开按钮。
 */
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/utils/format";

/**
 * ConnectButton — 钱包连接/断开按钮
 */
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // 已连接 — 显示地址 + 断开
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="cut-corners border border-card-border bg-white/5 px-3 py-1.5 text-xs font-mono text-cyber-blue">
          {formatAddress(address)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          断开
        </Button>
      </div>
    );
  }

  // 未连接 — 触发连接
  return (
    <Button
      size="sm"
      loading={isPending}
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
    >
      连接钱包
    </Button>
  );
}
