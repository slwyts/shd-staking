/**
 * @file hooks/dashboard/useTeamInfo.ts
 * @description 查询团队业绩与 V 等级 Hook。
 *   从合约读取用户的大区/小区业绩、V 等级等团队数据。
 */
"use client";

import { useAccount, useReadContract } from "wagmi";
import { STAKING_POOL_ABI } from "@/constants/abis/StakingPool";
import { STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import type { TeamInfo, VLevel } from "@/types/team";

/**
 * useTeamInfo — 查询团队信息
 * @returns 团队数据与加载状态
 */
export function useTeamInfo() {
  const { address } = useAccount();

  const { data: rawTeam, isLoading, refetch } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: "getTeamInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 解析合约返回数据
  const teamInfo: TeamInfo | null = rawTeam
    ? {
        directCount: Number((rawTeam as { directCount: bigint }).directCount),
        totalMembers: Number((rawTeam as { totalMembers: bigint }).totalMembers),
        majorPerformance: (rawTeam as { majorPerformance: bigint }).majorPerformance,
        minorPerformance: (rawTeam as { minorPerformance: bigint }).minorPerformance,
        vLevel: Number((rawTeam as { vLevel: bigint }).vLevel) as VLevel,
        referralReward: (rawTeam as { referralReward: bigint }).referralReward,
        teamReward: (rawTeam as { teamReward: bigint }).teamReward,
      }
    : null;

  return {
    /** 团队信息 */
    teamInfo,
    /** 是否正在加载 */
    isLoading,
    /** 手动刷新 */
    refetch,
  };
}
