"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import {
  Megaphone,
  Copy,
  Check,
  Globe,
  Search,
  FileText,
  ChevronRight,
  Send,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { dorNetwork } from "@/config/chains";
import { STORAGE_PREFERRED_REFERRER } from "@/constants/storageKeys";
import { STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import { formatAddress } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Loading";

/** RobotX 风格圆角卡片 */
export function PcCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** 径向渐变手机画幅容器 */
export function PersonalCenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-none border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.35)] sm:my-2 sm:rounded-2xl"
      style={{
        background: "radial-gradient(circle at 50% 0%, #0a1a3a 0%, #020611 100%)",
      }}
    >
      <div className="max-h-[none] space-y-4 px-5 pb-28 pt-5">{children}</div>
    </div>
  );
}

/** 顶栏：品牌 + 钱包状态胶囊 */
export function HubWalletBar() {
  const { address, isConnected, chainId } = useAccount();
  const ok = isConnected && !!address && chainId === dorNetwork.id;
  const partial = isConnected && !!address && !ok;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tracking-tight text-text-primary">{siteConfig.name}</p>
        <p className="text-[10px] text-text-muted">{dorNetwork.name}</p>
      </div>
      <Link
        href="#wallet-hub"
        className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
          ok
            ? "border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue"
            : partial
              ? "border-amber-orange/40 bg-amber-orange/10 text-amber-orange"
              : "border-white/15 bg-white/[0.06] text-text-secondary hover:border-cyber-blue/30 hover:text-cyber-blue"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            ok ? "bg-accent-green" : partial ? "bg-amber-orange" : "bg-text-muted"
          }`}
          aria-hidden
        />
        {ok && address
          ? formatAddress(address)
          : partial
            ? "切换网络"
            : "连接钱包"}
      </Link>
    </div>
  );
}

export function HubAssetHero({
  primaryLabel,
  primaryValue,
  subLine,
  loading,
}: {
  primaryLabel: string;
  primaryValue: string;
  subLine: string;
  loading?: boolean;
}) {
  return (
    <PcCard className="text-center">
      <p className="text-xs text-text-muted">{primaryLabel}</p>
      {loading ? (
        <Skeleton className="mx-auto mt-2 h-10 w-48" />
      ) : (
        <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-text-primary">{primaryValue}</p>
      )}
      <p className="mt-2 text-[11px] text-text-muted">{subLine}</p>
    </PcCard>
  );
}

export function HubAnnounceStrip() {
  return (
    <PcCard className="flex items-start gap-3 py-3">
      <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-cyber-blue" aria-hidden />
      <p className="text-left text-xs leading-relaxed text-text-secondary">
        立即质押 SHD，赚取每日静态收益，参与直推与团队极差奖励。
        <Link href="/staking" className="ml-1 text-cyber-blue hover:underline">
          去质押
        </Link>
      </p>
    </PcCard>
  );
}

export function HubReferralBindCard() {
  const { address } = useAccount();
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_PREFERRED_REFERRER);
      if (s) setInput(s);
    } catch {
      /* */
    }
  }, []);

  const bind = useCallback(() => {
    const v = input.trim();
    if (!v) {
      setMsg("请输入上级地址");
      return;
    }
    if (!isAddress(v)) {
      setMsg("地址格式不正确");
      return;
    }
    try {
      localStorage.setItem(STORAGE_PREFERRED_REFERRER, v);
      setMsg("已绑定，质押时将默认使用该推荐地址");
    } catch {
      setMsg("保存失败，请检查浏览器存储权限");
    }
  }, [input]);

  const copyInvite = useCallback(() => {
    if (!address) return;
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/staking?ref=${address}`;
    void navigator.clipboard.writeText(link).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }, [address]);

  return (
    <PcCard>
      <h3 className="mb-3 text-sm font-semibold text-text-primary">绑定邀请人</h3>
      <input
        type="text"
        placeholder="输入上级地址 0x..."
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setMsg(null);
        }}
        className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-cyber-blue/40"
      />
      <Button type="button" className="mb-3 w-full" onClick={bind}>
        绑定
      </Button>
      {msg && <p className="mb-2 text-center text-xs text-text-secondary">{msg}</p>}
      <button
        type="button"
        disabled={!address}
        onClick={copyInvite}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:border-cyber-blue/30 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        {inviteCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {inviteCopied ? "已复制" : "复制邀请链接"}
      </button>
      {!address && (
        <p className="mt-2 text-center text-[10px] text-text-muted">连接钱包后可生成您的邀请链接</p>
      )}
    </PcCard>
  );
}

type PositionLite = {
  id: number;
  amount: bigint;
  period: number;
  startTime: number;
  endTime: number;
};

export function HubMyOrdersCard({
  loading,
  positions,
}: {
  loading: boolean;
  positions: PositionLite[];
}) {
  return (
    <PcCard>
      <h3 className="mb-3 text-sm font-semibold text-text-primary">我的订单</h3>
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : positions.length === 0 ? (
        <p className="py-2 text-center text-xs text-text-muted">当前还没有链上订单。</p>
      ) : (
        <ul className="space-y-2">
          {positions.slice(0, 4).map((pos) => {
            const expired = Date.now() / 1000 > pos.endTime;
            return (
              <li
                key={String(pos.id)}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs"
              >
                <span className="text-text-secondary">{pos.period} 天周期</span>
                <span className={expired ? "text-accent-green" : "text-cyber-blue"}>
                  {expired ? "已到期" : "进行中"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/staking"
        className="mt-3 block text-center text-xs text-cyber-blue hover:underline"
      >
        质押 / 查看详情
      </Link>
    </PcCard>
  );
}

export function HubQuickLinksCard() {
  const explorerBase = siteConfig.links.explorer.replace(/\/$/, "");
  const contractUrl = `${explorerBase}/address/${STAKING_CONTRACT_ADDRESS}`;

  const rows = [
    { href: siteConfig.links.chainWebsite, label: "官方网站", icon: Globe },
    { href: siteConfig.links.explorer, label: "区块浏览器", icon: Search },
    { href: contractUrl, label: "质押合约", icon: FileText },
  ];

  return (
    <PcCard className="p-0">
      <ul>
        {rows.map((row) => (
          <li key={row.label} className="border-b border-white/5 last:border-0">
            <a
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary transition-colors hover:bg-white/[0.04]"
            >
              <row.icon className="h-[18px] w-[18px] shrink-0 text-cyber-blue" strokeWidth={1.5} />
              <span className="flex-1">{row.label}</span>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </PcCard>
  );
}

export function HubFooter() {
  const { twitter, telegram } = siteConfig.social;
  const hasSocial = Boolean(twitter || telegram);

  return (
    <div className="pb-4 pt-2">
      {hasSocial && (
        <div className="mb-4 flex justify-center gap-4">
          {twitter ? (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-text-secondary transition-all hover:border-cyber-blue/40 hover:text-cyber-blue hover:scale-110"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
          ) : null}
          {telegram ? (
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-text-secondary transition-all hover:border-cyber-blue/40 hover:text-cyber-blue hover:scale-110"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      )}
      <p className="text-center text-[10px] text-text-muted">
        DOR · {siteConfig.name} v{siteConfig.version}
      </p>
    </div>
  );
}
