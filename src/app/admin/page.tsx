/**
 * @file app/admin/page.tsx
 * @description 管理控制台 — DApp 资金池管理与用户数据导入。
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useAccount, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DAPP_ABI, ERC20_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import { appMode } from "@/config/appMode";
import { dorNetwork } from "@/config/chains";
import { useHydrated } from "@/hooks/common/useHydrated";
import { useDappTokenAddress } from "@/hooks/dapp/useDappTokenAddress";
import { useTokenApproval } from "@/hooks/token/useTokenApproval";
import type { StakingPeriod, StakingPosition } from "@/types/staking";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Loading";
import { formatAddress, formatTokenAmount } from "@/utils/format";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Copy,
  Info,
  PlusCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  XCircle,
} from "lucide-react";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
type RelationImportType = "referrers" | "levels" | "operationCenters";
type PoolPeriod = 90 | 180 | 360;

const POOL_PERIODS: PoolPeriod[] = [90, 180, 360];
const DEFAULT_POOL_DAILY_RATES: Record<PoolPeriod, string> = {
  90: "0.5",
  180: "1",
  360: "1.2",
};

const RELATION_IMPORT_OPTIONS: Array<{ key: RelationImportType; label: string }> = [
  { key: "referrers", label: "邀请关系" },
  { key: "levels", label: "用户级别" },
  { key: "operationCenters", label: "运营中心" },
];

const RELATION_IMPORT_META: Record<RelationImportType, { helper: string; placeholder: string; button: string }> = {
  referrers: {
    helper: "每行格式：邀请人地址,被邀请人地址。邀请人可填 0x0000000000000000000000000000000000000000 清空关系。",
    placeholder: `0xInviter,0xUser\n${ZERO_ADDRESS},0xUser2`,
    button: "导入邀请关系",
  },
  levels: {
    helper: "每行格式：用户地址,级别。级别 0=普通，1=区县，2=市，3=省。",
    placeholder: "0xUser,1\n0xUser2,3",
    button: "导入用户级别",
  },
  operationCenters: {
    helper: "每行格式：用户地址,是否运营中心。可填 true/false、1/0、是/否。",
    placeholder: "0xUser,true\n0xUser2,false",
    button: "导入运营中心",
  },
};

function parseOperationFlag(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "是"].includes(normalized)) return true;
  if (["", "false", "0", "no", "n", "否"].includes(normalized)) return false;
  return null;
}

function parseDailyRateBps(value: string) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0) throw new Error("请输入有效日补贴比例");
  return BigInt(Math.round(rate * 100));
}

function formatDateTime(timestamp: number) {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapPositions(rawPositions: unknown): StakingPosition[] {
  if (!rawPositions) return [];
  return (rawPositions as Array<{
    id: bigint;
    amount: bigint;
    period: bigint;
    dailyRate: bigint;
    startTime: bigint;
    endTime: bigint;
    claimedReward: bigint;
    isUnstaked: boolean;
    referrer: `0x${string}`;
    directReferralReward: bigint;
    directReferralRecovered: bigint;
    profitTaxBurned: bigint;
  }>).map((position) => ({
    id: Number(position.id),
    amount: position.amount,
    period: Number(position.period) as StakingPeriod,
    dailyRate: Number(position.dailyRate) / 100,
    startTime: Number(position.startTime),
    endTime: Number(position.endTime),
    claimedReward: position.claimedReward,
    isUnstaked: position.isUnstaked,
    referrer: position.referrer,
    directReferralReward: position.directReferralReward,
    directReferralRecovered: position.directReferralRecovered,
    profitTaxBurned: position.profitTaxBurned,
  }));
}

function parseImportRows(input: string) {
  return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) =>
    line.split(/[\s,，]+/).map((cell) => cell.trim()).filter(Boolean)
  );
}

function parseReferrerImport(input: string) {
  const users: `0x${string}`[] = [];
  const referrers: `0x${string}`[] = [];
  const rows = parseImportRows(input);

  rows.forEach((cells, index) => {
    const [referrer, user] = cells;
    if (!referrer || !isAddress(referrer)) throw new Error(`第 ${index + 1} 行邀请人地址格式不正确`);
    if (!user || !isAddress(user)) throw new Error(`第 ${index + 1} 行被邀请人地址格式不正确`);

    users.push(user as `0x${string}`);
    referrers.push(referrer as `0x${string}`);
  });

  return { users, referrers };
}

function parseLevelImport(input: string) {
  const users: `0x${string}`[] = [];
  const levels: number[] = [];
  const rows = parseImportRows(input);

  rows.forEach((cells, index) => {
    const [user, level] = cells;
    if (!user || !isAddress(user)) throw new Error(`第 ${index + 1} 行用户地址格式不正确`);

    const parsedLevel = Number(level);
    if (!Number.isInteger(parsedLevel) || parsedLevel < 0 || parsedLevel > 3) {
      throw new Error(`第 ${index + 1} 行用户级别必须是 0-3`);
    }

    users.push(user as `0x${string}`);
    levels.push(parsedLevel);
  });

  return { users, levels };
}

function parseOperationCenterImport(input: string) {
  const users: `0x${string}`[] = [];
  const enabled: boolean[] = [];
  const rows = parseImportRows(input);

  rows.forEach((cells, index) => {
    const [user, operation] = cells;
    if (!user || !isAddress(user)) throw new Error(`第 ${index + 1} 行用户地址格式不正确`);

    const parsedOperation = parseOperationFlag(operation ?? "");
    if (parsedOperation === null) throw new Error(`第 ${index + 1} 行运营中心字段格式不正确`);

    users.push(user as `0x${string}`);
    enabled.push(parsedOperation);
  });

  return { users, enabled };
}

function CopyAddressRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [address]);

  return (
    <div className="rounded-lg bg-white/[0.04] p-3 sm:p-4">
      <p className="mb-1.5 text-[10px] text-text-muted sm:text-xs">{label}</p>
      <div className="flex items-start justify-between gap-2">
        <code className="break-all font-mono text-[10px] leading-relaxed text-text-primary sm:text-xs">{address}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md p-1.5 text-text-secondary transition-colors hover:bg-white/10 hover:text-cyber-blue"
          aria-label="复制地址"
        >
          {copied ? <Check className="h-4 w-4 text-accent-green" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const hydrated = useHydrated();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const walletAddress = hydrated ? address : undefined;
  const walletChainId = hydrated ? chainId : undefined;
  const walletConnected = hydrated && isConnected && !!walletAddress;

  const onChain = walletConnected && walletChainId === dorNetwork.id;
  const { shdTokenAddress, isLoading: isShdAddressLoading } = useDappTokenAddress();

  const { data: ownerRaw, isLoading: isOwnerLoading, isError: isOwnerError } = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "owner",
  });
  const contractOwner = ownerRaw as `0x${string}` | undefined;
  const isAdmin = !!walletAddress && !!contractOwner && walletAddress.toLowerCase() === contractOwner.toLowerCase();

  const pool90 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(90)],
  });
  const pool180 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(180)],
  });
  const pool360 = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getPoolInfo",
    args: [BigInt(360)],
  });
  const poolReads = [pool90, pool180, pool360];
  const { refetch: refetchPool90 } = pool90;
  const { refetch: refetchPool180 } = pool180;
  const { refetch: refetchPool360 } = pool360;

  const [userQueryInput, setUserQueryInput] = useState("");
  const [inspectedUser, setInspectedUser] = useState<`0x${string}` | undefined>();
  const [userQueryMsg, setUserQueryMsg] = useState<string | null>(null);
  const [manualOrderUser, setManualOrderUser] = useState("");
  const [manualOrderAmount, setManualOrderAmount] = useState("");
  const [manualOrderPeriod, setManualOrderPeriod] = useState<PoolPeriod>(90);
  const [orderActionMsg, setOrderActionMsg] = useState<string | null>(null);

  const userReadEnabled = onChain && isAdmin && !!inspectedUser;
  const userReferrerRead = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "referrerOf",
    args: inspectedUser ? [inspectedUser] : undefined,
    query: { enabled: userReadEnabled },
  });
  const userTeamRead = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getTeamInfo",
    args: inspectedUser ? [inspectedUser] : undefined,
    query: { enabled: userReadEnabled },
  });
  const userRewardRead = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getRewardSummary",
    args: inspectedUser ? [inspectedUser] : undefined,
    query: { enabled: userReadEnabled },
  });
  const userPositionsRead = useReadContract({
    address: DAPP_CONTRACT_ADDRESS,
    abi: DAPP_ABI,
    functionName: "getUserPositions",
    args: inspectedUser ? [inspectedUser] : undefined,
    query: { enabled: userReadEnabled },
  });
  const { refetch: refetchUserPositions } = userPositionsRead;
  const { refetch: refetchUserTeam } = userTeamRead;
  const { refetch: refetchUserReward } = userRewardRead;

  const { data: poolBalanceRaw, isLoading: poolLoading } = useReadContract({
    address: shdTokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [DAPP_CONTRACT_ADDRESS],
    query: {
      enabled: onChain && !!shdTokenAddress,
    },
  });
  const poolBalance = poolBalanceRaw as bigint | undefined;

  const [fundAmount, setFundAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [poolMsg, setPoolMsg] = useState<string | null>(null);
  const [pendingFundAmount, setPendingFundAmount] = useState<bigint | null>(null);

  const [poolPeriod, setPoolPeriod] = useState<PoolPeriod>(90);
  const [poolDailyRate, setPoolDailyRate] = useState("0.5");
  const [poolConfigMsg, setPoolConfigMsg] = useState<string | null>(null);

  const {
    approve: approveFund,
    needsApproval: fundNeedsApproval,
    isApproving: isFundApproving,
    isConfirming: isFundApprovalConfirming,
    isConfirmed: isFundApprovalConfirmed,
    refetchAllowance: refetchFundAllowance,
  } = useTokenApproval(shdTokenAddress, DAPP_CONTRACT_ADDRESS);

  const {
    writeContract: writePoolContract,
    data: poolTxHash,
    isPending: isPoolPending,
    reset: resetPoolWrite,
  } = useWriteContract();
  const { isLoading: isPoolConfirming, isSuccess: isPoolSuccess } =
    useWaitForTransactionReceipt({ hash: poolTxHash });

  const {
    writeContract: writeConfigContract,
    data: configTxHash,
    isPending: isConfigPending,
    reset: resetConfigWrite,
  } = useWriteContract();
  const { isLoading: isConfigConfirming, isSuccess: isConfigSuccess } =
    useWaitForTransactionReceipt({ hash: configTxHash });

  const {
    writeContract: writeOrderContract,
    data: orderTxHash,
    isPending: isOrderPending,
    reset: resetOrderWrite,
  } = useWriteContract();
  const { isLoading: isOrderConfirming, isSuccess: isOrderSuccess } =
    useWaitForTransactionReceipt({ hash: orderTxHash });

  useEffect(() => {
    if (isFundApprovalConfirmed) void refetchFundAllowance();
    if (!isFundApprovalConfirmed || pendingFundAmount === null) return;
    if (!onChain || !isAdmin) return;
    setPoolMsg("授权成功，正在充入资金池…");
    resetPoolWrite();
    writePoolContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "fundRewards",
      args: [pendingFundAmount],
    });
    setPendingFundAmount(null);
  }, [isAdmin, isFundApprovalConfirmed, onChain, pendingFundAmount, refetchFundAllowance, resetPoolWrite, writePoolContract]);

  useEffect(() => {
    if (!isConfigSuccess) return;
    void refetchPool90();
    void refetchPool180();
    void refetchPool360();
  }, [isConfigSuccess, refetchPool90, refetchPool180, refetchPool360]);

  useEffect(() => {
    if (!isOrderSuccess) return;
    void refetchUserPositions();
    void refetchUserTeam();
    void refetchUserReward();
    void refetchPool90();
    void refetchPool180();
    void refetchPool360();
  }, [isOrderSuccess, refetchPool90, refetchPool180, refetchPool360, refetchUserPositions, refetchUserReward, refetchUserTeam]);

  const [relationImportType, setRelationImportType] = useState<RelationImportType>("referrers");
  const [relationInput, setRelationInput] = useState("");
  const [relationMsg, setRelationMsg] = useState<string | null>(null);
  const {
    writeContract: writeRelationImport,
    data: relationTxHash,
    isPending: isRelationPending,
    reset: resetRelationWrite,
  } = useWriteContract();
  const { isLoading: isRelationConfirming, isSuccess: isRelationSuccess } =
    useWaitForTransactionReceipt({ hash: relationTxHash });

  const handleImportRelations = useCallback(() => {
    setRelationMsg(null);
    resetRelationWrite();

    if (!walletConnected) { setRelationMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setRelationMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setRelationMsg("当前钱包不是管理员"); return; }

    try {
      if (relationImportType === "referrers") {
        const parsed = parseReferrerImport(relationInput);
        if (parsed.users.length === 0) throw new Error("请至少输入一行用户数据");
        writeRelationImport({
          address: DAPP_CONTRACT_ADDRESS,
          abi: DAPP_ABI,
          functionName: "batchSetReferrers",
          args: [parsed.referrers, parsed.users],
        });
        return;
      }

      if (relationImportType === "levels") {
        const parsed = parseLevelImport(relationInput);
        if (parsed.users.length === 0) throw new Error("请至少输入一行用户数据");
        writeRelationImport({
          address: DAPP_CONTRACT_ADDRESS,
          abi: DAPP_ABI,
          functionName: "batchSetUserLevels",
          args: [parsed.users, parsed.levels],
        });
        return;
      }

      const parsed = parseOperationCenterImport(relationInput);
      if (parsed.users.length === 0) throw new Error("请至少输入一行用户数据");
      writeRelationImport({
        address: DAPP_CONTRACT_ADDRESS,
        abi: DAPP_ABI,
        functionName: "batchSetOperationCenters",
        args: [parsed.users, parsed.enabled],
      });
    } catch (error) {
      setRelationMsg(error instanceof Error ? error.message : "导入内容格式不正确");
    }
  }, [isAdmin, onChain, relationImportType, relationInput, resetRelationWrite, walletConnected, writeRelationImport]);

  const handleFundPool = useCallback(() => {
    setPoolMsg(null);
    if (!walletAddress) { setPoolMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setPoolMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setPoolMsg("当前钱包不是管理员"); return; }
    if (!shdTokenAddress) { setPoolMsg("正在读取 SHD 合约地址，请稍后再试"); return; }
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) { setPoolMsg("请输入有效充币数量"); return; }

    const amount = parseEther(fundAmount);
    if (fundNeedsApproval(amount)) {
      setPendingFundAmount(amount);
      approveFund(fundAmount, 18);
      setPoolMsg("授权确认后将自动充入资金池");
      return;
    }

    resetPoolWrite();
    writePoolContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "fundRewards",
      args: [amount],
    });
  }, [approveFund, fundAmount, fundNeedsApproval, isAdmin, onChain, resetPoolWrite, shdTokenAddress, walletAddress, writePoolContract]);

  const handleWithdrawPool = useCallback(() => {
    setPoolMsg(null);
    if (!walletAddress) { setPoolMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setPoolMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setPoolMsg("当前钱包不是管理员"); return; }
    const recipient = (withdrawTo.trim() || walletAddress) as `0x${string}` | undefined;
    if (!recipient || !isAddress(recipient)) { setPoolMsg("提币地址格式不正确"); return; }
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) { setPoolMsg("请输入有效提币数量"); return; }

    resetPoolWrite();
    writePoolContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "withdrawShd",
      args: [recipient, parseEther(withdrawAmount)],
    });
  }, [isAdmin, onChain, resetPoolWrite, walletAddress, withdrawAmount, withdrawTo, writePoolContract]);

  const handleUpdatePool = useCallback(() => {
    setPoolConfigMsg(null);
    if (!walletConnected) { setPoolConfigMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setPoolConfigMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setPoolConfigMsg("当前钱包不是管理员"); return; }

    try {
      const dailyRateBps = parseDailyRateBps(poolDailyRate);
      resetConfigWrite();
      writeConfigContract({
        address: DAPP_CONTRACT_ADDRESS,
        abi: DAPP_ABI,
        functionName: "setPool",
        args: [BigInt(poolPeriod), dailyRateBps],
      });
    } catch (error) {
      setPoolConfigMsg(error instanceof Error ? error.message : "池子配置不正确");
    }
  }, [isAdmin, onChain, poolDailyRate, poolPeriod, resetConfigWrite, walletConnected, writeConfigContract]);

  const handleInspectUser = useCallback(() => {
    setUserQueryMsg(null);
    setOrderActionMsg(null);
    const user = userQueryInput.trim();
    if (!walletConnected) { setUserQueryMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setUserQueryMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setUserQueryMsg("当前钱包不是管理员"); return; }
    if (!user || !isAddress(user)) { setUserQueryMsg("用户地址格式不正确"); return; }

    setInspectedUser(user as `0x${string}`);
    setManualOrderUser(user);
  }, [isAdmin, onChain, userQueryInput, walletConnected]);

  const handleCreateManualOrder = useCallback(() => {
    setOrderActionMsg(null);
    if (!walletConnected) { setOrderActionMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setOrderActionMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setOrderActionMsg("当前钱包不是管理员"); return; }

    const user = manualOrderUser.trim();
    if (!user || !isAddress(user)) { setOrderActionMsg("用户地址格式不正确"); return; }
    if (!manualOrderAmount || isNaN(Number(manualOrderAmount)) || Number(manualOrderAmount) <= 0) {
      setOrderActionMsg("请输入有效订单数量");
      return;
    }

    try {
      resetOrderWrite();
      setInspectedUser(user as `0x${string}`);
      setUserQueryInput(user);
      writeOrderContract({
        address: DAPP_CONTRACT_ADDRESS,
        abi: DAPP_ABI,
        functionName: "adminCreatePosition",
        args: [user as `0x${string}`, parseEther(manualOrderAmount), BigInt(manualOrderPeriod)],
      });
    } catch (error) {
      setOrderActionMsg(error instanceof Error ? error.message : "订单创建失败");
    }
  }, [isAdmin, manualOrderAmount, manualOrderPeriod, manualOrderUser, onChain, resetOrderWrite, walletConnected, writeOrderContract]);

  const handleForceClosePosition = useCallback((positionId: number) => {
    setOrderActionMsg(null);
    if (!walletConnected) { setOrderActionMsg("请先连接管理员钱包"); return; }
    if (!onChain) { setOrderActionMsg(`请先切换至 ${dorNetwork.name}`); return; }
    if (!isAdmin) { setOrderActionMsg("当前钱包不是管理员"); return; }

    resetOrderWrite();
    writeOrderContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "forceClosePosition",
      args: [BigInt(positionId)],
    });
  }, [isAdmin, onChain, resetOrderWrite, walletConnected, writeOrderContract]);

  const inspectedPositions = useMemo(() => mapPositions(userPositionsRead.data), [userPositionsRead.data]);
  const activePrincipal = useMemo(
    () => inspectedPositions.reduce((total, position) => position.isUnstaked ? total : total + position.amount, BigInt(0)),
    [inspectedPositions]
  );
  const inspectedTeamInfo = userTeamRead.data as
    | { directCount: bigint; totalMembers: bigint; majorPerformance: bigint; minorPerformance: bigint; vLevel: bigint; operationCenter: boolean; referralReward: bigint; teamReward: bigint }
    | undefined;
  const inspectedRewardSummary = userRewardRead.data as
    | { staticReward: bigint; referralReward: bigint; teamRewardClaimed: bigint; teamRewardPending: bigint; teamRewardAllocated: bigint; staticRewardBurned: bigint; totalReward: bigint }
    | undefined;
  const inspectedReferrer = userReferrerRead.data as `0x${string}` | undefined;
  const userInfoLoading = userReferrerRead.isLoading || userTeamRead.isLoading || userRewardRead.isLoading || userPositionsRead.isLoading;

  const configBusy = isConfigPending || isConfigConfirming;
  const orderBusy = isOrderPending || isOrderConfirming;

  if (!hydrated || isOwnerLoading) {
    return (
      <PageContainer>
        <Card className="border-cyber-blue/20">
          <Skeleton className="mb-3 h-6 w-36" />
          <Skeleton className="h-16 w-full" />
        </Card>
      </PageContainer>
    );
  }

  if (isOwnerError || !contractOwner) {
    return (
      <PageContainer>
        <Card className="border-error/25">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-error sm:text-base">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            无法读取管理员权限
          </div>
          <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">
            请确认当前 DApp 合约地址和 {dorNetwork.name} RPC 可用后重试。
          </p>
        </Card>
      </PageContainer>
    );
  }

  if (!walletConnected) {
    return (
      <PageContainer>
        <Card className="border-amber-orange/25">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-orange sm:text-base">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            管理员权限验证
          </div>
          <p className="mb-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
            必须使用地址 {formatAddress(contractOwner)} 的钱包进入页面。
          </p>
          <CopyAddressRow label="管理员钱包地址" address={contractOwner} />
        </Card>
      </PageContainer>
    );
  }

  if (!onChain) {
    return (
      <PageContainer>
        <Card className="border-error/25">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-orange sm:text-base">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            网络不匹配
          </div>
          <p className="mb-4 text-xs leading-relaxed text-text-secondary sm:text-sm">
            当前钱包不在 {dorNetwork.name}。管理操作必须在 Chain ID {dorNetwork.id} 上执行。
          </p>
          <Button loading={isSwitchingChain} onClick={() => switchChain({ chainId: dorNetwork.id })}>
            切换至 {dorNetwork.name}
          </Button>
        </Card>
      </PageContainer>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer>
        <Card className="border-error/25">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-error sm:text-base">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            权限错误
          </div>
          <p className="mb-3 text-xs leading-relaxed text-text-secondary sm:text-sm">
            必须使用地址 {formatAddress(contractOwner)} 的钱包进入页面。
          </p>
          <div className="mb-3 rounded-lg bg-white/[0.04] p-3 text-[10px] text-text-muted sm:text-xs">
            当前钱包：{formatAddress(walletAddress ?? "")}
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyber-blue/15 text-cyber-blue sm:h-11 sm:w-11">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-cyber-blue sm:text-xl">管理控制台</h1>
            <p className="text-[10px] text-text-muted sm:text-xs">资金池 &amp; 用户关系管理</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            返回我的页面
          </Button>
        </Link>
      </div>

      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
        <Card className="border-cyber-blue/20 shadow-[0_0_24px_rgba(59,130,246,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyber-blue sm:text-base">
            <Info className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            合约信息
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <p className="mb-1.5 text-[10px] text-text-muted sm:text-xs">当前 DApp 模式 / 目标链</p>
              <p className="font-mono text-xs text-text-primary sm:text-sm">
                {appMode} / {dorNetwork.name} / Chain ID {dorNetwork.id}
              </p>
            </div>
            <CopyAddressRow label="DApp 合约地址" address={DAPP_CONTRACT_ADDRESS} />
            <CopyAddressRow label="管理员钱包地址" address={contractOwner} />
            {isShdAddressLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : shdTokenAddress ? (
              <CopyAddressRow label="SHD 代币地址（DApp 读取）" address={shdTokenAddress} />
            ) : (
              <div className="rounded-lg bg-white/[0.04] p-3 text-xs text-text-muted sm:p-4">暂未读取到 SHD 代币地址</div>
            )}
            <div className="rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <p className="mb-1 text-[10px] text-text-muted sm:text-xs">合约池余额（SHD）</p>
              {!onChain ? (
                <p className="text-xs text-text-muted">请连接钱包并切换至 {dorNetwork.name} 后查询</p>
              ) : poolLoading || isShdAddressLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <p className="font-mono text-lg font-semibold text-accent-green sm:text-xl">
                  {formatTokenAmount(poolBalance ?? BigInt(0), 18, 2)} SHD
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.09s", animationFillMode: "forwards" }}>
        <Card className="border-accent-green/25 shadow-[0_0_28px_rgba(16,185,129,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <ArrowDownToLine className="h-4 w-4 text-accent-green sm:h-5 sm:w-5" />
            资金池管理
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-accent-green sm:text-sm">
                <ArrowDownToLine className="h-4 w-4" />
                充入收益资金
              </div>
              <input
                type="text"
                placeholder="10000"
                value={fundAmount}
                onChange={(event) => {
                  setFundAmount(event.target.value);
                  setPoolMsg(null);
                }}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
              <Button
                className="w-full"
                loading={isFundApproving || isFundApprovalConfirming || isPoolPending || isPoolConfirming}
                onClick={handleFundPool}
              >
                {isFundApproving ? "等待授权签名..." : isFundApprovalConfirming ? "授权确认中..." : "充入资金池"}
              </Button>
            </div>
            <div className="space-y-3 rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-orange sm:text-sm">
                <ArrowUpFromLine className="h-4 w-4" />
                提取合约余额
              </div>
              <input
                type="text"
                placeholder={walletAddress ?? "0x..."}
                value={withdrawTo}
                onChange={(event) => {
                  setWithdrawTo(event.target.value);
                  setPoolMsg(null);
                }}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
              <input
                type="text"
                placeholder="10000"
                value={withdrawAmount}
                onChange={(event) => {
                  setWithdrawAmount(event.target.value);
                  setPoolMsg(null);
                }}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
              <Button
                variant="secondary"
                className="w-full"
                loading={isPoolPending || isPoolConfirming}
                onClick={handleWithdrawPool}
              >
                提取 SHD
              </Button>
            </div>
          </div>
          {poolMsg && <p className="mt-3 text-xs text-amber-orange">{poolMsg}</p>}
          {isPoolSuccess && <p className="mt-3 text-xs text-accent-green">资金池交易已确认</p>}
        </Card>
      </section>

      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.12s", animationFillMode: "forwards" }}>
        <Card className="border-cyber-blue/25 shadow-[0_0_28px_rgba(59,130,246,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <SlidersHorizontal className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
            认购池管理
          </div>
          <div className="grid gap-3 rounded-lg bg-white/[0.04] p-3 sm:grid-cols-[1fr_1fr_auto] sm:p-4">
            <div className="space-y-1.5 text-xs text-text-muted">
              <span>周期</span>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white/[0.04] p-1">
                {POOL_PERIODS.map((period, index) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      const pool = poolReads[index].data as { totalStaked: bigint; dailyRate: bigint } | undefined;
                      setPoolPeriod(period);
                      setPoolDailyRate(pool ? String(Number(pool.dailyRate) / 100) : DEFAULT_POOL_DAILY_RATES[period]);
                      setPoolConfigMsg(null);
                    }}
                    className={`rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      poolPeriod === period
                        ? "bg-cyber-blue text-white"
                        : "text-text-muted hover:bg-white/10 hover:text-text-primary"
                    }`}
                  >
                    {period} 天
                  </button>
                ))}
              </div>
            </div>
            <label className="space-y-1.5 text-xs text-text-muted">
              <span>日补贴（%）</span>
              <input
                type="text"
                placeholder="0.5"
                value={poolDailyRate}
                onChange={(event) => {
                  setPoolDailyRate(event.target.value);
                  setPoolConfigMsg(null);
                }}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </label>
            <div className="flex items-end">
              <Button className="w-full sm:w-auto" loading={configBusy} onClick={handleUpdatePool}>保存日补贴</Button>
            </div>
          </div>
          {poolConfigMsg && <p className="mt-3 text-xs text-amber-orange">{poolConfigMsg}</p>}
          {isConfigSuccess && <p className="mt-3 text-xs text-accent-green">管理配置交易已确认</p>}
        </Card>
      </section>

      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.14s", animationFillMode: "forwards" }}>
        <Card className="border-amber-orange/25 shadow-[0_0_28px_rgba(245,158,11,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Search className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" />
            用户订单管理
          </div>
          <div className="grid gap-3 rounded-lg bg-white/[0.04] p-3 sm:grid-cols-[1fr_auto] sm:p-4">
            <input
              type="text"
              placeholder="输入用户钱包地址"
              value={userQueryInput}
              onChange={(event) => {
                setUserQueryInput(event.target.value);
                setUserQueryMsg(null);
              }}
              className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
            />
            <Button loading={userInfoLoading} onClick={handleInspectUser}>
              查询用户
            </Button>
          </div>
          {userQueryMsg && <p className="mt-3 text-xs text-error">{userQueryMsg}</p>}

          {inspectedUser && (
            <div className="mt-4 space-y-4">
              {userInfoLoading ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">用户地址</p>
                    <p className="break-all font-mono text-xs text-text-primary">{inspectedUser}</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">上级地址</p>
                    <p className="break-all font-mono text-xs text-text-primary">
                      {inspectedReferrer && inspectedReferrer !== ZERO_ADDRESS ? inspectedReferrer : "未绑定"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">级别 / 运营中心</p>
                    <p className="text-xs font-semibold text-text-primary sm:text-sm">
                      V{Number(inspectedTeamInfo?.vLevel ?? BigInt(0))} / {inspectedTeamInfo?.operationCenter ? "是" : "否"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">活跃本金</p>
                    <p className="font-mono text-xs font-semibold text-accent-green sm:text-sm">{formatTokenAmount(activePrincipal, 18, 2)} SHD</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">直推 / 团队人数</p>
                    <p className="font-mono text-xs text-text-primary sm:text-sm">
                      {Number(inspectedTeamInfo?.directCount ?? BigInt(0))} / {Number(inspectedTeamInfo?.totalMembers ?? BigInt(0))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">大小区业绩</p>
                    <p className="font-mono text-xs text-text-primary sm:text-sm">
                      {formatTokenAmount(inspectedTeamInfo?.majorPerformance ?? BigInt(0), 18, 2)} / {formatTokenAmount(inspectedTeamInfo?.minorPerformance ?? BigInt(0), 18, 2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">已发收益</p>
                    <p className="font-mono text-xs text-text-primary sm:text-sm">
                      {formatTokenAmount(inspectedRewardSummary?.totalReward ?? BigInt(0), 18, 2)} SHD
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] p-3">
                    <p className="mb-1 text-[10px] text-text-muted sm:text-xs">订单数量</p>
                    <p className="font-mono text-xs text-text-primary sm:text-sm">{inspectedPositions.length}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3 rounded-lg bg-white/[0.04] p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-accent-green sm:text-sm">
                    <PlusCircle className="h-4 w-4" />
                    新增订单
                  </div>
                  <input
                    type="text"
                    placeholder="用户钱包地址"
                    value={manualOrderUser}
                    onChange={(event) => {
                      setManualOrderUser(event.target.value);
                      setOrderActionMsg(null);
                    }}
                    className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
                  />
                  <input
                    type="text"
                    placeholder="订单数量，例如 1000"
                    value={manualOrderAmount}
                    onChange={(event) => {
                      setManualOrderAmount(event.target.value);
                      setOrderActionMsg(null);
                    }}
                    className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
                  />
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-white/[0.04] p-1">
                    {POOL_PERIODS.map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setManualOrderPeriod(period);
                          setOrderActionMsg(null);
                        }}
                        className={`rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                          manualOrderPeriod === period
                            ? "bg-accent-green text-white"
                            : "text-text-muted hover:bg-white/10 hover:text-text-primary"
                        }`}
                      >
                        {period} 天
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" loading={orderBusy} onClick={handleCreateManualOrder}>
                    创建订单
                  </Button>
                </div>

                <div className="space-y-3 rounded-lg bg-white/[0.04] p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-orange sm:text-sm">
                    <XCircle className="h-4 w-4" />
                    所有订单
                  </div>
                  {userPositionsRead.isLoading ? (
                    <Skeleton className="h-28 w-full" />
                  ) : inspectedPositions.length === 0 ? (
                    <p className="rounded-lg bg-white/[0.04] px-3 py-6 text-center text-xs text-text-muted">暂无订单记录</p>
                  ) : (
                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {inspectedPositions.map((position) => {
                        const active = !position.isUnstaked;
                        return (
                          <div key={position.id} className="rounded-lg border border-card-border bg-deep-space/40 p-3">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-text-primary">#{position.id}</span>
                                <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${active ? "bg-amber-orange/15 text-amber-orange" : "bg-white/10 text-text-muted"}`}>
                                  {active ? "进行中" : "已关闭"}
                                </span>
                              </div>
                              {active && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={orderBusy}
                                  onClick={() => handleForceClosePosition(position.id)}
                                >
                                  强制结束
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted sm:grid-cols-3 sm:text-xs">
                              <div>
                                <p>数量</p>
                                <p className="mt-0.5 font-mono text-text-primary">{formatTokenAmount(position.amount, 18, 2)} SHD</p>
                              </div>
                              <div>
                                <p>周期</p>
                                <p className="mt-0.5 font-mono text-text-primary">{position.period} 天</p>
                              </div>
                              <div>
                                <p>日补贴</p>
                                <p className="mt-0.5 font-mono text-text-primary">{position.dailyRate}%</p>
                              </div>
                              <div>
                                <p>开始时间</p>
                                <p className="mt-0.5 text-text-primary">{formatDateTime(position.startTime)}</p>
                              </div>
                              <div>
                                <p>到期时间</p>
                                <p className="mt-0.5 text-text-primary">{formatDateTime(position.endTime)}</p>
                              </div>
                              <div>
                                <p>已记收益</p>
                                <p className="mt-0.5 font-mono text-text-primary">{formatTokenAmount(position.claimedReward, 18, 2)} SHD</p>
                              </div>
                            </div>
                            <div className="mt-2 break-all font-mono text-[10px] text-text-muted sm:text-xs">
                              上级：{position.referrer === ZERO_ADDRESS ? "未绑定" : position.referrer}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {orderActionMsg && <p className="mt-3 text-xs text-error">{orderActionMsg}</p>}
          {isOrderSuccess && <p className="mt-3 text-xs text-accent-green">订单管理交易已确认</p>}
        </Card>
      </section>

      <section className="mb-8 animate-slide-up opacity-0 sm:mb-10" style={{ animationDelay: "0.16s", animationFillMode: "forwards" }}>
        <Card className="border-cyber-blue/25 shadow-[0_0_28px_rgba(59,130,246,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Upload className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
            用户数据导入（链上写入）
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/[0.04] p-1">
              {RELATION_IMPORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setRelationImportType(option.key);
                    setRelationInput("");
                    setRelationMsg(null);
                  }}
                  className={`rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                    relationImportType === option.key
                      ? "bg-cyber-blue text-white"
                      : "text-text-muted hover:bg-white/10 hover:text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-white/[0.04] p-3 text-[10px] leading-relaxed text-text-muted sm:text-xs">
              {RELATION_IMPORT_META[relationImportType].helper}
            </div>
            <textarea
              value={relationInput}
              onChange={(event) => {
                setRelationInput(event.target.value);
                setRelationMsg(null);
              }}
              placeholder={RELATION_IMPORT_META[relationImportType].placeholder}
              className="min-h-36 w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 font-mono text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
            />
            {relationMsg && <p className="text-xs text-error">{relationMsg}</p>}
            {isRelationSuccess && <p className="text-xs text-accent-green">用户关系已导入</p>}
            <Button
              className="w-full"
              loading={isRelationPending || isRelationConfirming}
              onClick={handleImportRelations}
            >
              {isRelationPending ? "等待签名..." : isRelationConfirming ? "确认中..." : RELATION_IMPORT_META[relationImportType].button}
            </Button>
          </div>
        </Card>
      </section>
    </PageContainer>
  );
}