"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Wallet, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { dorNetwork } from "@/config/chains";
import { formatAddress } from "@/utils/format";

const subscribeHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function WalletButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const mounted = useSyncExternalStore(subscribeHydration, getClientSnapshot, getServerSnapshot);

  if (mounted && isConnected && address) {
    return (
      <div className="flex items-center gap-1 sm:gap-1.5">
        <div className="flex items-center gap-1 rounded-lg border border-accent-green/30 bg-accent-green/5 px-2 py-1.5 sm:gap-1.5 sm:px-3">
          <Wallet className="h-3 w-3 text-accent-green sm:h-3.5 sm:w-3.5" />
          <span className="font-mono text-[10px] text-accent-green sm:text-xs">{formatAddress(address)}</span>
        </div>
        <button
          type="button"
          onClick={() => disconnect()}
          disabled={isDisconnecting}
          className="flex items-center rounded-lg border border-card-border bg-white/5 p-1.5 text-text-muted transition-all hover:border-error/40 hover:bg-error/10 hover:text-error active:scale-95"
          aria-label="断开钱包"
        >
          <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  return (
    <button
      type="button"
      disabled={isConnecting || !injected}
      onClick={() => injected && connect({ connector: injected, chainId: dorNetwork.id })}
      className="flex items-center gap-1 rounded-lg border border-transparent bg-white/5 px-2 py-1.5 transition-all duration-200 hover:border-amber-orange/30 hover:bg-amber-orange/5 active:scale-95 disabled:opacity-50 sm:gap-1.5 sm:px-3"
    >
      <Wallet className="h-3 w-3 text-amber-orange sm:h-3.5 sm:w-3.5" />
      <span className="text-[10px] text-text-secondary sm:text-xs">
        {isConnecting ? "连接中..." : "连接钱包"}
      </span>
    </button>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-card-border bg-deep-space/80 px-3 py-2.5 backdrop-blur-md transition-all duration-300 animate-slide-down sm:px-5 sm:py-3">
      <Link href="/" className="group flex items-center gap-1.5 sm:gap-2">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-lg bg-cyber-blue shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] sm:h-7 sm:w-7">
          <Image src="/images/brand-logo.png" alt="SHD 品牌标志" fill className="object-cover" sizes="28px" priority />
        </div>
        <span className="text-[10px] font-semibold leading-tight text-text-primary transition-colors group-hover:text-cyber-blue sm:text-xs">可信数据空间酒类数据资产平台</span>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <WalletButton />
      </div>
    </header>
  );
}
