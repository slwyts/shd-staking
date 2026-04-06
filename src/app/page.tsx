/**
 * @file app/page.tsx
 * @description 首页 — 3D Banner + 代币介绍 + 质押收益率展示 + CTA。
 *   作为项目的门面页面，展示核心信息并引导用户前往质押。
 */
"use client";

import { HeroBanner } from "@/components/three/HeroBanner";
import { StarBackground } from "@/components/three/StarBackground";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ALL_TOKENS } from "@/constants/tokens";
import { STAKING_DAILY_RATES } from "@/utils/calc";

/** 质押周期展示配置 */
const STAKING_PERIODS = [
  { days: 7, label: "7 天", rate: STAKING_DAILY_RATES[7] },
  { days: 30, label: "30 天", rate: STAKING_DAILY_RATES[30] },
  { days: 180, label: "180 天", rate: STAKING_DAILY_RATES[180] },
  { days: 360, label: "360 天", rate: STAKING_DAILY_RATES[360] },
];

export default function HomePage() {
  return (
    <div className="relative">
      <StarBackground />

      <div className="relative z-10">
      <HeroBanner />

      {/* ===== 代币介绍区域 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-text-primary">
          核心代币
        </h2>
        <p className="mb-10 text-center text-text-secondary">
          三种独立发行的代币，构建完整生态体系
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_TOKENS.map((token) => (
            <Card key={token.symbol} hover>
              {/* 代币图标 */}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center cut-corners"
                style={{ backgroundColor: `${token.color}20` }}
              >
                <span
                  className="text-xl font-bold"
                  style={{ color: token.color }}
                >
                  {token.symbol[0]}
                </span>
              </div>

              {/* 代币名称与符号 */}
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-primary">
                  {token.symbol}
                </h3>
                <Badge variant={
                  token.symbol === "SHD" ? "blue" :
                  token.symbol === "DHC" ? "purple" : "green"
                }>
                  {token.totalSupplyLabel}
                </Badge>
              </div>

              <p className="text-sm text-text-secondary">{token.name}</p>

              {/* SHD 特殊标识 */}
              {token.symbol === "SHD" && (
                <p className="mt-3 text-xs text-cyber-blue">
                  含代币税（滑点）机制 · 可质押获取收益
                </p>
              )}
              {token.symbol === "SCNY" && (
                <p className="mt-3 text-xs text-accent-green">
                  价值恒定: 1 SCNY = 1 CNY
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ===== 质押收益率展示 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-text-primary">
          质押收益
        </h2>
        <p className="mb-10 text-center text-text-secondary">
          质押 SHD 参与子生态模式，选择不同周期获取静态收益
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STAKING_PERIODS.map((period) => (
            <Card key={period.days} hover className="text-center">
              <p className="mb-1 text-sm text-text-secondary">{period.label}</p>
              <p className="mb-3 text-4xl font-bold text-cyber-blue">
                {period.rate}%
              </p>
              <p className="text-xs text-text-muted">日化收益率</p>

              {/* 预估年化 */}
              <div className="mt-4 cut-corners bg-white/5 px-3 py-2">
                <p className="text-xs text-text-muted">
                  预估总收益率:{" "}
                  <span className="text-cyber-blue font-medium">
                    {(period.rate * period.days).toFixed(1)}%
                  </span>
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a
            href="/staking"
            className="cut-corners inline-flex items-center bg-cyber-blue px-8 py-3.5 text-base font-semibold text-deep-space transition-all hover:bg-cyber-blue/85"
          >
            立即质押
          </a>
        </div>
      </section>

      {/* ===== 动态收益说明 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-text-primary">
          动态收益
        </h2>
        <p className="mb-10 text-center text-text-secondary">
          通过推荐和团队建设获取额外收益
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* 直推收益 */}
          <Card hover>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
              直接推荐收益
            </h3>
            <p className="text-4xl font-bold text-cyber-blue">10%</p>
            <p className="mt-2 text-sm text-text-secondary">
              直接推荐的下级质押金额的 10% 作为推荐奖励
            </p>
          </Card>

          {/* 团队极差 */}
          <Card hover>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
              团队极差收益
            </h3>
            <div className="space-y-2">
              {[
                { level: "V1", rate: "5%", req: "1万" },
                { level: "V2", rate: "10%", req: "5万" },
                { level: "V3", rate: "15%", req: "10万" },
                { level: "V4", rate: "20%", req: "30万" },
                { level: "V5", rate: "25%", req: "50万" },
                { level: "V6", rate: "全网5%加权", req: "100万" },
              ].map((v) => (
                <div
                  key={v.level}
                  className="flex items-center justify-between cut-corners bg-white/5 px-3 py-1.5"
                >
                  <Badge variant="purple">{v.level}</Badge>
                  <span className="text-sm text-cyber-blue">{v.rate}</span>
                  <span className="text-xs text-text-muted">
                    小区 {v.req}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      </div>
    </div>
  );
}
