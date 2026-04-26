/**
 * @file hooks/staking/useStakingRewards.ts
 * @description 查询质押结算预估，并支持发起结算交易。
 */
"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";

/**
 * useStakingRewards — 质押结算预估与结算
 * @param positionId - 质押持仓 ID
 * @returns 结算预估与交易方法
 */
export function useStakingRewards(positionId: number | undefined) {
  const { data: settlementQuote, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getSettlementQuote",
    args: positionId !== undefined ? [BigInt(positionId)] : undefined,
    query: {
      enabled: positionId !== undefined,
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isSettling,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isSettled } =
    useWaitForTransactionReceipt({ hash: txHash });

  const quote = settlementQuote as
    | {
        early: boolean;
        principal: bigint;
        grossReward: bigint;
        userReward: bigint;
        burnAmount: bigint;
        directReferralRecovery: bigint;
        payout: bigint;
      }
    | undefined;

  /** 发起订单结算交易 */
  const settlePosition = () => {
    if (positionId === undefined) return;
    writeContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "unstake",
      args: [BigInt(positionId)],
    });
  };

  return {
    settlementQuote: quote,
    pendingReward: quote?.userReward,
    grossReward: quote?.grossReward,
    burnAmount: quote?.burnAmount,
    directReferralRecovery: quote?.directReferralRecovery,
    payout: quote?.payout,
    isEarlySettlement: quote?.early,
    settlePosition,
    isSettling,
    /** 是否正在确认 */
    isConfirming,
    /** 是否已成功结算 */
    isSettled,
    /** 刷新收益数据 */
    refetch,
  };
}
