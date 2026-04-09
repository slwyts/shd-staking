/**
 * @file hooks/token/useTokenPrice.ts
 * @description 代币价格查询 Hook。
 *   通过 SWAP 接口或链上预言机获取代币的 SCNY 计价。
 *   当前为 placeholder 实现，待 SWAP 合约对接后完善。
 */
"use client";

import { useState, useEffect } from "react";

/**
 * useTokenPrice — 查询代币价格
 * @param symbol - 代币符号 (SHD / DHC / SCNY)
 * @returns 价格数据与加载状态
 */
export function useTokenPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // SCNY 恒定 1:1 CNY
    if (symbol === "SCNY") {
      setPrice(1);
      setIsLoading(false);
      return;
    }

    // TODO: 对接真实 SWAP 接口获取代币价格
    // 当前使用模拟数据
    const mockPrices: Record<string, number> = {
      SHD: 2.5,
      DHC: 0.8,
    };

    const timer = setTimeout(() => {
      setPrice(mockPrices[symbol] ?? 0);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [symbol]);

  return {
    /** 代币价格 (SCNY 计价) */
    price,
    /** 是否正在加载 */
    isLoading,
  };
}
