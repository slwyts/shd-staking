/**
 * @file utils/calc.ts
 * @description 收益计算工具函数 — 质押收益预估、盈利税计算等。
 */

/** 质押周期对应的日化收益率 (%) */
export const STAKING_DAILY_RATES: Record<number, number> = {
  90: 0.5,
  180: 1.0,
  360: 1.2,
};

/** 直推收益比例 */
export const REFERRAL_RATE = 0.05; // 5%

/** 到期结算盈利税比例，盈利部分 50% 转入 dead */
export const PROFIT_TAX_RATE = 0.5; // 50%

/**
 * 计算质押预估收益
 * @param amount - 质押金额
 * @param days - 质押天数 (90/180/360)
 * @returns 预估总收益
 */
export function calcStakingReward(amount: number, days: number): number {
  const dailyRate = getDailyRateForLockDays(days);
  if (!dailyRate) return 0;
  return amount * (dailyRate / 100) * days;
}

/**
 * 计算到期结算时用户实际获得的静态收益。
 */
export function calcNetSettlementReward(amount: number, days: number): number {
  return calcStakingReward(amount, days) * (1 - PROFIT_TAX_RATE);
}

/**
 * 根据锁仓天数匹配日化收益率
 */
export function getDailyRateForLockDays(days: number): number {
  return STAKING_DAILY_RATES[days] ?? 0;
}

