/**
 * @file constants/tokens.ts
 * @description 数据资产信息常量 — 三种核心数据资产的基础信息定义。
 */
import type { TokenInfo } from "@/types/token";

/** SHD — 商合道酒类交易平台生态数据资产 */
export const SHD_TOKEN: TokenInfo = {
  name: "生态数据资产",
  symbol: "SHD",
  decimals: 18,
  totalSupplyLabel: "2亿",
  color: "#00D4FF",
};

/** DHC — 帝皇池酱酒 RDA */
export const DHC_TOKEN: TokenInfo = {
  name: "帝皇池酱酒数据资产",
  symbol: "DHC",
  decimals: 18,
  totalSupplyLabel: "10亿",
  color: "#A855F7",
};

/** SCNY — 酒类交易平台稳定数据资产 */
export const SCNY_TOKEN: TokenInfo = {
  name: "酒类交易平台稳定数据资产",
  symbol: "SCNY",
  decimals: 18,
  totalSupplyLabel: "100亿",
  color: "#00FF88",
};

/** 所有数据资产列表 */
export const ALL_TOKENS = [SHD_TOKEN, DHC_TOKEN, SCNY_TOKEN] as const;
