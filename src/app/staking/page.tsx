/**
 * @file app/staking/page.tsx
 * @description 认购页面 — 选择认购周期、输入数量、预估收益、执行认购。
 *   包含 Approve + Stake 两步操作流程。
 */
"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet, Lock, Calculator } from "lucide-react";
import { isAddress, parseUnits } from "viem";
import { PageContainer } from "@/components/layout/PageContainer";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/common/useWallet";
import { useStakingPools } from "@/hooks/staking/useStakingPools";
import { useStake } from "@/hooks/staking/useStake";
import { useTokenBalance } from "@/hooks/token/useTokenBalance";
import { useTokenApproval } from "@/hooks/token/useTokenApproval";
import { SHD_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS } from "@/constants/contracts";
import { STORAGE_PREFERRED_REFERRER } from "@/constants/storageKeys";
import { calcStakingReward, STAKING_DAILY_RATES } from "@/utils/calc";
import { formatTokenAmount } from "@/utils/format";
import type { StakingPeriod } from "@/types/staking";

/** 周期选项卡数据 */
const PERIOD_TABS = [
  { key: "90", label: "90 天" },
  { key: "180", label: "180 天" },
  { key: "360", label: "360 天" },
];

function StakingPageInner() {
  const searchParams = useSearchParams();
  const { isConnected, connectWallet } = useWallet();
  const { pools } = useStakingPools();
  const { stake, isSending, isConfirming, isConfirmed } = useStake();
  const { balance: shdBalance } = useTokenBalance(SHD_TOKEN_ADDRESS);
  const {
    approve,
    needsApproval,
    isApproving,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
  } = useTokenApproval(SHD_TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("90");
  const [amount, setAmount] = useState("");
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && isAddress(ref)) {
      setReferrer(ref);
      try {
        localStorage.setItem(STORAGE_PREFERRED_REFERRER, ref);
      } catch {
        /* */
      }
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_PREFERRED_REFERRER);
      if (saved && isAddress(saved)) {
        setReferrer((prev) => prev || saved);
      }
    } catch {
      /* */
    }
  }, [searchParams]);

  const periodDays = Number(selectedPeriod) as StakingPeriod;
  const dailyRate = STAKING_DAILY_RATES[periodDays] ?? 0;
  const numericAmount = parseFloat(amount) || 0;

  const estimatedReward = useMemo(
    () => calcStakingReward(numericAmount, periodDays),
    [numericAmount, periodDays]
  );

  const handleMax = useCallback(() => {
    if (shdBalance) {
      setAmount(formatTokenAmount(shdBalance, 18, 18));
    }
  }, [shdBalance]);

  const handleApprove = () => {
    if (!amount) return;
    approve(amount, 18);
  };

  const handleStake = () => {
    if (!amount || numericAmount <= 0) return;
    const parsedAmount = parseUnits(amount, 18);
    stake({
      amount: parsedAmount,
      period: periodDays,
      referrer: referrer ? (referrer as `0x${string}`) : undefined,
    });
  };

  const parsedAmount = numericAmount > 0 ? parseUnits(amount, 18) : BigInt(0);
  const showApproveStep = numericAmount > 0 && needsApproval(parsedAmount) && !isApproveConfirmed;

  return (
    <NetworkGuard>
      <PageContainer>
        <div className="animate-slide-up" style={{ animationDelay: "0s" }}>
          <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">认购 SHD</h1>
          <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">选择认购周期，认购 SHD 获取静态收益</p>
        </div>

        <div className="space-y-5 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {/* 左侧 — 认购表单 */}
          <div className="space-y-4 lg:col-span-2 sm:space-y-6">
            {/* 周期选择 */}
            <div className="animate-slide-up opacity-0" style={{ animationDelay: "0.08s" }}>
              <Card>
                <h3 className="mb-3 text-xs font-medium text-text-secondary sm:mb-4 sm:text-sm">
                  选择认购周期
                </h3>
                <Tabs
                  items={PERIOD_TABS}
                  activeKey={selectedPeriod}
                  onChange={setSelectedPeriod}
                  className="w-full"
                />
                <div className="mt-3 sm:mt-4">
                  <Badge variant="blue" pulse>日补贴 {dailyRate}%</Badge>
                </div>
              </Card>
            </div>

            {/* 数量输入 */}
            <div className="animate-slide-up opacity-0" style={{ animationDelay: "0.16s" }}>
              <Card>
                <Input
                  label="认购数量"
                  type="number"
                  placeholder="请输入认购 SHD 数量"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  suffix={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMax}
                        className="text-xs text-cyber-blue hover:text-cyber-blue/80 transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        MAX
                      </button>
                      <span className="text-xs font-medium sm:text-sm">SHD</span>
                    </div>
                  }
                />
                {shdBalance !== undefined && (
                  <p className="mt-2 text-[10px] text-text-muted sm:text-xs">
                    可用余额: {formatTokenAmount(shdBalance)} SHD
                  </p>
                )}
              </Card>
            </div>

            {/* 推荐人 */}
            <div className="animate-slide-up opacity-0" style={{ animationDelay: "0.24s" }}>
              <Card>
                <Input
                  label="推荐人地址（可选）"
                  placeholder="0x..."
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                />
              </Card>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 animate-slide-up opacity-0 sm:gap-4" style={{ animationDelay: "0.32s" }}>
              {!isConnected ? (
                <Button onClick={connectWallet} className="flex-1">
                  连接钱包
                </Button>
              ) : showApproveStep ? (
                <Button
                  onClick={handleApprove}
                  loading={isApproving || isApproveConfirming}
                  className="flex-1"
                >
                  {isApproveConfirming ? "授权确认中..." : "授权 SHD"}
                </Button>
              ) : (
                <Button
                  onClick={handleStake}
                  loading={isSending || isConfirming}
                  disabled={numericAmount <= 0}
                  className="flex-1"
                >
                  {isConfirming
                    ? "交易确认中..."
                    : isConfirmed
                    ? "✓ 认购成功!"
                    : "确认认购"}
                </Button>
              )}
            </div>
          </div>

          {/* 右侧 — 收益预估面板 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="animate-slide-up opacity-0 lg:animate-slide-left" style={{ animationDelay: "0.15s" }}>
              <Card glow={numericAmount > 0}>
                <h3 className="mb-3 text-xs font-medium text-text-secondary sm:mb-4 sm:text-sm">
                  收益预估
                </h3>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted sm:text-sm">认购数量</span>
                    <span className="text-xs font-medium text-text-primary transition-all duration-300 sm:text-sm">
                      {numericAmount.toLocaleString()} SHD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted sm:text-sm">认购周期</span>
                    <span className="text-xs font-medium text-text-primary sm:text-sm">
                      {periodDays} 天
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted sm:text-sm">日补贴</span>
                    <span className="text-xs font-medium text-cyber-blue sm:text-sm">
                      {dailyRate}%
                    </span>
                  </div>
                  <hr className="border-card-border" />
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted sm:text-sm">每日收益</span>
                    <span className="text-xs font-medium text-accent-green sm:text-sm">
                      {(numericAmount * dailyRate / 100).toFixed(4)} SHD
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary sm:text-sm">
                      预估到期可取
                    </span>
                    <span className={`text-base font-bold text-cyber-blue transition-all duration-500 sm:text-lg ${numericAmount > 0 ? "scale-110" : ""}`}>
                      {estimatedReward.toFixed(4)} SHD
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </NetworkGuard>
  );
}

export default function StakingPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <p className="text-text-muted">加载中…</p>
        </PageContainer>
      }
    >
      <StakingPageInner />
    </Suspense>
  );
}
