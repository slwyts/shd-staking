/**
 * @file hooks/staking/useUnstake.ts
 * @description 执行解除质押操作 Hook。
 *   封装质押合约的 unstake 方法，支持到期后解除质押。
 */
"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { STAKING_POOL_ABI } from "@/constants/abis/StakingPool";
import { STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";

/**
 * useUnstake — 解除质押
 * @returns 解除质押方法与交易状态
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
   * 发起解除质押交易
   * @param positionId - 质押持仓 ID
   */
  const unstake = (positionId: number) => {
    writeContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_POOL_ABI,
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
