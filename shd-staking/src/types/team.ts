/**
 * @file types/team.ts
 * @description 团队层级与 V 等级相关 TypeScript 类型定义。
 */

/** V 等级枚举 (V1-V6) */
export type VLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** V 等级配置 */
export interface VLevelConfig {
  /** 等级 */
  level: VLevel;
  /** 等级名称 */
  label: string;
  /** 极差比例 (%) */
  rate: number;
  /** 所需小区业绩 (万) */
  requiredMinorPerformance: number;
}

/** 团队信息 */
export interface TeamInfo {
  /** 直推人数 */
  directCount: number;
  /** 团队总人数 */
  totalMembers: number;
  /** 大区业绩 */
  majorPerformance: bigint;
  /** 小区业绩（除大区外所有线业绩之和） */
  minorPerformance: bigint;
  /** 当前 V 等级 */
  vLevel: VLevel;
  /** 直推收益累计 */
  referralReward: bigint;
  /** 团队极差收益累计 */
  teamReward: bigint;
}

/** V 等级配置表 */
export const V_LEVEL_CONFIG: VLevelConfig[] = [
  { level: 0, label: "普通用户", rate: 0, requiredMinorPerformance: 0 },
  { level: 1, label: "V1", rate: 5, requiredMinorPerformance: 1 },
  { level: 2, label: "V2", rate: 10, requiredMinorPerformance: 5 },
  { level: 3, label: "V3", rate: 15, requiredMinorPerformance: 10 },
  { level: 4, label: "V4", rate: 20, requiredMinorPerformance: 30 },
  { level: 5, label: "V5", rate: 25, requiredMinorPerformance: 50 },
  { level: 6, label: "V6", rate: 0, requiredMinorPerformance: 100 },
];
