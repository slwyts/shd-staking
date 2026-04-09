/**
 * @file types/staking.ts
 * @description 质押业务相关 TypeScript 类型定义。
 */

/** 质押周期枚举 */
export type StakingPeriod = 7 | 30 | 180 | 360;

/** 质押池信息 */
export interface StakingPool {
  /** 质押天数 */
  days: StakingPeriod;
  /** 日化收益率 (%) */
  dailyRate: number;
  /** 当前池总质押量 */
  totalStaked: bigint;
  /** 是否开放 */
  isActive: boolean;
}

/** 用户质押持仓 */
export interface StakingPosition {
  /** 持仓 ID */
  id: number;
  /** 质押数量 (wei) */
  amount: bigint;
  /** 质押天数 */
  period: StakingPeriod;
  /** 质押开始时间 (Unix 秒) */
  startTime: number;
  /** 质押结束时间 (Unix 秒) */
  endTime: number;
  /** 已领取收益 */
  claimedReward: bigint;
  /** 待领取收益 */
  pendingReward: bigint;
  /** 是否已解除 */
  isUnstaked: boolean;
}

/** 质押操作参数 */
export interface StakeParams {
  /** 质押数量 (wei) */
  amount: bigint;
  /** 质押天数 */
  period: StakingPeriod;
  /** 推荐人地址 (可选) */
  referrer?: `0x${string}`;
}
