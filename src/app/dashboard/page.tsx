/**
 * @file app/dashboard/page.tsx
 * @description 仪表盘页面 — 资产概览、质押持仓、收益统计、团队面板。
 *   用户的个人中心，展示所有与自己相关的数据。
 */
"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Loading";
import { useWallet } from "@/hooks/common/useWallet";
import { useTokenBalance } from "@/hooks/token/useTokenBalance";
import { useMyPositions } from "@/hooks/dashboard/useMyPositions";
import { useMyRewards } from "@/hooks/dashboard/useMyRewards";
import { useTeamInfo } from "@/hooks/dashboard/useTeamInfo";
import { useUnstake } from "@/hooks/staking/useUnstake";
import { SHD_TOKEN_ADDRESS, DHC_TOKEN_ADDRESS, SCNY_TOKEN_ADDRESS } from "@/constants/contracts";
import { formatTokenAmount, formatLargeNumber } from "@/utils/format";
import { V_LEVEL_CONFIG } from "@/types/team";

export default function DashboardPage() {
  const { isConnected, connectWallet } = useWallet();
  const { balance: shdBalance, isLoading: shdLoading } = useTokenBalance(SHD_TOKEN_ADDRESS);
  const { balance: dhcBalance, isLoading: dhcLoading } = useTokenBalance(DHC_TOKEN_ADDRESS);
  const { balance: scnyBalance, isLoading: scnyLoading } = useTokenBalance(SCNY_TOKEN_ADDRESS);
  const { activePositions, isLoading: positionsLoading } = useMyPositions();
  const { rewards } = useMyRewards();
  const { teamInfo, isLoading: teamLoading } = useTeamInfo();
  const { unstake, isSending: isUnstaking } = useUnstake();

  // 未连接钱包
  if (!isConnected) {
    return (
      <PageContainer className="pt-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h2 className="mb-4 text-2xl font-bold text-text-primary">我的仪表盘</h2>
          <p className="mb-6 text-text-secondary">连接钱包以查看您的资产和收益</p>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <NetworkGuard>
      <PageContainer className="pt-8">
        <h1 className="mb-8 text-3xl font-bold text-text-primary">我的仪表盘</h1>

        {/* ===== 资产概览 ===== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">资产概览</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* SHD 余额 */}
            <Card hover>
              <p className="mb-1 text-sm text-text-muted">SHD 余额</p>
              {shdLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-cyber-blue">
                  {formatTokenAmount(shdBalance ?? BigInt(0))}
                </p>
              )}
            </Card>
            {/* DHC 余额 */}
            <Card hover>
              <p className="mb-1 text-sm text-text-muted">DHC 余额</p>
              {dhcLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-cyber-purple">
                  {formatTokenAmount(dhcBalance ?? BigInt(0))}
                </p>
              )}
            </Card>
            {/* SCNY 余额 */}
            <Card hover>
              <p className="mb-1 text-sm text-text-muted">SCNY 余额</p>
              {scnyLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-accent-green">
                  {formatTokenAmount(scnyBalance ?? BigInt(0))}
                </p>
              )}
            </Card>
          </div>
        </section>

        {/* ===== 收益统计 ===== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">收益统计</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="mb-1 text-xs text-text-muted">静态收益</p>
              <p className="text-lg font-bold text-text-primary">
                {formatTokenAmount(rewards.staticReward)} SHD
              </p>
            </Card>
            <Card>
              <p className="mb-1 text-xs text-text-muted">直推收益</p>
              <p className="text-lg font-bold text-text-primary">
                {formatTokenAmount(rewards.referralReward)} SHD
              </p>
            </Card>
            <Card>
              <p className="mb-1 text-xs text-text-muted">团队极差收益</p>
              <p className="text-lg font-bold text-text-primary">
                {formatTokenAmount(rewards.teamReward)} SHD
              </p>
            </Card>
            <Card className="border border-cyber-blue/30">
              <p className="mb-1 text-xs text-text-muted">总收益</p>
              <p className="text-lg font-bold text-cyber-blue">
                {formatTokenAmount(rewards.totalReward)} SHD
              </p>
            </Card>
          </div>
        </section>

        {/* ===== 质押持仓 ===== */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">
            质押持仓
            {activePositions.length > 0 && (
              <Badge variant="blue" className="ml-2">{activePositions.length}</Badge>
            )}
          </h2>

          {positionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activePositions.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-text-muted">暂无质押持仓</p>
              <a
                href="/staking"
                className="mt-3 inline-block text-sm text-cyber-blue hover:underline"
              >
                前往质押
              </a>
            </Card>
          ) : (
            <div className="space-y-3">
              {activePositions.map((pos) => {
                const isExpired = Date.now() / 1000 > pos.endTime;
                return (
                  <Card key={pos.id} hover>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">
                            {formatTokenAmount(pos.amount)} SHD
                          </span>
                          <Badge variant={isExpired ? "green" : "blue"}>
                            {pos.period}天 · {isExpired ? "已到期" : "进行中"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {new Date(pos.startTime * 1000).toLocaleDateString()} →{" "}
                          {new Date(pos.endTime * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      {isExpired && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isUnstaking}
                          onClick={() => unstake(pos.id)}
                        >
                          解除质押
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== 团队面板 ===== */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">团队业绩</h2>
          {teamLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* 团队概况 */}
              <Card>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">当前等级</span>
                    <Badge variant="purple">
                      {teamInfo
                        ? V_LEVEL_CONFIG[teamInfo.vLevel]?.label ?? "普通用户"
                        : "普通用户"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">直推人数</span>
                    <span className="text-sm font-medium text-text-primary">
                      {teamInfo?.directCount ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">团队总人数</span>
                    <span className="text-sm font-medium text-text-primary">
                      {teamInfo?.totalMembers ?? 0}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 大小区业绩 */}
              <Card>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm text-text-muted">大区业绩</p>
                    <p className="text-xl font-bold text-text-primary">
                      {teamInfo
                        ? formatLargeNumber(
                            Number(teamInfo.majorPerformance / BigInt(10 ** 18))
                          )
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-text-muted">
                      小区业绩（除大区外所有线）
                    </p>
                    <p className="text-xl font-bold text-cyber-blue">
                      {teamInfo
                        ? formatLargeNumber(
                            Number(teamInfo.minorPerformance / BigInt(10 ** 18))
                          )
                        : "0"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </section>
      </PageContainer>
    </NetworkGuard>
  );
}
