/**
 * @file hooks/token/useTokenApproval.ts
 * @description 代币授权 (approve) Hook。
 *   检查当前授权额度，如不足则发起 approve 交易。
 */
"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC20_ABI } from "@/constants/abis/generated";
import { parseUnits } from "viem";

/**
 * useTokenApproval — 代币授权管理
 * @param tokenAddress - 代币合约地址
 * @param spender - 被授权的合约地址
 */
export function useTokenApproval(
  tokenAddress: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  const { address } = useAccount();

  // 查询当前授权额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !!spender,
    },
  });

  // 发起 approve 交易
  const {
    writeContract,
    data: txHash,
    isPending: isApproving,
  } = useWriteContract();

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  /**
   * 执行授权操作
   * @param amount - 授权金额 (可读数值字符串)
   * @param decimals - 代币精度
   */
  const approve = (amount: string, decimals: number = 18) => {
    if (!tokenAddress || !spender) return;
    const parsedAmount = parseUnits(amount, decimals);
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, parsedAmount],
    });
  };

  /**
   * 检查是否需要授权
   * @param requiredAmount - 需要的最小额度 (wei)
   */
  const needsApproval = (requiredAmount: bigint): boolean => {
    if (!tokenAddress || !spender) return true;
    if (!allowance) return true;
    return (allowance as bigint) < requiredAmount;
  };

  return {
    /** 当前授权额度 */
    allowance: allowance as bigint | undefined,
    /** 执行授权 */
    approve,
    /** 检查是否需要授权 */
    needsApproval,
    /** 是否正在发送授权交易 */
    isApproving,
    /** 是否正在确认 */
    isConfirming,
    /** 授权交易是否已确认 */
    isConfirmed,
    /** 交易哈希 */
    txHash,
    /** 刷新授权额度 */
    refetchAllowance,
  };
}
