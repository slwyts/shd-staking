/**
 * @file utils/calc.ts
 * @description 收益计算工具函数 — 质押收益预估、盈利税计算等。
 */

/** 质押周期对应的日化收益率 (%) */
export const STAKING_DAILY_RATES: Record<number, number> = {
  7: 0.3,
  30: 0.5,
  180: 1.0,
  360: 1.2,
};

/** 直推收益比例 */
export const REFERRAL_RATE = 0.1; // 10%

/** 盈利税总比例 */
export const PROFIT_TAX_RATE = 0.3; // 30%

/**
 * 计算质押预估收益
 * @param amount - 质押金额
 * @param days - 质押天数 (7/30/180/360)
 * @returns 预估总收益
 */
export function calcStakingReward(amount: number, days: number): number {
  const dailyRate = STAKING_DAILY_RATES[days];
  if (!dailyRate) return 0;
  return amount * (dailyRate / 100) * days;
}

/**
 * 计算盈利税分配
 * @param profit - 盈利金额
 * @returns 各项税费分配明细
 */
export function calcProfitTax(profit: number) {
  const totalTax = profit * PROFIT_TAX_RATE;
  return {
    /** 总税费 */
    total: totalTax,
    /** LP 分红 (10%) */
    lpDividend: profit * 0.1,
    /** 营销费用 (10%) */
    marketing: profit * 0.1,
    /** 回购 SHD (10%) */
    buyback: profit * 0.1,
    /** 税后利润 */
    afterTax: profit - totalTax,
  };
}

/**
 * 计算买入/卖出滑点扣税
 * @param amount - 交易金额
 * @param direction - "buy" 买入 | "sell" 卖出
 * @returns 滑点扣税明细
 */
export function calcSlippage(amount: number, direction: "buy" | "sell") {
  const totalRate = 0.035; // 3.5%
  const total = amount * totalRate;

  if (direction === "buy") {
    return {
      total,
      lpDividend: amount * 0.015,   // 1.5% -> LP 分红
      burn: amount * 0.02,          // 2.0% -> 销毁
      received: amount - total,
    };
  }

  // 卖出
  return {
    total,
    lpDividend: amount * 0.015,     // 1.5% -> LP 分红
    marketing: amount * 0.015,      // 1.5% -> 营销补贴
    poolReturn: amount * 0.005,     // 0.5% -> 回流底池
    received: amount - total,
  };
}
