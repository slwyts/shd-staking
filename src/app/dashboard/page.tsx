/**
 * @file app/dashboard/page.tsx
 * @description 个人中心 — 总资产、公告、邀请绑定、订单、钱包连接、收益、持仓、团队、快捷链接。
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useReadContract } from "wagmi";
import { ORDER_BOOK_ABI } from "@/constants/abis/OrderBook";
import { ORDER_BOOK_ADDRESS } from "@/constants/contracts";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import {
  Megaphone,
  Copy,
  Check,
  Globe,
  Search,
  FileText,
  AlertTriangle,
  Wallet,
  Link2,
  ExternalLink,
  LogOut,
  Plug,
  ChevronRight,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Loading";
import { useMyPositions } from "@/hooks/dashboard/useMyPositions";
import { STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import { STORAGE_PREFERRED_REFERRER } from "@/constants/storageKeys";
import { formatAddress } from "@/utils/format";
import { dorNetwork } from "@/config/chains";
import { siteConfig } from "@/config/site";

export default function DashboardPage() {
  const { isConnected, address, chainId, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongChain = isConnected && !!address && chainId != null && chainId !== dorNetwork.id;

  // 读取用户的 OrderBook 订单
  const { data: myOrders, isLoading: ordersLoading } = useReadContract({
    address: ORDER_BOOK_ADDRESS,
    abi: ORDER_BOOK_ABI,
    functionName: "getOrders",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  type ChainOrder = {
    id: bigint; principal: bigint; totalReward: bigint; claimed: bigint;
    nextRelease: bigint; duration: bigint; status: number; remark: string;
  };
  const orders = (myOrders as ChainOrder[] | undefined) ?? [];

  // 每分钟刷新一次「当前时间」，驱动进度条更新
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [refInput, setRefInput] = useState("");
  const [refMsg, setRefMsg] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_PREFERRED_REFERRER);
      if (s) setRefInput(s);
    } catch { /* */ }
  }, []);

  const bindRef = useCallback(() => {
    const v = refInput.trim();
    if (!v) { setRefMsg("请输入上级地址"); return; }
    if (!isAddress(v)) { setRefMsg("地址格式不正确"); return; }
    try {
      localStorage.setItem(STORAGE_PREFERRED_REFERRER, v);
      setRefMsg("已绑定，质押时将默认使用该推荐地址");
    } catch { setRefMsg("保存失败"); }
  }, [refInput]);

  const copyInvite = useCallback(() => {
    if (!address) return;
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/staking?ref=${address}`;
    void navigator.clipboard.writeText(link).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }, [address]);

  const copyAddr = useCallback(() => {
    if (!address) return;
    void navigator.clipboard.writeText(address).then(() => {
      setAddrCopied(true);
      setTimeout(() => setAddrCopied(false), 2000);
    });
  }, [address]);

  const pendingConnectorId =
    isPending && variables && typeof variables === "object" && "connector" in variables &&
    variables.connector && typeof variables.connector === "object" && "id" in variables.connector
      ? String((variables.connector as { id: string }).id)
      : undefined;

  return (
    <PageContainer>
      <div className="animate-slide-up">
        <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">个人中心</h1>
        <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">管理钱包、查看资产与团队业绩</p>
      </div>

      {/* ===== 公告条 ===== */}
      <section className="mb-6 animate-slide-up opacity-0 sm:mb-8" style={{ animationDelay: "0.15s" }}>
        <Card className="flex items-start gap-2.5 animate-shimmer sm:gap-3">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-cyber-blue sm:h-5 sm:w-5" aria-hidden />
          <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">
            立即质押 SHD，赚取每日静态收益，参与直推与团队极差奖励。
            <Link href="/staking" className="ml-1 text-cyber-blue hover:underline transition-colors">
              去质押
            </Link>
          </p>
        </Card>
      </section>

      {/* ===== 绑定邀请人 ===== */}
      <section className="mb-6 animate-slide-up opacity-0 sm:mb-8" style={{ animationDelay: "0.22s" }}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-secondary sm:mb-4 sm:text-lg">
          <Link2 className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />绑定邀请人
        </h2>
        <Card>
          <input
            type="text"
            placeholder="输入上级地址 0x..."
            value={refInput}
            onChange={(e) => { setRefInput(e.target.value); setRefMsg(null); }}
            className="mb-3 w-full rounded-lg border border-card-border bg-white/5 px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/50 sm:mb-4 sm:py-2.5 sm:text-sm"
          />
          <Button className="mb-2.5 w-full sm:mb-3" onClick={bindRef}>绑定</Button>
          {refMsg && <p className="mb-2.5 text-center text-[10px] text-text-secondary sm:mb-3 sm:text-xs">{refMsg}</p>}
          <Button
            variant="secondary"
            className="w-full gap-2"
            disabled={!address}
            onClick={copyInvite}
          >
            {inviteCopied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            {inviteCopied ? "已复制" : "复制邀请链接"}
          </Button>
          {!address && (
            <p className="mt-2 text-center text-[10px] text-text-muted">连接钱包后可生成您的邀请链接</p>
          )}
        </Card>
      </section>

      {/* ===== 我的订单 ===== */}
      <section className="mb-6 animate-slide-up opacity-0 sm:mb-8" style={{ animationDelay: "0.29s" }}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-secondary sm:mb-4 sm:text-lg">
          <FileText className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />质押记录
        </h2>
        {!isConnected || !address ? (
          <Card><p className="py-2 text-center text-xs text-text-muted">请先连接钉包</p></Card>
        ) : ordersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <Card><p className="py-4 text-center text-xs text-text-muted">暂无订单记录</p></Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const principal = Number(o.principal) / 1e18;
              const totalReward = Number(o.totalReward) / 1e18;
              const claimed = Number(o.claimed) / 1e18;
              const claimable = Math.max(0, totalReward - claimed);
              // 进度条：基于时间（到期时间 - 锁定天数 = 开始时间）
              const expiryTs = Number(o.nextRelease); // 秒
              const durationSec = Number(o.duration) * 86400;
              const startTs = expiryTs > 0 && durationSec > 0 ? expiryTs - durationSec : 0;
              const nowSec = nowMs / 1000;
              const timeProgress = startTs > 0 && durationSec > 0
                ? Math.min(100, Math.max(0, Math.round(((nowSec - startTs) / durationSec) * 100)))
                : 0;
              const statusLabel = o.status === 0 ? "锁仓中" : o.status === 1 ? "已解锁" : "已完成";
              const statusColor = o.status === 0 ? "bg-amber-orange/20 text-amber-orange" : o.status === 1 ? "bg-cyber-blue/20 text-cyber-blue" : "bg-accent-green/20 text-accent-green";
              const expiryDate = expiryTs > 0 ? new Date(expiryTs * 1000).toLocaleDateString("zh-CN") : "—";
              return (
                <Card key={Number(o.id)} className="border-card-border">
                  {/* 头部: 编号 + 状态 */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-text-primary">#{Number(o.id)}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium sm:text-xs ${statusColor}`}>{statusLabel}</span>
                  </div>
                  {/* 两列数据 */}
                  <div className="mb-3 grid grid-cols-2 gap-y-2 text-xs sm:text-sm">
                    <div>
                      <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">质押本金</p>
                      <p className="font-semibold text-text-primary">{principal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">总收益</p>
                      <p className="font-semibold text-text-primary">{totalReward.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">已领取</p>
                      <p className="font-semibold text-cyber-blue">{claimed.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">到期时间</p>
                      <p className="font-semibold text-text-primary">{expiryDate}</p>
                    </div>
                  </div>
                  {/* 进度条 */}
                  <div className="mb-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyber-blue transition-[width] duration-700" style={{ width: `${timeProgress}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                      <span>进度 {timeProgress}%</span>
                      <span>{Number(o.duration)} 天后结束</span>
                    </div>
                  </div>
                  {/* 可提取 */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                    <div>
                      <p className="text-[10px] text-text-muted sm:text-xs">可提取 (SHD)</p>
                      <p className="font-semibold text-cyber-blue">{claimable.toLocaleString()} SHD</p>
                    </div>
                  </div>
                  {o.remark && <p className="mt-2 text-[10px] text-text-muted">{o.remark}</p>}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== 链上钱包 ===== */}
      <section className="mb-6 animate-slide-up opacity-0 sm:mb-8" style={{ animationDelay: "0.36s" }}>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-secondary sm:mb-4 sm:text-lg">
          <Wallet className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />链上钱包
        </h2>

        {!isConnected || !address ? (
          <>
            <p className="mb-2.5 text-xs text-text-muted sm:mb-3 sm:text-sm">选择连接方式</p>
            <div className="space-y-2.5 sm:space-y-3">
              {connectors.map((c) => {
                const loading = isPending && pendingConnectorId === c.id;
                return (
                  <Card key={c.uid} hover className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{c.name}</span>
                        <Badge variant="blue">DOR</Badge>
                      </div>
                      <p className="mt-0.5 text-[10px] text-text-muted sm:mt-1 sm:text-xs">
                        {c.id === "injected"
                          ? "适用于 MetaMask、OKX Wallet、TokenPocket 等浏览器扩展或内置钱包。"
                          : "通过此方式授权并连接您的链上地址。"}
                      </p>
                    </div>
                    <Button
                      className="w-full shrink-0 gap-2 sm:w-auto sm:min-w-[6.5rem]"
                      loading={loading}
                      disabled={isPending && !loading}
                      onClick={() => connect({ connector: c, chainId: dorNetwork.id })}
                    >
                      <Plug className="h-3.5 w-3.5 sm:h-4 sm:w-4" />连接
                    </Button>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {wrongChain && (
              <Card className="mb-3 border border-error/20 sm:mb-4">
                <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" aria-hidden />
                  <h3 className="text-sm font-semibold text-text-primary sm:text-base">网络不匹配</h3>
                </div>
                <p className="mb-3 text-xs text-text-secondary sm:mb-4 sm:text-sm">
                  当前钱包不在 {dorNetwork.name}，请先切换网络。
                </p>
                <Button
                  loading={isSwitching}
                  onClick={() => switchChain({ chainId: dorNetwork.id })}
                >
                  切换至 {dorNetwork.name}
                </Button>
              </Card>
            )}

            <Card className={wrongChain ? "opacity-90" : ""}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                <h3 className="text-base font-semibold text-text-primary sm:text-lg">钱包已连接</h3>
                <Badge variant={wrongChain ? "purple" : "blue"}>
                  {wrongChain ? "待切换网络" : "已就绪"}
                </Badge>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">钱包地址</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <code className="block break-all rounded-lg border border-card-border bg-white/5 px-2.5 py-2 font-mono text-[10px] text-cyber-blue sm:px-3 sm:py-2.5 sm:text-sm">
                      {address}
                    </code>
                    <Button variant="secondary" size="sm" className="w-full shrink-0 gap-1.5 sm:w-auto" onClick={copyAddr}>
                      {addrCopied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      {addrCopied ? "已复制" : "复制"}
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] text-text-muted">缩略：{formatAddress(address)}</p>
                </div>
                <div className="grid gap-2.5 border-t border-card-border pt-3 sm:grid-cols-2 sm:gap-3 sm:pt-4">
                  <div>
                    <p className="mb-0.5 text-[10px] text-text-muted sm:mb-1 sm:text-xs">当前网络</p>
                    <p className="text-sm font-medium text-text-primary">
                      {chainId === dorNetwork.id ? dorNetwork.name : chainId != null ? `链 ID ${chainId}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] text-text-muted sm:mb-1 sm:text-xs">连接方式</p>
                    <p className="text-sm font-medium text-text-primary">{activeConnector?.name ?? "—"}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-3 sm:mt-4">
              <Button variant="danger" className="w-full gap-2 sm:w-auto" loading={isDisconnecting} onClick={() => disconnect()}>
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                断开钱包连接
              </Button>
            </div>
          </>
        )}
      </section>

      {/* ===== 快捷链接 ===== */}
      <AnimatedSection as="section" className="mb-6 sm:mb-8" direction="up">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-secondary sm:mb-4 sm:text-lg">
          <ExternalLink className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />快捷链接
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <a
            href={siteConfig.links.chainWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card hover className="flex items-center gap-2.5 sm:gap-3">
              <Globe className="h-4 w-4 shrink-0 text-cyber-blue sm:h-5 sm:w-5" strokeWidth={1.5} />
              <span className="flex-1 text-xs text-text-primary group-hover:text-cyber-blue sm:text-sm">官方网站</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 sm:h-4 sm:w-4" />
            </Card>
          </a>
          <a
            href={siteConfig.links.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card hover className="flex items-center gap-2.5 sm:gap-3">
              <Search className="h-4 w-4 shrink-0 text-cyber-blue sm:h-5 sm:w-5" strokeWidth={1.5} />
              <span className="flex-1 text-xs text-text-primary group-hover:text-cyber-blue sm:text-sm">区块浏览器</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 sm:h-4 sm:w-4" />
            </Card>
          </a>
          <a
            href={`${siteConfig.links.explorer.replace(/\/$/, "")}/address/${STAKING_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card hover className="flex items-center gap-2.5 sm:gap-3">
              <FileText className="h-4 w-4 shrink-0 text-cyber-blue sm:h-5 sm:w-5" strokeWidth={1.5} />
              <span className="flex-1 text-xs text-text-primary group-hover:text-cyber-blue sm:text-sm">质押合约</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 sm:h-4 sm:w-4" />
            </Card>
          </a>
        </div>
      </AnimatedSection>

    </PageContainer>
  );
}
