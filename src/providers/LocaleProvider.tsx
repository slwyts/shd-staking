"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Locale = "zh" | "en";

const dict = {
  zh: {
    "header.installWallet": "连接钱包",
    "header.connectWallet": "连接钱包",
    "header.connecting": "连接中...",
    "header.theme": "切换主题",
    "nav.home": "首页",
    "nav.staking": "质押",
    "nav.dashboard": "个人中心",
    "nav.swap": "兑换",
    "dashboard.title": "个人中心",
    "dashboard.subtitle": "管理钱包、查看资产与团队业绩",
    "dashboard.totalAssets": "总资产估值",
    "dashboard.announcement": "立即质押 SHD，赚取每日静态收益，参与直推与团队极差奖励。",
    "dashboard.goStake": "去质押",
    "dashboard.bindReferrer": "绑定邀请人",
    "dashboard.enterReferrer": "输入上级地址 0x...",
    "dashboard.bind": "绑定",
    "dashboard.copyInvite": "复制邀请链接",
    "dashboard.copied": "已复制",
    "dashboard.myOrders": "我的订单",
    "dashboard.noOrders": "当前还没有链上订单。",
    "dashboard.wallet": "链上钱包",
    "dashboard.selectConnect": "选择连接方式",
    "dashboard.connect": "连接",
    "dashboard.walletConnected": "钱包已连接",
    "dashboard.walletAddress": "钱包地址",
    "dashboard.copy": "复制",
    "dashboard.currentNetwork": "当前网络",
    "dashboard.connectMethod": "连接方式",
    "dashboard.disconnect": "断开钱包连接",
    "dashboard.earnings": "收益统计",
    "dashboard.staticReward": "静态收益",
    "dashboard.referralReward": "直推收益",
    "dashboard.teamReward": "团队极差收益",
    "dashboard.totalReward": "累计收益",
    "dashboard.positions": "质押持仓",
    "dashboard.noPositions": "暂无质押持仓",
    "dashboard.goStaking": "前往质押",
    "dashboard.unstake": "解除质押",
    "dashboard.team": "团队业绩",
    "dashboard.level": "当前等级",
    "dashboard.directCount": "直推人数",
    "dashboard.totalMembers": "团队总人数",
    "dashboard.majorPerf": "大区业绩",
    "dashboard.minorPerf": "小区业绩（除大区外所有线）",
    "dashboard.quickLinks": "快捷链接",
    "dashboard.officialSite": "官方网站",
    "dashboard.explorer": "区块浏览器",
    "dashboard.stakingContract": "质押合约",
    "staking.title": "质押 SHD",
    "staking.subtitle": "选择质押方案，获取每日静态收益",
    "common.days": "天",
    "common.period": "天周期",
    "common.ongoing": "进行中",
    "common.expired": "已到期",
    "common.ready": "已就绪",
    "common.switchNetwork": "待切换网络",
  },
  en: {
    "header.installWallet": "Connect Wallet",
    "header.connectWallet": "Connect",
    "header.connecting": "Connecting...",
    "header.theme": "Toggle Theme",
    "nav.home": "Home",
    "nav.staking": "Stake",
    "nav.dashboard": "Profile",
    "nav.swap": "Swap",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Manage wallet, view assets & team performance",
    "dashboard.totalAssets": "Total Assets",
    "dashboard.announcement": "Stake SHD now to earn daily rewards and participate in referral & team bonuses.",
    "dashboard.goStake": "Stake Now",
    "dashboard.bindReferrer": "Bind Referrer",
    "dashboard.enterReferrer": "Enter referrer address 0x...",
    "dashboard.bind": "Bind",
    "dashboard.copyInvite": "Copy Invite Link",
    "dashboard.copied": "Copied",
    "dashboard.myOrders": "My Orders",
    "dashboard.noOrders": "No on-chain orders yet.",
    "dashboard.wallet": "On-Chain Wallet",
    "dashboard.selectConnect": "Select connection method",
    "dashboard.connect": "Connect",
    "dashboard.walletConnected": "Wallet Connected",
    "dashboard.walletAddress": "Wallet Address",
    "dashboard.copy": "Copy",
    "dashboard.currentNetwork": "Network",
    "dashboard.connectMethod": "Connection",
    "dashboard.disconnect": "Disconnect Wallet",
    "dashboard.earnings": "Earnings",
    "dashboard.staticReward": "Static Reward",
    "dashboard.referralReward": "Referral Reward",
    "dashboard.teamReward": "Team Reward",
    "dashboard.totalReward": "Total Reward",
    "dashboard.positions": "Staking Positions",
    "dashboard.noPositions": "No staking positions",
    "dashboard.goStaking": "Go to Stake",
    "dashboard.unstake": "Unstake",
    "dashboard.team": "Team Performance",
    "dashboard.level": "Level",
    "dashboard.directCount": "Direct Referrals",
    "dashboard.totalMembers": "Total Members",
    "dashboard.majorPerf": "Major Zone",
    "dashboard.minorPerf": "Minor Zone (all except major)",
    "dashboard.quickLinks": "Quick Links",
    "dashboard.officialSite": "Official Site",
    "dashboard.explorer": "Block Explorer",
    "dashboard.stakingContract": "Staking Contract",
    "staking.title": "Stake SHD",
    "staking.subtitle": "Choose a plan and earn daily rewards",
    "common.days": "D",
    "common.period": "D period",
    "common.ongoing": "Active",
    "common.expired": "Expired",
    "common.ready": "Ready",
    "common.switchNetwork": "Switch Network",
  },
} as const;

type DictKey = keyof (typeof dict)["zh"];

interface LocaleCtx {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: DictKey) => string;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "zh",
  toggleLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "shd-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "zh") setLocale(saved);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: DictKey): string => dict[locale][key] ?? key,
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
