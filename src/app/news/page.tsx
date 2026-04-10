"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  date: string;
}

const NEWS_LIST: NewsItem[] = [
  {
    id: 1,
    title: "SHD 数据资产认购系统正式上线",
    summary:
      "可信数据空间酒类数据资产平台 DAPP 正式上线，用户可参与认购获取每日收益。",
    content:
      "可信数据空间酒类数据资产平台 DAPP 已于今日正式上线。用户可通过连接钱包参与 SHD 数据资产认购，选择 7 天、30 天、180 天或 360 天等不同周期，获取对应的日化收益。同时，平台支持推荐好友获取 10% 直推奖励，共建生态共同受益。",
    date: "2026-04-07",
  },
  {
    id: 2,
    title: "SHD 经济模型",
    summary:
      "SHD 数据资产总发行量 2 亿枚，含交易税机制，支持认购与兑换。",
    content:
      "SHD 经济模型\n\n总量：2 亿枚\n锁仓：50% 用于生态建设\n流通：1 亿枚\n锚定：DOR 公链生态\n\n交易税机制：\n• 买入滑点 3.5%（LP 分红 1.5% + 直接销毁 2.0%）\n• 卖出滑点 3.5%（LP 分红 1.5% + 营销补贴 1.5% + 回流底池 0.5%）\n\n通过通缩机制确保数据资产长期价值稳定增长。",
    date: "2026-04-07",
  },
  {
    id: 3,
    title: "关于 DHC 帝皇池酱酒 RDA 数据资产的公告",
    summary:
      "DHC 数据资产总发行量 10 亿枚，锚定帝皇池酱酒实物资产，实现链上确权与流通。",
    content:
      "DHC（帝皇池酱酒 RDA）是基于 DOR 公链发行的实物资产数据化凭证。每一枚 DHC 均对应真实酱酒资产，通过区块链技术实现资产确权、溯源和流通。\n\n总发行量：10 亿枚\n资产类型：实物锚定型数据资产\n应用场景：酒类交易、认购、兑换\n\n持有 DHC 即拥有对应酱酒资产的链上权益凭证。",
    date: "2026-04-06",
  },
  {
    id: 4,
    title: "SCNY 稳定数据资产说明",
    summary:
      "SCNY 锚定 1 CNY，总发行量 100 亿枚，用于平台内交易结算。",
    content:
      "SCNY 是平台内的稳定数据资产，1 SCNY = 1 CNY，用于 SHD 与法币之间的价值桥梁。\n\n总发行量：100 亿枚\n锚定价值：1 SCNY = 1 CNY\n用途：兑换交易、认购结算\n\n用户可通过兑换功能在 SHD 与 SCNY 之间进行交易。",
    date: "2026-04-06",
  },
  {
    id: 5,
    title: "认购收益规则与团队奖励说明",
    summary:
      "详细说明认购收益计算方式、推荐奖励机制以及团队等级体系。",
    content:
      "一、静态收益\n选择不同认购周期可获得对应日化收益率：\n• 7 天周期\n• 30 天周期\n• 180 天周期\n• 360 天周期\n\n二、直推奖励\n推荐好友认购可获得下级认购金额的 10% 作为直推收益。\n\n三、团队极差收益\n根据小区业绩达到不同 V 等级，可获得对应比例的团队极差收益：\nV1-V5 分别对应 5%-25% 的极差比例\nV6 可参与全网 5% 的加权分红。",
    date: "2026-04-05",
  },
];

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatedSection direction="up" delay={0.06 * index}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="glass-card card-hover-glow w-full cursor-pointer text-left transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-semibold leading-snug text-text-primary sm:mb-1.5 sm:text-[15px]">
              {item.title}
            </h3>
            <p className="text-[10px] leading-relaxed text-text-muted line-clamp-2 sm:text-xs">
              {item.summary}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
            <span className="text-[10px] text-text-muted sm:text-[11px]">{item.date}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-text-muted transition-transform duration-300 sm:h-4 sm:w-4 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        <div
          className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            maxHeight: expanded ? "600px" : "0",
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="border-t border-card-border px-4 py-3 sm:px-5 sm:py-4">
            <div className="whitespace-pre-line text-xs leading-relaxed text-text-secondary sm:text-sm">
              {item.content}
            </div>
          </div>
        </div>
      </button>
    </AnimatedSection>
  );
}

export default function NewsPage() {
  return (
    <PageContainer>
      <div className="animate-slide-up">
        <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">系统公告</h1>
        <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">平台最新动态与规则说明</p>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {NEWS_LIST.map((item, i) => (
          <NewsCard key={item.id} item={item} index={i} />
        ))}
      </div>

      <p className="mt-6 pb-4 text-center text-[10px] text-text-muted sm:mt-8 sm:text-xs">
        — 暂无更多公告 —
      </p>
    </PageContainer>
  );
}
