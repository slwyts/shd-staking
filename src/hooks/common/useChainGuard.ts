/**
 * @file hooks/common/useChainGuard.ts
 * @description DOR 链检测与切换 Hook。
 *   检测当前钱包是否在 DOR Network 上，提供切换方法。
 */
"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { dorNetwork } from "@/config/chains";

/**
 * useChainGuard — 链网络守卫
 * @returns 链匹配状态与切换方法
 */
export function useChainGuard() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  /** 当前链是否为 DOR Network */
  const isCorrectChain = chainId === dorNetwork.id;

  /** 切换到 DOR Network */
  const switchToDor = () => {
    switchChain({ chainId: dorNetwork.id });
  };

  return {
    /** 是否已连接钱包 */
    isConnected,
    /** 当前链是否正确 */
    isCorrectChain,
    /** 是否正在切换中 */
    isSwitching,
    /** 切换到 DOR Network */
    switchToDor,
    /** 目标链信息 */
    targetChain: dorNetwork,
  };
}
