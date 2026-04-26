"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useAccount } from "wagmi";
import { PageContainer } from "@/components/layout/PageContainer";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Loading";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useTeamInfo } from "@/hooks/dashboard/useTeamInfo";
import { useDirectReferrals } from "@/hooks/dashboard/useDirectReferrals";
import { useTeamRewards } from "@/hooks/dashboard/useTeamRewards";
import { formatLargeNumber, formatAddress, formatTokenAmount } from "@/utils/format";
import { V_LEVEL_CONFIG } from "@/types/team";

export default function TeamPage() {
  const { isConnected, address } = useAccount();
  const { teamInfo, isLoading } = useTeamInfo();
  const { referrals, isLoading: referralsLoading } = useDirectReferrals();
  const {
    grants,
    pendingTotal,
    isLoading: rewardsLoading,
    isClaimPending,
    isClaimConfirming,
    isClaimed,
    claimAll,
    refetch: refetchTeamRewards,
  } = useTeamRewards();
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined" && address
      ? `${window.location.origin}/dashboard?ref=${address}`
      : "";

  const handleCopy = useCallback(() => {
    if (!inviteLink) return;
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteLink]);

  const currentConfig = teamInfo
    ? V_LEVEL_CONFIG[teamInfo.vLevel] ?? V_LEVEL_CONFIG[0]
    : V_LEVEL_CONFIG[0];

  const minorPerf = teamInfo
    ? Number(teamInfo.minorPerformance / BigInt(10 ** 18))
    : 0;

  useEffect(() => {
    if (isClaimed) void refetchTeamRewards();
  }, [isClaimed, refetchTeamRewards]);

  return (
    <NetworkGuard>
      <PageContainer>
        <div className="animate-slide-up">
          <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">我的团队</h1>
          <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">邀请好友、查看团队业绩与等级</p>
        </div>

        {/* 邀请好友 */}
        <AnimatedSection direction="up" delay={0.08}>
          <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-cyber-blue to-cyber-purple p-[1px] sm:mb-6">
            <div className="rounded-[11px] bg-deep-space/95 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <UserPlus className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
                <h2 className="text-sm font-semibold text-text-primary sm:text-base">邀请好友</h2>
              </div>
              {isConnected && address ? (
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="overflow-hidden rounded-lg border border-card-border bg-white/5 px-3 py-2.5 sm:flex-1 sm:px-4 sm:py-3">
                    <p className="truncate font-mono text-[10px] text-text-muted sm:text-xs">
                      {inviteLink}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full shrink-0 gap-1.5 sm:w-auto"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-card-border bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="text-xs text-text-muted sm:text-sm">请连接钱包</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* 团队统计 */}
        <AnimatedSection direction="up" delay={0.14}>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4">
            <Card hover>
              <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-blue/10 sm:mb-2 sm:h-9 sm:w-9">
                <Users className="h-4 w-4 text-cyber-blue" />
              </div>
              <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">团队总人数</p>
              {isLoading ? (
                <Skeleton className="h-7 w-14 sm:h-8 sm:w-16" />
              ) : (
                <p className="text-xl font-bold text-text-primary sm:text-2xl">
                  {teamInfo?.totalMembers ?? 0}
                </p>
              )}
            </Card>
            <Card hover>
              <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-purple/10 sm:mb-2 sm:h-9 sm:w-9">
                <UserPlus className="h-4 w-4 text-cyber-purple" />
              </div>
              <p className="mb-0.5 text-[10px] text-text-muted sm:text-xs">推荐人数</p>
              {isLoading ? (
                <Skeleton className="h-7 w-14 sm:h-8 sm:w-16" />
              ) : (
                <p className="text-xl font-bold text-text-primary sm:text-2xl">
                  {teamInfo?.directCount ?? 0}
                </p>
              )}
            </Card>
          </div>
        </AnimatedSection>

        {/* 团队总业绩 */}
        <AnimatedSection direction="up" delay={0.2}>
          <Card className="mb-5 sm:mb-6">
            <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-green/10 sm:h-7 sm:w-7">
                <TrendingUp className="h-3.5 w-3.5 text-accent-green sm:h-4 sm:w-4" />
              </div>
              <h3 className="text-xs font-medium text-text-secondary sm:text-sm">
                团队总业绩 (SHD)
              </h3>
            </div>

            {isLoading ? (
              <Skeleton className="mb-3 h-8 w-28 sm:h-10 sm:w-32" />
            ) : (
              <p className="mb-2.5 text-2xl font-bold text-accent-green sm:mb-3 sm:text-3xl">
                {teamInfo
                  ? formatLargeNumber(
                      Number(
                        (teamInfo.majorPerformance + teamInfo.minorPerformance) /
                          BigInt(10 ** 18)
                      )
                    )
                  : "0.00"}
              </p>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-text-muted">大区业绩:</span>
                <span className="font-medium text-text-primary">
                  {teamInfo
                    ? formatLargeNumber(
                        Number(teamInfo.majorPerformance / BigInt(10 ** 18))
                      )
                    : "0.00"}{" "}
                  SHD
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-text-muted">小区业绩:</span>
                <span className="font-medium text-text-primary">
                  {teamInfo
                    ? formatLargeNumber(
                        Number(teamInfo.minorPerformance / BigInt(10 ** 18))
                      )
                    : "0.00"}{" "}
                  SHD
                </span>
              </div>
            </div>
          </Card>
        </AnimatedSection>

        {/* 团队等级 */}
        <AnimatedSection direction="up" delay={0.26}>
          <Card className="mb-5 sm:mb-6">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-orange sm:h-5 sm:w-5" />
                <h3 className="text-sm font-semibold text-text-primary sm:text-base">团队等级</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyber-blue/15 shadow-[0_0_12px_rgba(59,130,246,0.2)] sm:h-9 sm:w-9">
                <span className="text-xs font-bold text-cyber-blue sm:text-sm">
                  {currentConfig.label === "普通用户"
                    ? "V0"
                    : currentConfig.label}
                </span>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-cyber-blue">
                小区业绩: {formatLargeNumber(minorPerf)} SHD
              </span>
            </div>
            <p className="text-[10px] text-text-muted sm:text-xs">等级由链上用户级别数据决定，后台导入后实时展示。</p>
          </Card>
        </AnimatedSection>

        {/* 团队奖励 */}
        <AnimatedSection direction="up" delay={0.3}>
          <Card className="mb-5 sm:mb-6">
            <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
                <h3 className="text-sm font-semibold text-text-primary sm:text-base">团队奖励</h3>
              </div>
              <Badge variant="blue">{grants.length} 笔</Badge>
            </div>

            {!isConnected ? (
              <p className="text-xs text-text-muted sm:text-sm">连接钱包后查看团队奖励</p>
            ) : rewardsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/[0.04] px-3 py-2.5">
                    <p className="text-[10px] text-text-muted sm:text-xs">待领取</p>
                    <p className="mt-1 text-sm font-semibold text-accent-green sm:text-base">{formatTokenAmount(pendingTotal, 18, 4)} SHD</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] px-3 py-2.5">
                    <p className="text-[10px] text-text-muted sm:text-xs">累计分配</p>
                    <p className="mt-1 text-sm font-semibold text-cyber-blue sm:text-base">{formatTokenAmount(teamInfo?.teamReward ?? BigInt(0), 18, 4)} SHD</p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  loading={isClaimPending || isClaimConfirming}
                  disabled={pendingTotal === BigInt(0)}
                  onClick={claimAll}
                >
                  {isClaimConfirming ? "领取确认中..." : pendingTotal === BigInt(0) ? "暂无可领取" : "领取团队奖励"}
                </Button>
                {isClaimed && <p className="text-center text-xs text-accent-green">团队奖励已领取</p>}
                {grants.length > 0 && (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {grants.slice(0, 8).map((grant) => (
                      <div key={grant.id} className="rounded-lg border border-card-border bg-white/[0.03] px-3 py-2 text-xs">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium text-text-primary">#{grant.id} / {grant.period} 天</span>
                          <span className="text-text-muted">来源 {formatAddress(grant.source)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted sm:text-xs">
                          <span>额度 {formatTokenAmount(grant.amount, 18, 4)} SHD</span>
                          <span>已领 {formatTokenAmount(grant.claimed, 18, 4)} SHD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </AnimatedSection>

        {/* 我的团队 - 直推列表 */}
        <AnimatedSection direction="up" delay={0.34}>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-text-secondary sm:mb-4 sm:text-lg">
            <Users className="h-4 w-4 text-cyber-blue sm:h-5 sm:w-5" />
            我的团队
          </h2>
          <Card>
            {!isConnected ? (
              <div className="py-8 text-center sm:py-12">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 sm:h-14 sm:w-14">
                  <Users className="h-6 w-6 text-text-muted sm:h-7 sm:w-7" />
                </div>
                <p className="text-xs text-text-muted sm:text-sm">连接钱包后查看团队成员</p>
              </div>
            ) : isLoading || referralsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full sm:h-14" />
                <Skeleton className="h-12 w-full sm:h-14" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="py-8 text-center sm:py-12">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 sm:h-14 sm:w-14">
                  <Users className="h-6 w-6 text-text-muted sm:h-7 sm:w-7" />
                </div>
                <p className="mb-1 text-xs text-text-muted sm:text-sm">暂无数据</p>
                <p className="text-[10px] text-text-muted sm:text-xs">
                  分享邀请链接邀请好友加入
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-card-border pb-2 text-[10px] text-text-muted sm:text-xs">
                  <span>直推成员</span>
                  <span>共 {referrals.length} 人</span>
                </div>
                {referrals.map((referral, index) => (
                  <div key={referral} className="flex items-center justify-between rounded-lg border border-card-border bg-white/[0.03] px-3 py-2.5 text-xs sm:text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary">直推成员 {index + 1}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-text-muted sm:text-xs">{referral}</p>
                    </div>
                    <Badge variant="blue">链上</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </AnimatedSection>
      </PageContainer>
    </NetworkGuard>
  );
}
