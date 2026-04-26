/**
 * @file app/admin/page.tsx
 * @description 管理控制台 — DApp 资金池管理与用户数据导入。
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { DAPP_ABI, ERC20_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import { appMode } from "@/config/appMode";
import { dorNetwork } from "@/config/chains";
import { useHydrated } from "@/hooks/common/useHydrated";
import { useDappTokenAddress } from "@/hooks/dapp/useDappTokenAddress";
import { useTokenApproval } from "@/hooks/token/useTokenApproval";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Loading";
import { formatTokenAmount } from "@/utils/format";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Copy,
  Info,
  ShieldCheck,
  Upload,
} from "lucide-react";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
type RelationImportType = "referrers" | "levels" | "operationCenters";

const RELATION_IMPORT_OPTIONS: Array<{ key: RelationImportType; label: string }> = [
  { key: "referrers", label: "邀请关系" },
  { key: "levels", label: "用户级别" },
  { key: "operationCenters", label: "运营中心" },
];

const RELATION_IMPORT_META: Record<RelationImportType, { helper: string; placeholder: string; button: string }> = {
  referrers: {
    helper: "每行格式：用户地址,推荐人地址。推荐人可填 0x0000000000000000000000000000000000000000 清空关系。",
    placeholder: `0xUser,0xReferrer\n0xUser2,${ZERO_ADDRESS}`,
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
    const [user, referrer] = cells;
    if (!user || !isAddress(user)) throw new Error(`第 ${index + 1} 行用户地址格式不正确`);
    if (!referrer || !isAddress(referrer)) throw new Error(`第 ${index + 1} 行推荐人地址格式不正确`);

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
  const { address, chainId } = useAccount();
  const walletAddress = hydrated ? address : undefined;
  const walletChainId = hydrated ? chainId : undefined;

  const onChain = walletChainId === dorNetwork.id;
  const { shdTokenAddress, isLoading: isShdAddressLoading } = useDappTokenAddress();

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

  useEffect(() => {
    if (isFundApprovalConfirmed) void refetchFundAllowance();
    if (!isFundApprovalConfirmed || pendingFundAmount === null) return;
    setPoolMsg("授权成功，正在充入资金池…");
    resetPoolWrite();
    writePoolContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "fundRewards",
      args: [pendingFundAmount],
    });
    setPendingFundAmount(null);
  }, [isFundApprovalConfirmed, pendingFundAmount, refetchFundAllowance, resetPoolWrite, writePoolContract]);

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

    try {
      if (relationImportType === "referrers") {
        const parsed = parseReferrerImport(relationInput);
        if (parsed.users.length === 0) throw new Error("请至少输入一行用户数据");
        writeRelationImport({
          address: DAPP_CONTRACT_ADDRESS,
          abi: DAPP_ABI,
          functionName: "batchSetReferrers",
          args: [parsed.users, parsed.referrers],
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
  }, [relationImportType, relationInput, resetRelationWrite, writeRelationImport]);

  const handleFundPool = useCallback(() => {
    setPoolMsg(null);
    if (!walletAddress) { setPoolMsg("请先连接钱包"); return; }
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
  }, [approveFund, fundAmount, fundNeedsApproval, resetPoolWrite, shdTokenAddress, walletAddress, writePoolContract]);

  const handleWithdrawPool = useCallback(() => {
    setPoolMsg(null);
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
  }, [resetPoolWrite, walletAddress, withdrawAmount, withdrawTo, writePoolContract]);

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