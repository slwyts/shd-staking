"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { CrystalModel } from "./CrystalModel";
import { SciFiEnvironment } from "./SciFiEnvironment";

export function HeroBanner() {
  return (
    <section>
      <div className="relative h-[65vh] w-full overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <SciFiEnvironment />
            <CrystalModel />
            <AdaptiveDpr pixelated />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 -mt-10 flex flex-col items-center pb-16">
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-text-primary sm:text-6xl md:text-7xl">
          SHD Staking
        </h1>
        <p className="mb-6 max-w-lg text-center text-lg text-text-secondary sm:text-xl">
          商合道酒类交易平台 · 质押生态系统
        </p>
        <a
          href="/staking"
          className="cut-corners inline-flex items-center bg-cyber-blue px-8 py-3.5 text-base font-semibold text-deep-space transition-all hover:bg-cyber-blue/85 active:scale-[0.98]"
        >
          开始质押
          <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </section>
  );
}
