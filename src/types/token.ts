/**
 * @file types/token.ts
 * @description 代币相关 TypeScript 类型定义。
 */

/** 代币基础信息 */
export interface TokenInfo {
  /** 代币名称 */
  name: string;
  /** 代币符号 */
  symbol: string;
  /** 合约地址 */
  address: `0x${string}`;
  /** 精度 */
  decimals: number;
  /** 总发行量描述 */
  totalSupplyLabel: string;
  /** 图标颜色（用于 UI 展示） */
  color: string;
}

/** 代币余额数据 */
export interface TokenBalanceData {
  /** 原始值 (wei) */
  raw: bigint;
  /** 格式化后的可读值 */
  formatted: string;
  /** 代币符号 */
  symbol: string;
}
