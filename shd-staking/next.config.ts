/**
 * @file next.config.ts
 * @description Next.js 配置文件 — 启用静态导出 (SSG) 模式，
 *   所有页面在构建时生成静态 HTML，运行时全部走 CSR。
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
