/**
 * @file hooks/staking/useStakingRewards.ts
 * @description 查询与领取质押静态收益 Hook。
 *   查询指定持仓的待领取收益，并支持发起领取交易。
 */
"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { STAKING_POOL_ABI } from "@/constants/abis/StakingPool";
import { STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";

/**
 * useStakingRewards — 质押收益查询与领取
 * @param positionId - 质押持仓 ID
 * @returns 收益数据与领取方法
 */
export function useStakingRewards(positionId: number | undefined) {
  // 查询待领取收益
  const { data: pendingReward, refetch } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: "getPendingReward",
    args: positionId !== undefined ? [BigInt(positionId)] : undefined,
    query: {
      enabled: positionId !== undefined,
    },
  });

  // 领取收益交易
  const {
    writeContract,
    data: txHash,
    isPending: isClaiming,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isClaimed } =
    useWaitForTransactionReceipt({ hash: txHash });

  /** 发起领取收益交易 */
  const claimReward = () => {
    if (positionId === undefined) return;
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_POOL_ABI,
      functionName: "claimReward",
      args: [BigInt(positionId)],
    });
  };

  return {
    /** 待领取收益 (wei) */
    pendingReward: pendingReward as bigint | undefined,
    /** 领取收益 */
    claimReward,
    /** 是否正在领取 */
    isClaiming,
    /** 是否正在确认 */
    isConfirming,
    /** 是否已成功领取 */
    isClaimed,
    /** 刷新收益数据 */
    refetch,
  };
}
