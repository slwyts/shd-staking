"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { dorNetwork } from "@/config/chains";
import { formatAddress } from "@/utils/format";

type ConnectButtonSize = "sm" | "md" | "lg";

export const heroCtaButtonClassName =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-cyber-blue px-8 py-3 text-base font-medium text-white transition-all hover:bg-cyber-blue/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

interface ConnectButtonProps {
  size?: ConnectButtonSize;
  className?: string;
  heroCta?: boolean;
}

export function ConnectButton({
  size = "sm",
  className = "",
  heroCta = false,
}: ConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const onConnect = () => {
    const connector = connectors[0];
    if (connector) connect({ connector, chainId: dorNetwork.id });
  };

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`rounded-lg border border-card-border bg-white/5 font-mono text-cyber-blue ${
          size === "lg" || heroCta ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
        }`}>
          {formatAddress(address)}
        </span>
        <Button variant="ghost" size={heroCta ? "lg" : size} className="gap-1" onClick={() => disconnect()}>
          <LogOut className="h-3.5 w-3.5" />断开
        </Button>
      </div>
    );
  }

  if (heroCta) {
    return (
      <button
        type="button"
        className={`${heroCtaButtonClassName} ${className}`}
        disabled={isPending}
        onClick={onConnect}
      >
        {isPending ? "连接中..." : <><Wallet className="mr-2 h-5 w-5" />连接钱包</>}
      </button>
    );
  }

  return (
    <div className={className}>
      <Button size={size} loading={isPending} className="gap-1.5" onClick={onConnect}>
        <Wallet className="h-4 w-4" />连接钱包
      </Button>
    </div>
  );
}
