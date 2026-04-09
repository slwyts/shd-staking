/**
 * @file hooks/common/useWallet.ts
 * @description 钱包连接状态封装 Hook。
 *   统一提供钱包地址、连接状态、连接/断开方法，
 *   避免各组件重复引入多个 wagmi hooks。
 */
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * useWallet — 钱包状态与操作的统一封装
 * @returns 钱包相关状态与方法
 */
export function useWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connect, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();

  /** 调用第一个可用连接器进行连接 */
  const connectWallet = () => {
    const connector = connectors[0];
    if (connector) connect({ connector });
  };

  return {
    /** 当前钱包地址 */
    address,
    /** 是否已连接 */
    isConnected,
    /** 是否正在连接中 */
    isConnecting: isConnecting || isConnectPending,
    /** 当前链 ID */
    chainId,
    /** 触发连接 */
    connectWallet,
    /** 断开连接 */
    disconnect,
    /** 所有可用连接器 */
    connectors,
  };
}
