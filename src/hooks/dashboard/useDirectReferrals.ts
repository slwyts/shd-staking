/**
 * @file hooks/dashboard/useDirectReferrals.ts
 * @description 查询当前用户链上直推成员列表。
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";

export function useDirectReferrals() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getDirectReferrals",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    referrals: (data as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}
