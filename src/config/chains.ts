/**
 * @file config/chains.ts
 * @description DApp 链定义，根据 NEXT_PUBLIC_APP_MODE 选择开发链或生产链。
 */
import { defineChain } from "viem";
import { isDevelopmentMode } from "./appMode";

/** DOR Network — 生产链 */
export const productionDorNetwork = defineChain({
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

/** Hardhat Local — 本地开发链 */
export const developmentDorNetwork = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "DOR",
    symbol: "DOR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
});

/** 当前 DApp 模式使用的目标链。 */
export const dorNetwork = isDevelopmentMode ? developmentDorNetwork : productionDorNetwork;
