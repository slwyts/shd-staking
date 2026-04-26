/**
 * @file hooks/dapp/useDappTokenAddress.ts
 * @description 从 DApp 入口合约读取生态代币地址。
 */
"use client";

import { useReadContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";

export function useDappTokenAddress() {
  const { data, isLoading, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "shd",
  });

  return {
    shdTokenAddress: data as `0x${string}` | undefined,
    isLoading,
    refetch,
  };
}