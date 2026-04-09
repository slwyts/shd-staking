/**
 * @file hooks/dashboard/useMyRewards.ts
 * @description 查询用户累计收益 Hook。
 *   聚合用户的静态收益、动态收益 (直推 + 团队极差)。
 *   当前为模拟数据，待合约对接后替换。
 */
"use client";

import { useAccount } from "wagmi";

interface RewardsSummary {
  /** 静态收益累计 (质押利息) */
  staticReward: bigint;
  /** 直推收益累计 */
  referralReward: bigint;
  /** 团队极差收益累计 */
  teamReward: bigint;
  /** 总收益 */
  totalReward: bigint;
}

/**
 * useMyRewards — 查询我的累计收益
 * @returns 收益汇总数据
 */
export function useMyRewards() {
  const { address } = useAccount();

  // TODO: 替换为链上合约查询
  const rewards: RewardsSummary = {
    staticReward: BigInt(0),
    referralReward: BigInt(0),
    teamReward: BigInt(0),
    totalReward: BigInt(0),
  };

  return {
    /** 收益汇总 */
    rewards,
    /** 是否正在加载 */
    isLoading: false,
    /** 是否已连接钱包 */
    isConnected: !!address,
  };
}
