/**
 * @file types/staking.ts
 * @description 质押业务相关 TypeScript 类型定义。
 */

/** 质押周期枚举 */
export type StakingPeriod = 90 | 180 | 360;

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
  /** 本单绑定的直接上级 */
  referrer: `0x${string}`;
  /** 本单已释放给直接上级的 5% 奖励 */
  directReferralReward: bigint;
  /** 提前结算时追扣的直推奖励 */
  directReferralRecovered: bigint;
  /** 到期结算时转入 dead 的盈利税 */
  profitTaxBurned: bigint;
}

/** 团队极差奖励类型 */
export type TeamRewardType = 1 | 2 | 3 | 4;

/** 团队极差奖励释放记录 */
export interface TeamRewardGrant {
  id: number;
  recipient: `0x${string}`;
  source: `0x${string}`;
  sourcePositionId: number;
  rewardType: TeamRewardType;
  amount: bigint;
  period: StakingPeriod;
  startTime: number;
  endTime: number;
  claimed: bigint;
}

/** 质押操作参数 */
export interface StakeParams {
  /** 质押数量 (wei) */
  amount: bigint;
  /** 质押天数 */
  period: StakingPeriod;
}
