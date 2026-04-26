/**
 * @file hooks/staking/useUnstake.ts
 * @description 执行订单结算 Hook。
 *   封装 DApp 合约的 unstake 方法，支持提前结算或到期结算。
 */
"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";

/**
 * useUnstake — 订单结算
 * @returns 结算方法与交易状态
 */
export function useUnstake() {
  const {
    writeContract,
    data: txHash,
    isPending: isSending,
    error: sendError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /**
  * 发起订单结算交易
   * @param positionId - 质押持仓 ID
   */
  const unstake = (positionId: number) => {
    writeContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "unstake",
      args: [BigInt(positionId)],
    });
  };

  return {
    unstake,
    isSending,
    isConfirming,
    isConfirmed,
    txHash,
    sendError,
    confirmError,
  };
}
