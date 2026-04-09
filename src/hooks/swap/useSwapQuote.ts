/**
 * @file hooks/swap/useSwapQuote.ts
 * @description 兑换报价/预估 Hook。
 *   根据输入金额计算预估输出、滑点扣税明细。
 */
"use client";

import { useMemo } from "react";
import { calcSlippage } from "@/utils/calc";

/**
 * useSwapQuote — 兑换报价计算
 * @param amount - 输入金额 (可读数值)
 * @param direction - 交易方向: "buy" 买入 SHD | "sell" 卖出 SHD
 * @returns 报价明细
 */
export function useSwapQuote(amount: number, direction: "buy" | "sell") {
  const quote = useMemo(() => {
    if (!amount || amount <= 0) {
      return {
        inputAmount: 0,
        outputAmount: 0,
        slippageTotal: 0,
        slippageRate: 3.5,
        details: null,
      };
    }

    const details = calcSlippage(amount, direction);

    return {
      /** 输入金额 */
      inputAmount: amount,
      /** 预估输出金额 (扣税后) */
      outputAmount: details.received,
      /** 滑点扣税总额 */
      slippageTotal: details.total,
      /** 滑点比例 (%) */
      slippageRate: 3.5,
      /** 扣税分配明细 */
      details,
    };
  }, [amount, direction]);

  return quote;
}
