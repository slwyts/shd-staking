/**
 * @file hooks/staking/useStakingPools.ts
 * @description 获取质押池信息 Hook。
 *   查询四个质押周期 (7/30/180/360天) 的池信息，
 *   包含日化收益率、总质押量等。
 */
"use client";

import { useMemo } from "react";
import type { StakingPool, StakingPeriod } from "@/types/staking";
import { STAKING_DAILY_RATES } from "@/utils/calc";

/** 质押周期列表 */
const PERIODS: StakingPeriod[] = [7, 30, 180, 360];

/**
 * useStakingPools — 获取所有质押池信息
 * @returns 质押池列表与加载状态
 */
export function useStakingPools() {
  // TODO: 替换为链上合约查询
  // 当前使用本地配置 + 模拟数据
  const pools = useMemo<StakingPool[]>(() => {
    return PERIODS.map((days) => ({
      days,
      dailyRate: STAKING_DAILY_RATES[days] ?? 0,
      totalStaked: BigInt(0),
      isActive: true,
    }));
  }, []);

  return {
    /** 质押池列表 */
    pools,
    /** 是否正在加载 */
    isLoading: false,
    /** 根据天数获取对应池信息 */
    getPool: (days: StakingPeriod) => pools.find((p) => p.days === days),
  };
}
