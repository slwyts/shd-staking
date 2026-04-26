/**
 * @file hooks/dashboard/useMyRewards.ts
 * @description 查询用户累计收益 Hook。
 *   聚合用户的静态收益、动态收益 (直推 + 团队极差)。
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";

interface RewardsSummary {
  /** 静态收益累计 (质押利息) */
  staticReward: bigint;
  /** 直推收益累计 */
  referralReward: bigint;
  /** 团队极差收益累计 */
  teamReward: bigint;
  /** 到期结算已烧毁的静态盈利 */
  staticRewardBurned: bigint;
  /** 总收益 */
  totalReward: bigint;
}

/**
 * useMyRewards — 查询我的累计收益
 * @returns 收益汇总数据
 */
export function useMyRewards() {
  const { address } = useAccount();

  const { data: rawRewards, isLoading, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getRewardSummary",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const rewardSummary = rawRewards as
    | {
        staticReward: bigint;
        referralReward: bigint;
        teamRewardClaimed: bigint;
        teamRewardPending: bigint;
        staticRewardBurned: bigint;
        totalReward: bigint;
      }
    | undefined;

  const rewards: RewardsSummary = {
    staticReward: rewardSummary?.staticReward ?? BigInt(0),
    referralReward: rewardSummary?.referralReward ?? BigInt(0),
    teamReward:
      (rewardSummary?.teamRewardClaimed ?? BigInt(0)) +
      (rewardSummary?.teamRewardPending ?? BigInt(0)),
    staticRewardBurned: rewardSummary?.staticRewardBurned ?? BigInt(0),
    totalReward: rewardSummary?.totalReward ?? BigInt(0),
  };

  return {
    /** 收益汇总 */
    rewards,
    /** 是否正在加载 */
    isLoading,
    /** 是否已连接钱包 */
    isConnected: !!address,
    /** 手动刷新 */
    refetch,
  };
}
