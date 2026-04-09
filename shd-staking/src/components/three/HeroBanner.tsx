"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, Preload } from "@react-three/drei";
import { ArrowRight } from "lucide-react";
import { CrystalModel } from "./CrystalModel";
import { SciFiEnvironment } from "./SciFiEnvironment";

export function HeroBanner() {
  return (
    <section>
      <div className="relative h-[32vh] w-full overflow-hidden touch-none sm:h-[55vh]">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <SciFiEnvironment />
            <CrystalModel />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={1.5}
              rotateSpeed={0.8}
            />
            <AdaptiveDpr pixelated />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 -mt-4 flex flex-col items-center px-4 pb-5 sm:-mt-10 sm:px-5 sm:pb-12">
        <h1 className="mb-1 text-center text-xl font-semibold leading-tight text-text-primary animate-slide-up opacity-0 sm:mb-2 sm:text-4xl" style={{ animationDelay: "0.2s" }}>
          可信数据空间酒类数据资产平台
        </h1>
        <p className="mb-3 text-center text-[10px] text-text-secondary animate-slide-up opacity-0 sm:mb-6 sm:text-sm" style={{ animationDelay: "0.35s" }}>
          酒类交易平台 · 质押生态系统
        </p>
        <a
          href="/staking"
          className="group inline-flex items-center rounded-xl bg-cyber-blue px-5 py-2.5 text-xs font-medium text-white transition-all duration-300 hover:bg-cyber-blue/90 hover:shadow-[0_0_28px_rgba(59,130,246,0.45)] active:scale-[0.97] animate-slide-up opacity-0 sm:px-6 sm:text-sm"
          style={{ animationDelay: "0.5s" }}
        >
          开始质押
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
