/**
 * @file hooks/swap/useSwap.ts
 * @description 代币兑换操作 Hook。
 *   封装 SWAP 合约的兑换方法调用。
 *   当前为 placeholder，待 SWAP 合约对接后完善。
 */
"use client";

import { useState } from "react";

/**
 * useSwap — 代币兑换操作
 * @returns 兑换方法与交易状态
 */
export function useSwap() {
  const [isSending, setIsSending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();

  /**
   * 执行兑换
   * @param fromToken - 源代币地址
   * @param toToken - 目标代币地址
   * @param amount - 兑换数量 (wei)
   */
  const swap = async (
    fromToken: `0x${string}`,
    toToken: `0x${string}`,
    amount: bigint
  ) => {
    setIsSending(true);
    try {
      // TODO: 对接 SWAP 合约或 SWAP API
      // https://test-swap.bjwmls.com
      console.log("Swap:", { fromToken, toToken, amount: amount.toString() });

      // 模拟交易
      await new Promise((r) => setTimeout(r, 2000));
      setTxHash("0x" + "0".repeat(64));
      setIsConfirmed(true);
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  /** 重置状态 */
  const reset = () => {
    setIsSending(false);
    setIsConfirmed(false);
    setTxHash(undefined);
  };

  return {
    swap,
    isSending,
    isConfirmed,
    txHash,
    reset,
  };
}
