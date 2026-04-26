/**
 * @file config/wagmi.ts
 * @description Wagmi 全局配置 — 定义支持的链、传输方式和连接器。
 *   本项目仅支持 DOR Network 单链。
 */
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { developmentDorNetwork, dorNetwork, productionDorNetwork } from "./chains";

/** Wagmi 全局配置实例 */
export const wagmiConfig = createConfig({
  chains: [dorNetwork],
  connectors: [
    injected(),
  ],
  transports: {
    [developmentDorNetwork.id]: http(),
    [productionDorNetwork.id]: http(),
  },
});
