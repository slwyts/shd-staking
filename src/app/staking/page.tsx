/**
 * @file app/staking/page.tsx
 * @description 质押页面 — 选择质押周期、输入数量、预估收益、执行质押。
 *   包含 Approve + Stake 两步操作流程。
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { parseUnits } from "viem";
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
import { calcStakingReward, STAKING_DAILY_RATES } from "@/utils/calc";
import { formatTokenAmount } from "@/utils/format";
import type { StakingPeriod } from "@/types/staking";

/** 周期选项卡数据 */
const PERIOD_TABS = [
  { key: "7", label: "7 天" },
  { key: "30", label: "30 天" },
  { key: "180", label: "180 天" },
  { key: "360", label: "360 天" },
];

export default function StakingPage() {
  const { isConnected, connectWallet, address } = useWallet();
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

  // 选中的质押周期
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  // 输入的质押数量
  const [amount, setAmount] = useState("");
  // 推荐人地址
  const [referrer, setReferrer] = useState("");

  const periodDays = Number(selectedPeriod) as StakingPeriod;
  const dailyRate = STAKING_DAILY_RATES[periodDays] ?? 0;
  const numericAmount = parseFloat(amount) || 0;

  // 预估收益计算
  const estimatedReward = useMemo(
    () => calcStakingReward(numericAmount, periodDays),
    [numericAmount, periodDays]
  );

  // 填入最大余额
  const handleMax = useCallback(() => {
    if (shdBalance) {
      setAmount(formatTokenAmount(shdBalance, 18, 18));
    }
  }, [shdBalance]);

  // 执行授权
  const handleApprove = () => {
    if (!amount) return;
    approve(amount, 18);
  };

  // 执行质押
  const handleStake = () => {
    if (!amount || numericAmount <= 0) return;
    const parsedAmount = parseUnits(amount, 18);
    stake({
      amount: parsedAmount,
      period: periodDays,
      referrer: referrer ? (referrer as `0x${string}`) : undefined,
    });
  };

  // 判断当前步骤
  const parsedAmount = numericAmount > 0 ? parseUnits(amount, 18) : BigInt(0);
  const showApproveStep = numericAmount > 0 && needsApproval(parsedAmount) && !isApproveConfirmed;

  return (
    <NetworkGuard>
      <PageContainer className="pt-8">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">质押 SHD</h1>
        <p className="mb-8 text-text-secondary">
          选择质押周期，质押 SHD 获取静态收益
        </p>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧 — 质押表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 周期选择 — 赛博切角卡片 */}
            <Card>
              <h3 className="mb-4 text-sm font-medium text-text-secondary">
                选择质押周期
              </h3>
              <Tabs
                items={PERIOD_TABS}
                activeKey={selectedPeriod}
                onChange={setSelectedPeriod}
                className="w-full"
              />
              <div className="mt-4 flex items-center gap-4">
                <Badge variant="blue">日化 {dailyRate}%</Badge>
                <Badge variant="green">
                  总收益率 {(dailyRate * periodDays).toFixed(1)}%
                </Badge>
              </div>
            </Card>

            {/* 数量输入 */}
            <Card>
              <Input
                label="质押数量"
                type="number"
                placeholder="请输入质押 SHD 数量"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                suffix={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMax}
                      className="text-xs text-cyber-blue hover:text-cyber-blue/80"
                    >
                      MAX
                    </button>
                    <span className="text-sm font-medium">SHD</span>
                  </div>
                }
              />
              {shdBalance !== undefined && (
                <p className="mt-2 text-xs text-text-muted">
                  可用余额: {formatTokenAmount(shdBalance)} SHD
                </p>
              )}
            </Card>

            {/* 推荐人 */}
            <Card>
              <Input
                label="推荐人地址（可选）"
                placeholder="0x..."
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
              />
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-4">
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
                    ? "质押成功!"
                    : "确认质押"}
                </Button>
              )}
            </div>
          </div>

          {/* 右侧 — 收益预估面板 */}
          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 text-sm font-medium text-text-secondary">
                收益预估
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">质押数量</span>
                  <span className="text-sm font-medium text-text-primary">
                    {numericAmount.toLocaleString()} SHD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">质押周期</span>
                  <span className="text-sm font-medium text-text-primary">
                    {periodDays} 天
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">日化收益率</span>
                  <span className="text-sm font-medium text-cyber-blue">
                    {dailyRate}%
                  </span>
                </div>
                <hr className="border-card-border" />
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">每日收益</span>
                  <span className="text-sm font-medium text-accent-green">
                    {(numericAmount * dailyRate / 100).toFixed(4)} SHD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text-secondary">
                    预估总收益
                  </span>
                  <span className="text-lg font-bold text-cyber-blue">
                    {estimatedReward.toFixed(4)} SHD
                  </span>
                </div>
              </div>
            </Card>

            {/* 推荐链接 */}
            {isConnected && address && (
              <Card>
                <h3 className="mb-3 text-sm font-medium text-text-secondary">
                  我的推荐链接
                </h3>
                <div className="cut-corners bg-white/5 p-3">
                  <p className="break-all text-xs font-mono text-text-muted">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/staking?ref=${address}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/staking?ref=${address}`
                    );
                  }}
                >
                  复制推荐链接
                </Button>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </NetworkGuard>
  );
}
