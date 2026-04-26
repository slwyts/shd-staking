/**
 * @file hooks/dashboard/useMyPositions.ts
 * @description 查询用户所有质押持仓 Hook。
 *   从质押合约读取当前用户的全部持仓列表。
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import type { StakingPosition, StakingPeriod } from "@/types/staking";

/**
 * useMyPositions — 查询我的质押持仓列表
 * @returns 持仓列表与加载状态
 */
export function useMyPositions() {
  const { address } = useAccount();

  const { data: rawPositions, isLoading, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getUserPositions",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 将合约返回的原始数据转换为类型化的持仓对象
  const positions: StakingPosition[] = rawPositions
    ? (rawPositions as Array<{
        id: bigint;
        amount: bigint;
        period: bigint;
        startTime: bigint;
        endTime: bigint;
        claimedReward: bigint;
        isUnstaked: boolean;
        referrer: `0x${string}`;
        directReferralReward: bigint;
        directReferralRecovered: bigint;
        profitTaxBurned: bigint;
      }>).map((p) => ({
        id: Number(p.id),
        amount: p.amount,
        period: Number(p.period) as StakingPeriod,
        startTime: Number(p.startTime),
        endTime: Number(p.endTime),
        claimedReward: p.claimedReward,
        pendingReward: BigInt(0),
        isUnstaked: p.isUnstaked,
        referrer: p.referrer,
        directReferralReward: p.directReferralReward,
        directReferralRecovered: p.directReferralRecovered,
        profitTaxBurned: p.profitTaxBurned,
      }))
    : [];

  return {
    /** 质押持仓列表 */
    positions,
    /** 活跃持仓 (未解除的) */
    activePositions: positions.filter((p) => !p.isUnstaked),
    /** 是否正在加载 */
    isLoading,
    /** 手动刷新 */
    refetch,
  };
}
