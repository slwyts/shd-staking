/**
 * @file types/team.ts
 * @description 团队层级与 V 等级相关 TypeScript 类型定义。
 */

/** 区域代理等级枚举：0普通、1区县、2市、3省 */
export type VLevel = 0 | 1 | 2 | 3;

/** V 等级配置 */
export interface VLevelConfig {
  /** 等级 */
  level: VLevel;
  /** 等级名称 */
  label: string;
}

/** 团队信息 */
export interface TeamInfo {
  /** 直推人数 */
  directCount: number;
  /** 团队总人数 */
  totalMembers: number;
  /** 当前活跃质押 */
  majorPerformance: bigint;
  /** 保留字段 */
  minorPerformance: bigint;
  /** 当前 V 等级 */
  vLevel: VLevel;
  /** 是否运营中心 */
  operationCenter: boolean;
  /** 直推收益累计 */
  referralReward: bigint;
  /** 团队极差收益累计 */
  teamReward: bigint;
}

/** 区域代理等级配置表 */
export const V_LEVEL_CONFIG: VLevelConfig[] = [
  { level: 0, label: "普通用户" },
  { level: 1, label: "区县代理" },
  { level: 2, label: "市级代理" },
  { level: 3, label: "省级代理" },
];
