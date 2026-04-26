/**
 * @file hooks/common/useChainTime.ts
 * @description Latest chain timestamp for time-dependent UI.
 */
"use client";

import { useMemo } from "react";
import { useBlock } from "wagmi";
import { dorNetwork } from "@/config/chains";

export function useChainTime() {
  const { data: block, isLoading, refetch } = useBlock({
    chainId: dorNetwork.id,
    blockTag: "latest",
    query: {
      refetchInterval: 5_000,
    },
  });

  const nowSec = useMemo(() => {
    if (block?.timestamp === undefined) return undefined;
    return Number(block.timestamp);
  }, [block?.timestamp]);

  return {
    nowSec,
    isLoading,
    refetch,
  };
}
