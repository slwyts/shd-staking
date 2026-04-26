/**
 * @file hooks/dashboard/useTeamRewards.ts
 * @description 查询并领取团队奖励释放记录。
 */
"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import { useChainTime } from "@/hooks/common/useChainTime";
import type { TeamRewardGrant, StakingPeriod, TeamRewardType } from "@/types/staking";

function pendingOfGrant(grant: TeamRewardGrant, nowSec: number) {
  if (grant.claimed >= grant.amount) return BigInt(0);
  const vested = nowSec >= grant.endTime
    ? grant.amount
    : (grant.amount * BigInt(Math.max(0, nowSec - grant.startTime))) /
      BigInt(Math.max(1, grant.endTime - grant.startTime));

  return vested > grant.claimed ? vested - grant.claimed : BigInt(0);
}

export function useTeamRewards() {
  const { address } = useAccount();
  const { nowSec = 0 } = useChainTime();

  const { data, isLoading, refetch } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getTeamRewardGrants",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const grants = useMemo<TeamRewardGrant[]>(() => {
    const raw = data as Array<{
      id: bigint;
      recipient: `0x${string}`;
      source: `0x${string}`;
      sourcePositionId: bigint;
      rewardType: number;
      amount: bigint;
      period: bigint;
      startTime: bigint;
      endTime: bigint;
      claimed: bigint;
    }> | undefined;

    return raw?.map((grant) => ({
      id: Number(grant.id),
      recipient: grant.recipient,
      source: grant.source,
      sourcePositionId: Number(grant.sourcePositionId),
      rewardType: Number(grant.rewardType) as TeamRewardType,
      amount: grant.amount,
      period: Number(grant.period) as StakingPeriod,
      startTime: Number(grant.startTime),
      endTime: Number(grant.endTime),
      claimed: grant.claimed,
    })) ?? [];
  }, [data]);

  const pendingGrantIds = grants
    .filter((grant) => pendingOfGrant(grant, nowSec) > BigInt(0))
    .map((grant) => BigInt(grant.id));

  const pendingTotal = grants.reduce(
    (total, grant) => total + pendingOfGrant(grant, nowSec),
    BigInt(0),
  );

  const { writeContract, data: txHash, isPending: isClaimPending, reset } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const claimAll = () => {
    if (pendingGrantIds.length === 0) return;
    reset();
    writeContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "claimTeamRewards",
      args: [pendingGrantIds],
    });
  };

  return {
    grants,
    pendingTotal,
    pendingGrantIds,
    isLoading,
    isClaimPending,
    isClaimConfirming,
    isClaimed,
    claimAll,
    refetch,
  };
}
