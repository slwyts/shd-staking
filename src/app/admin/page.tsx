/**
 * @file app/admin/page.tsx
 * @description 管理控制台 — 公告入口、合约信息、拨币/批量导入、仓位查询、参数与手续费、紧急提现（UI 与项目科幻风格一致，链上操作需后续对接合约）。
 */
"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { ORDER_BOOK_ABI } from "@/constants/abis/OrderBook";
import { ORDER_BOOK_ADDRESS } from "@/constants/contracts";
import {
  ShieldCheck,
  Megaphone,
  Info,
  Copy,
  Check,
  Zap,
  Upload,
  Search,
  Settings,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Loading";
import { SHD_TOKEN_ABI } from "@/constants/abis/SHDToken";
import { SHD_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import { dorNetwork } from "@/config/chains";
import { formatTokenAmount } from "@/utils/format";

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

  const { data: poolBalanceRaw, isLoading: poolLoading } = useReadContract({
    address: SHD_TOKEN_ADDRESS,
    abi: SHD_TOKEN_ABI,
    functionName: "balanceOf",
    args: [STAKING_CONTRACT_ADDRESS],
    query: {
      enabled: chainId === dorNetwork.id,
    },
  });

  const poolBalance = poolBalanceRaw as bigint | undefined;

  // ── 添加订单表单 ──────────────────────────────────────
  const [orderUser,        setOrderUser]        = useState("");
  const [orderPrincipal,   setOrderPrincipal]   = useState("");
  const [orderTotalReward, setOrderTotalReward] = useState("");
  const [orderExpiry,      setOrderExpiry]      = useState(""); // 到期时间 YYYY-MM-DD
  const [orderDuration,    setOrderDuration]    = useState("30");
  const [orderStatus,      setOrderStatus]      = useState("0");
  const [orderRemark,      setOrderRemark]      = useState("");
  const [addMsg,           setAddMsg]           = useState<string | null>(null);

  const { writeContract, data: addTxHash, isPending: isAddPending, reset: resetWrite } = useWriteContract();
  const { isLoading: isAddConfirming, isSuccess: isAddSuccess } = useWaitForTransactionReceipt({ hash: addTxHash });

  const handleAddOrder = useCallback(() => {
    setAddMsg(null);
    if (!isAddress(orderUser))           { setAddMsg("用户地址格式不正确"); return; }
    if (!orderPrincipal || isNaN(Number(orderPrincipal))) { setAddMsg("请输入有效本金"); return; }
    if (!orderTotalReward || isNaN(Number(orderTotalReward))) { setAddMsg("请输入有效总收益"); return; }
    const expiryTs = orderExpiry
      ? BigInt(Math.floor(new Date(orderExpiry).getTime() / 1000))
      : BigInt(0);
    resetWrite();
    writeContract({
      address: ORDER_BOOK_ADDRESS,
      abi: ORDER_BOOK_ABI,
      functionName: "addOrder",
      args: [
        orderUser as `0x${string}`,
        parseEther(orderPrincipal),
        parseEther(orderTotalReward),
        expiryTs,
        BigInt(orderDuration || "0"),
        Number(orderStatus) as 0 | 1 | 2,
        orderRemark,
      ],
    });
  }, [orderUser, orderPrincipal, orderTotalReward, orderExpiry, orderDuration, orderStatus, orderRemark, writeContract, resetWrite]);

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

  const [bulkText, setBulkText] = useState("");
  const parsedLineCount = useMemo(() => {
    if (!bulkText.trim()) return 0;
    return bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
  }, [bulkText]);

  const [rewardRatio, setRewardRatio] = useState("0.5");
  const [lockDays, setLockDays] = useState("90");
  const [linearDays, setLinearDays] = useState("270");
  const [initialUnlock, setInitialUnlock] = useState("0.1");
  const [withdrawFeePct, setWithdrawFeePct] = useState("5");

  const [emergencyToken, setEmergencyToken] = useState("");
  const [emergencyAmount, setEmergencyAmount] = useState("0");

  const currentSummary = useMemo(
    () => ({
      bonus: `${Math.round(Number(rewardRatio) * 100)}%`,
      lock: `${lockDays}d`,
      linear: `${linearDays}d`,
      initial: `${Math.round(Number(initialUnlock) * 100)}%`,
      fee: `${withdrawFeePct}%`,
    }),
    [rewardRatio, lockDays, linearDays, initialUnlock, withdrawFeePct],
  );

  const placeholderAction = useCallback(() => {
    window.alert("管理员操作需部署并对接合约后启用。");
  }, []);

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyber-blue/15 text-cyber-blue sm:h-11 sm:w-11">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-cyber-blue sm:text-xl">管理控制台</h1>
            <p className="text-[10px] text-text-muted sm:text-xs">合约与运营参数（演示界面）</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            返回我的页面
          </Button>
        </Link>
      </div>

      {/* 公告管理 */}
      <section className="mb-5 animate-slide-up opacity-0 sm:mb-6" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
        <Link href="/news" className="block">
          <Card hover className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-orange/15 text-amber-orange sm:h-14 sm:w-14">
              <Megaphone className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">公告管理</p>
              <p className="text-[10px] text-text-muted sm:text-xs">创建、编辑、删除公告（跳转公告页）</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
          </Card>
        </Link>
      </section>

      {/* 合约信息 */}
      <section className="mb-5 sm:mb-6">
        <Card className="border-cyber-blue/20 shadow-[0_0_24px_rgba(59,130,246,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cyber-blue sm:text-base">
            <Info className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            合约信息
          </div>
          <div className="space-y-3">
            <CopyAddressRow label="质押池合约地址" address={STAKING_CONTRACT_ADDRESS} />
            <CopyAddressRow label="SHD 代币地址" address={SHD_TOKEN_ADDRESS} />
            <div className="rounded-lg bg-white/[0.04] p-3 sm:p-4">
              <p className="mb-1 text-[10px] text-text-muted sm:text-xs">合约池余额（SHD）</p>
              {chainId !== dorNetwork.id ? (
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
      <section className="mb-5 sm:mb-6">
        <Card className="border-amber-orange/25 shadow-[0_0_28px_rgba(245,158,11,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Zap className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" />
            添加订单（链上写入）
          </div>
          <div className="space-y-3">
            {([
              { label: "用户地址",     placeholder: "0x...",   value: orderUser,        set: setOrderUser,        type: "text" },
              { label: "质押本金",     placeholder: "10000",   value: orderPrincipal,   set: setOrderPrincipal,   type: "text" },
              { label: "总收益",       placeholder: "15000",   value: orderTotalReward, set: setOrderTotalReward, type: "text" },
              { label: "锁定天数",     placeholder: "30",      value: orderDuration,    set: setOrderDuration,    type: "text" },
            ] as const).map((row) => (
              <div key={row.label}>
                <p className="mb-1.5 text-xs text-text-secondary">{row.label}</p>
                <input
                  type={row.type}
                  placeholder={row.placeholder}
                  value={row.value}
                  onChange={(e) => (row.set as (v: string) => void)(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
                />
              </div>
            ))}
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">到期时间</p>
              <input
                type="text"
                placeholder="例：2026-07-09"
                value={orderExpiry}
                onChange={(e) => setOrderExpiry(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">状态</p>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-cyber-blue/50"
              >
                <option value="0">锁仓中</option>
                <option value="1">已解锁</option>
                <option value="2">已完成</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">备注（可选）</p>
              <input
                type="text"
                placeholder="备注信息"
                value={orderRemark}
                onChange={(e) => setOrderRemark(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50"
              />
            </div>
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

      {/* 批量导入 */}
      <section className="mb-5 sm:mb-6">
        <Card className="border-cyber-purple/25 shadow-[0_0_28px_rgba(124,109,176,0.1)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Upload className="h-4 w-4 text-cyber-purple sm:h-5 sm:w-5" />
            批量导入
          </div>
          <p className="mb-2 text-[10px] text-text-muted sm:text-xs">粘贴数据（每行: 地址 金额）</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"0x1234...abcd 1000.00"}
            rows={5}
            className="mb-4 w-full resize-y rounded-lg border border-card-border bg-white/5 px-3 py-2.5 font-mono text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50 sm:text-sm"
          />
          <Button variant="secondary" className="w-full border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10" onClick={placeholderAction}>
            解析数据（{parsedLineCount} 行）
          </Button>
        </Card>
      </section>

      {/* 查询用户订单 */}
      <section className="mb-5 sm:mb-6">
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
                (queryOrders as Array<{
                  id: bigint; principal: bigint; totalReward: bigint; claimed: bigint;
                  nextRelease: bigint; duration: bigint; status: number; remark: string;
                }>).map((o) => (
                  <div key={Number(o.id)} className="rounded-lg border border-card-border bg-white/[0.03] p-3 text-xs">
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium text-text-primary">#{Number(o.id)}</span>
                      <span className={o.status === 0 ? "text-amber-orange" : o.status === 1 ? "text-cyber-blue" : "text-accent-green"}>
                        {o.status === 0 ? "锁仓中" : o.status === 1 ? "已解锁" : "已完成"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-text-muted">
                      <span>本金：<span className="text-text-primary">{(Number(o.principal) / 1e18).toLocaleString()}</span></span>
                      <span>总收益：<span className="text-text-primary">{(Number(o.totalReward) / 1e18).toLocaleString()}</span></span>
                      <span>已领取：<span className="text-text-primary">{(Number(o.claimed) / 1e18).toLocaleString()}</span></span>
                      <span>天数：<span className="text-text-primary">{Number(o.duration)} 天</span></span>
                      {o.nextRelease > BigInt(0) && <span className="col-span-2">到期：<span className="text-text-primary">{new Date(Number(o.nextRelease) * 1000).toLocaleDateString("zh-CN")}</span></span>}
                      {o.remark && <span className="col-span-2">备注：<span className="text-text-primary">{o.remark}</span></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </section>

      {/* 系统参数 */}
      <section className="mb-5 sm:mb-6">
        <Card className="border-cyber-blue/25 shadow-[0_0_28px_rgba(59,130,246,0.08)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Settings className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
            系统参数配置
          </div>
          <div className="space-y-3">
            {[
              { label: "奖励比例 (0.5 = 50%) (0–1)", value: rewardRatio, set: setRewardRatio },
              { label: "锁仓天数 (days)", value: lockDays, set: setLockDays },
              { label: "线性释放天数", value: linearDays, set: setLinearDays },
              { label: "首期解锁比例 (0.1 = 10%) (0–1)", value: initialUnlock, set: setInitialUnlock },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3"
              >
                <span className="text-[10px] text-text-secondary sm:text-xs">{row.label}</span>
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => row.set(e.target.value)}
                  className="w-full rounded-md border border-card-border bg-white/5 px-2 py-1.5 text-right font-mono text-xs text-text-primary outline-none focus:border-cyber-blue/50 sm:max-w-[10rem]"
                />
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={placeholderAction}>
            保存配置
          </Button>
        </Card>
      </section>

      {/* 当前配置摘要 */}
      <section className="mb-5 sm:mb-6">
        <Card>
          <p className="mb-3 text-xs font-medium text-text-muted">当前配置</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {[
              { k: "Bonus", v: currentSummary.bonus },
              { k: "Lock", v: currentSummary.lock },
              { k: "Linear", v: currentSummary.linear },
              { k: "Initial", v: currentSummary.initial },
              { k: "Fee", v: currentSummary.fee },
            ].map((item) => (
              <div key={item.k} className="text-center">
                <p className="mb-1 text-[10px] text-text-muted">{item.k}</p>
                <p className="text-sm font-semibold text-text-primary sm:text-base">{item.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 提现手续费 */}
      <section className="mb-5 sm:mb-6">
        <Card className="border-amber-orange/20">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-base">
            <Settings className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" />
            提现手续费设置
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <p className="mb-1.5 text-xs text-text-secondary">手续费率 (%)</p>
              <input
                type="text"
                value={withdrawFeePct}
                onChange={(e) => setWithdrawFeePct(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-right font-mono text-sm text-text-primary outline-none focus:border-cyber-blue/50 sm:max-w-xs"
              />
            </div>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={placeholderAction}>
              设置手续费
            </Button>
          </div>
        </Card>
      </section>

      {/* 紧急提现 */}
      <section className="mb-8 sm:mb-10">
        <Card className="border-error/30 shadow-[0_0_28px_rgba(239,68,68,0.12)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-error sm:text-base">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            紧急提现
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">代币地址</p>
              <input
                type="text"
                placeholder="0x..."
                value={emergencyToken}
                onChange={(e) => setEmergencyToken(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 font-mono text-xs text-text-primary outline-none focus:border-cyber-blue/50 sm:text-sm"
              />
              <p className="mt-1.5 text-[10px] text-text-muted">留空则默认提取 SHD 代币</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-secondary">提现数量</p>
              <input
                type="text"
                value={emergencyAmount}
                onChange={(e) => setEmergencyAmount(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-white/5 px-3 py-2.5 text-sm text-text-primary outline-none focus:border-cyber-blue/50"
              />
            </div>
            <Button variant="danger" className="w-full !bg-error !text-white hover:!bg-error/90" onClick={placeholderAction}>
              执行紧急提现
            </Button>
          </div>
        </Card>
      </section>
    </PageContainer>
  );
}
