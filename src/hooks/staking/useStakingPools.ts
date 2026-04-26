/**
 * @file hooks/staking/useStakingPools.ts
 * @description 获取质押池信息 Hook。
 *   查询三个质押周期 (90/180/360天) 的池信息，
 *   包含日化收益率、总质押量等。
 */
"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import type { StakingPool, StakingPeriod } from "@/types/staking";

/** 质押周期列表 */
const PERIODS: StakingPeriod[] = [90, 180, 360];

/**
 * useStakingPools — 获取所有质押池信息
 * @returns 质押池列表与加载状态
 */
export function useStakingPools() {
  const pool90 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(90)],
  });
  const pool180 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(180)],
  });
  const pool360 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(360)],
  });

  const pools = useMemo<StakingPool[]>(() => {
    const rawPools = [pool90.data, pool180.data, pool360.data] as Array<
      | { totalStaked: bigint; dailyRate: bigint; isActive: boolean }
      | undefined
    >;

    return PERIODS.map((days, index) => {
      const pool = rawPools[index];
      return {
        days,
        dailyRate: Number(pool?.dailyRate ?? BigInt(0)) / 100,
        totalStaked: pool?.totalStaked ?? BigInt(0),
        isActive: pool?.isActive ?? false,
      };
    });
  }, [pool90.data, pool180.data, pool360.data]);

  return {
    /** 质押池列表 */
    pools,
    /** 是否正在加载 */
    isLoading: pool90.isLoading || pool180.isLoading || pool360.isLoading,
    /** 根据天数获取对应池信息 */
    getPool: (days: StakingPeriod) => pools.find((p) => p.days === days),
  };
}
