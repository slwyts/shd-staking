/**
 * @file hooks/staking/useStake.ts
 * @description 执行质押操作 Hook。
 *   封装质押合约的 stake 方法调用，处理交易发送与确认。
 */
"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import type { StakeParams } from "@/types/staking";

/**
 * useStake — 执行 SHD 质押
 * @returns 质押方法与交易状态
 */
export function useStake() {
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
   * 发起质押交易
   * @param params - 质押参数 (金额/周期/推荐人)
   */
  const stake = (params: StakeParams) => {
    writeContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "stake",
      args: [params.amount, BigInt(params.period)],
    });
  };

  return {
    /** 发起质押 */
    stake,
    /** 是否正在发送交易 */
    isSending,
    /** 是否正在链上确认 */
    isConfirming,
    /** 交易是否已确认成功 */
    isConfirmed,
    /** 交易哈希 */
    txHash,
    /** 发送错误 */
    sendError,
    /** 确认错误 */
    confirmError,
  };
}
