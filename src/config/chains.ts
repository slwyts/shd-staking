/**
 * @file config/chains.ts
 * @description DOR Network 自定义链定义。
 *   项目方专属公链参数，包含 RPC、区块浏览器等网络信息。
 */
import { defineChain } from "viem";

/** DOR Network — 项目方专属公链 */
export const dorNetwork = defineChain({
  id: 6860686,
  name: "DOR Network",
  nativeCurrency: {
    name: "DOR",
    symbol: "DOR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bjwmls.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "DOR Explorer",
      url: "https://block.bjwmls.com",
      apiUrl: "https://block.bjwmls.com/api",
    },
  },
});
