/**
 * @file utils/format.ts
 * @description 格式化工具函数 — 地址缩略、数字格式化、代币金额转换等。
 */

/**
 * 缩略以太坊地址，保留前6位和后4位
 * @example formatAddress("0x1234...abcd") => "0x1234...abcd"
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 将 BigInt 代币原始值转换为可读的小数字符串
 * @param value - 链上原始值 (wei 单位)
 * @param decimals - 代币精度
 * @param displayDecimals - 显示保留的小数位数
 */
export function formatTokenAmount(
  value: bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (value === BigInt(0)) return "0";

  const divisor = BigInt(10 ** decimals);
  const intPart = value / divisor;
  const fracPart = value % divisor;

  // 小数部分补零到指定精度后截断
  const fracStr = fracPart.toString().padStart(decimals, "0").slice(0, displayDecimals);

  // 整数部分添加千分位分隔
  const intStr = intPart.toLocaleString("en-US");

  // 去除末尾多余的零
  const trimmedFrac = fracStr.replace(/0+$/, "");
  return trimmedFrac ? `${intStr}.${trimmedFrac}` : intStr;
}

/**
 * 格式化百分比
 * @param value - 百分比数值（如 0.3 表示 0.3%）
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * 格式化大数字为带单位的缩写（万、亿）
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e8) return `${(num / 1e8).toFixed(2)}亿`;
  if (num >= 1e4) return `${(num / 1e4).toFixed(2)}万`;
  return num.toLocaleString("en-US");
}
