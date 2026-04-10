/**
 * @file app/admin/page.tsx
 * @description Mini 版管理控制台 — 合约信息、拨币（用户地址 + SHD数量 + 锁仓天数）、查询用户订单。
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { ORDER_BOOK_ABI } from "@/constants/abis/OrderBook";
import { ORDER_BOOK_ADDRESS } from "@/constants/contracts";
import {
  ShieldCheck,
  Info,
  Copy,
  Check,
  Zap,
  Search,
  ChevronRight,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Loading";
import { SHD_TOKEN_ABI } from "@/constants/abis/SHDToken";
import { SHD_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import { dorNetwork } from "@/config/chains";
import { formatTokenAmount } from "@/utils/format";

const PRIVATE_PLACEMENT_ORDER_TYPE = 0;

function getOrderTypeLabel(orderType: number) {
  return orderType === PRIVATE_PLACEMENT_ORDER_TYPE ? "私募锁仓" : "未知类型";
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
  const { chainId } = useAccount();

  // 延迟到客户端渲染链上状态，避免 SSR 水合不匹配
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onChain = mounted && chainId === dorNetwork.id;

  const { data: poolBalanceRaw, isLoading: poolLoading } = useReadContract({
    address: SHD_TOKEN_ADDRESS,
    abi: SHD_TOKEN_ABI,
    functionName: "balanceOf",
    args: [STAKING_CONTRACT_ADDRESS],
    query: {
      enabled: onChain,
    },
  });

  const poolBalance = poolBalanceRaw as bigint | undefined;

  // ── 添加订单表单──────────────────────────────────────
  const [orderType,     setOrderType]     = useState(String(PRIVATE_PLACEMENT_ORDER_TYPE));
  const [orderUser,     setOrderUser]     = useState("");
  const [orderAmount,   setOrderAmount]   = useState("");
  const [orderLockDays, setOrderLockDays] = useState("90");
  const [addMsg,        setAddMsg]        = useState<string | null>(null);

  const { writeContract, data: addTxHash, isPending: isAddPending, reset: resetWrite } = useWriteContract();
  const { isLoading: isAddConfirming, isSuccess: isAddSuccess } = useWaitForTransactionReceipt({ hash: addTxHash });

  const orderTypeLabel = useMemo(() => getOrderTypeLabel(Number(orderType)), [orderType]);

  const handleAddOrder = useCallback(() => {
    setAddMsg(null);
    if (!isAddress(orderUser))        { setAddMsg("用户地址格式不正确"); return; }
    if (!orderAmount || isNaN(Number(orderAmount)) || Number(orderAmount) <= 0) { setAddMsg("请输入有效 SHD 数量"); return; }
    if (!orderLockDays || Number(orderLockDays) <= 0) { setAddMsg("请输入有效锁仓天数"); return; }
    resetWrite();
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: ORDER_BOOK_ABI,
      functionName: "addOrder",
      args: [
        orderUser as `0x${string}`,
        Number(orderType),
        parseEther(orderAmount),
        BigInt(orderLockDays),
      ],
    });
  }, [orderType, orderUser, orderAmount, orderLockDays, writeContract, resetWrite]);

  // ── 查询用户订单（读合约）──────────────────────────────
  const [queryUserAddr, setQueryUserAddr] = useState("");
  const queryEnabled = isAddress(queryUserAddr);
  const { data: queryOrders, isLoading: queryLoading } = useReadContract({
    address: ORDER_BOOK_ADDRESS,
    abi: ORDER_BOOK_ABI,
    functionName: "getOrders",
    args: queryEnabled ? [queryUserAddr as `0x${string}`] : undefined,
    query: { enabled: queryEnabled },
  });

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyber-blue/15 text-cyber-blue sm:h-11 sm:w-11">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-cyber-blue sm:text-xl">管理控制台</h1>
            <p className="text-[10px] text-text-muted sm:text-xs">拨币 &amp; 锁仓管理</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            返回我的页面
          </Button>
        </Link>
      </div>

      {/* 合约信息 */}
      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
        <Card className="border-cyber-blue/20 shadow-[0_0_24px_rgba(59,130,246,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyber-blue sm:text-base">
            <Info className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            合约信息
          </div>
          <div className="space-y-3">
            <CopyAddressRow label="订单簿合约地址" address={ORDER_BOOK_ADDRESS} />
            <CopyAddressRow label="SHD 代币地址" address={SHD_TOKEN_ADDRESS} />
            <div className="rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <p className="mb-1 text-[10px] text-text-muted sm:text-xs">合约池余额（SHD）</p>
              {!onChain ? (
                <p className="text-xs text-text-muted">请连接钱包并切换至 {dorNetwork.name} 后查询</p>
              ) : poolLoading ? (
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

      {/* 添加订单 */}
      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.12s", animationFillMode: "forwards" }}>
        <Card className="border-amber-orange/25 shadow-[0_0_28px_rgba(245,158,11,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Zap className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" />
            拨币锁仓（链上写入）
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">订单类型</p>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-cyber-blue/50"
              >
                <option value="0">私募锁仓</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">用户地址</p>
              <input
                type="text"
                placeholder="0x..."
                value={orderUser}
                onChange={(e) => setOrderUser(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">SHD 数量</p>
              <input
                type="text"
                placeholder="10000"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">锁仓天数</p>
              <input
                type="text"
                placeholder="90"
                value={orderLockDays}
                onChange={(e) => setOrderLockDays(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </div>

            {parseFloat(orderAmount) > 0 && Number(orderLockDays) > 0 && (
              <div className="rounded-lg bg-white/[0.04] p-3">
                <p className="mb-2 text-[10px] font-medium text-text-muted sm:text-xs">订单预览</p>
                <div className="grid grid-cols-2 gap-y-1 text-xs text-text-secondary">
                  <span>类型：<span className="text-cyber-blue">{orderTypeLabel}</span></span>
                  <span>释放方式：<span className="text-accent-green">到期一次性释放</span></span>
                </div>
              </div>
            )}

            {addMsg && <p className="text-xs text-error">{addMsg}</p>}
            {isAddSuccess && <p className="text-xs text-accent-green">✓ 订单已上链</p>}
            <Button
              className="w-full"
              loading={isAddPending || isAddConfirming}
              onClick={handleAddOrder}
            >
              {isAddPending ? "等待签名…" : isAddConfirming ? "确认中…" : "提交订单"}
            </Button>
          </div>
        </Card>
      </section>

      {/* 查询用户订单 */}
      <section className="mb-8 animate-slide-up opacity-0 sm:mb-10" style={{ animationDelay: "0.19s", animationFillMode: "forwards" }}>
        <Card className="border-cyber-blue/30 shadow-[0_0_24px_rgba(59,130,246,0.1)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Search className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
            查询用户订单
          </div>
          <input
            type="text"
            placeholder="输入用户地址 0x..."
            value={queryUserAddr}
            onChange={(e) => setQueryUserAddr(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
          />
          {queryEnabled && (
            <div className="mt-4 space-y-2">
              {queryLoading ? (
                <p className="text-center text-xs text-text-muted">查询中…</p>
              ) : !queryOrders || (queryOrders as readonly unknown[]).length === 0 ? (
                <p className="text-center text-xs text-text-muted">该用户暂无订单</p>
              ) : (
                (queryOrders as ReadonlyArray<{
                  id: bigint; orderType: number; amount: bigint; lockDays: bigint; createdAt: bigint;
                }>).map((o) => {
                  const amount = Number(o.amount) / 1e18;
                  const lockDays = Number(o.lockDays);
                  const createdSec = Number(o.createdAt);
                  const expirySec = createdSec + lockDays * 86400;
                  const nowSec = Date.now() / 1000;
                  const remainDays = Math.max(0, Math.ceil((expirySec - nowSec) / 86400));
                  const expired = nowSec >= expirySec;
                  return (
                    <div key={Number(o.id)} className="rounded-lg border border-card-border bg-white/[0.03] p-3 text-xs">
                      <div className="mb-1 flex justify-between">
                        <span className="font-medium text-text-primary">#{Number(o.id)}</span>
                        <span className={expired ? "text-accent-green" : "text-amber-orange"}>
                          {expired ? "已到期" : "锁仓中"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-text-muted">
                        <span>类型：<span className="text-cyber-blue">{getOrderTypeLabel(Number(o.orderType))}</span></span>
                        <span>数量：<span className="text-text-primary">{amount.toLocaleString()} SHD</span></span>
                        <span>锁仓：<span className="text-text-primary">{lockDays} 天</span></span>
                        <span>剩余：<span className="text-text-primary">{expired ? "已到期" : `${remainDays} 天`}</span></span>
                        <span>创建：<span className="text-text-primary">{new Date(createdSec * 1000).toLocaleDateString("zh-CN")}</span></span>
                        <span>释放：<span className="text-accent-green">到期一次性释放</span></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>
      </section>
    </PageContainer>
  );
}
