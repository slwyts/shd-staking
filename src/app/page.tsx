"use client";

import { HeroBanner } from "@/components/three/HeroBanner";
import { StarBackground } from "@/components/three/StarBackground";
import { Badge } from "@/components/ui/Badge";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ALL_TOKENS } from "@/constants/tokens";
import { STAKING_DAILY_RATES } from "@/utils/calc";

const STAKING_PERIODS = [
  { days: 90, label: "90 天", rate: STAKING_DAILY_RATES[90] },
  { days: 180, label: "180 天", rate: STAKING_DAILY_RATES[180] },
  { days: 360, label: "360 天", rate: STAKING_DAILY_RATES[360] },
];

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden">
      <StarBackground />

      <div className="relative z-10">
        <HeroBanner />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* 核心数据资产 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyber-blue/8 blur-[120px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyber-blue sm:text-xs">Core Assets</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">核心数据资产</h2>
                <p className="mx-auto mb-5 max-w-md text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">三种独立发行的数据资产，构建完整生态体系</p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-3 gap-3 sm:gap-10">
              {ALL_TOKENS.map((token, i) => (
                <AnimatedSection key={token.symbol} direction="up" delay={0.08 * (i + 1)}>
                  <div className="group flex flex-col items-center text-center">
                    <div className="relative mb-2 sm:mb-5">
                      <div
                        className="absolute -inset-1 rounded-full opacity-30 blur-md transition-opacity duration-500 group-hover:opacity-60 sm:-inset-2 sm:blur-xl"
                        style={{ backgroundColor: token.color }}
                      />
                      <div
                        className="relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14"
                        style={{
                          background: `linear-gradient(135deg, ${token.color}30, ${token.color}08)`,
                        }}
                      >
                        <span className="text-lg font-black sm:text-2xl" style={{ color: token.color }}>
                          {token.symbol[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
                      <h3 className="text-sm font-bold text-text-primary sm:text-lg">{token.symbol}</h3>
                      <Badge variant={token.symbol === "SHD" ? "blue" : token.symbol === "DHC" ? "purple" : "green"}>
                        {token.totalSupplyLabel}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-text-secondary sm:mt-1.5 sm:text-sm">{token.name}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* 贡献收益 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -right-20 top-10 h-60 w-60 rounded-full bg-cyber-purple/8 blur-[120px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent-green sm:text-xs">Rewards</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">贡献收益</h2>
                <p className="mx-auto mb-4 max-w-md text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">选择不同周期获取静态收益</p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-8 lg:grid-cols-3">
              {STAKING_PERIODS.map((period, i) => (
                <AnimatedSection key={period.days} direction="up" delay={0.08 * (i + 1)}>
                  <div className="group text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:text-xs">{period.label}</p>
                    <p className="mt-1 text-2xl font-black text-cyber-blue transition-transform duration-300 group-hover:scale-105 sm:mt-2 sm:text-4xl">
                      {period.rate}%
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-secondary sm:mt-1 sm:text-sm">日补贴</p>
                    <div className="mx-auto mt-2 h-px w-8 rounded-full bg-cyber-blue/30 sm:mt-3 sm:w-12" />
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection direction="up" delay={0.2} className="mt-5 text-center sm:mt-8">
              <a
                href="/staking"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyber-blue px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-all duration-300 hover:bg-cyber-blue/90 hover:shadow-[0_0_32px_rgba(59,130,246,0.4)] active:scale-[0.97] sm:w-auto sm:py-3.5"
              >
                立即认购
              </a>
            </AnimatedSection>
          </section>

          {/* SHD 报单产品包 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent-green/8 blur-[110px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyber-blue sm:text-xs">SHD Order</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">SHD 报单产品包</h2>
                <p className="mx-auto mb-4 max-w-2xl text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">
                  通过 DAPP 使用 SHD 购买报单产品包，购买数据与用户 UID 同步至商城 APP。
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.08}>
              <div className="rounded-2xl border border-card-border bg-white/5 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5 sm:gap-3">
                  {[
                    "5000 产品包",
                    "1W 产品包",
                    "3W 产品包",
                    "5W 产品包",
                    "10W 产品包",
                  ].map((pkg) => (
                    <div key={pkg} className="rounded-xl border border-cyber-blue/20 bg-cyber-blue/5 px-2 py-2 text-[10px] font-semibold text-cyber-blue sm:py-2.5 sm:text-xs">
                      {pkg}
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 text-[10px] leading-relaxed text-text-secondary sm:mt-5 sm:space-y-2.5 sm:text-sm">
                  <p>1. 根据 SHD-SCNY 获取 SHD 实时价格，扣除对应数量 SHD。</p>
                  <p>2. 同步 UID 与报单产品包数据接口给 APP，APP 发放对应权益。</p>
                </div>
              </div>
            </AnimatedSection>
          </section>

          {/* 动态收益 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-amber-orange/6 blur-[100px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-orange sm:text-xs">Referral</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">动态收益</h2>
                <p className="mx-auto mb-4 max-w-md text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">通过推荐获取额外收益</p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.1}>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:text-xs">直接推荐收益</p>
                <p className="mt-1.5 text-4xl font-black text-cyber-blue sm:mt-3 sm:text-5xl">5%</p>
                <p className="mt-1 text-[10px] leading-relaxed text-text-secondary sm:mt-2 sm:text-sm">直推下级认购金额的 5% 作为奖励</p>
                <div className="mx-auto mt-2.5 h-px w-12 rounded-full bg-amber-orange/30 sm:mt-4 sm:w-16" />
              </div>
            </AnimatedSection>
          </section>
        </div>
      </div>
    </div>
  );
}
