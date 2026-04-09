/**
 * @file hooks/token/useTokenBalance.ts
 * @description 查询 ERC20 代币余额 Hook。
 *   传入代币合约地址，自动查询当前连接钱包的代币余额。
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { SHD_TOKEN_ABI } from "@/constants/abis/SHDToken";

/**
 * useTokenBalance — 查询指定代币余额
 * @param tokenAddress - ERC20 代币合约地址
 * @returns 余额数据与加载状态
 */
export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: SHD_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    /** 代币余额 (wei 单位 BigInt) */
    balance: balance as bigint | undefined,
    /** 是否正在加载 */
    isLoading,
    /** 手动刷新余额 */
    refetch,
  };
}
