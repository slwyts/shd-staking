"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ParticleField } from "./ParticleField";

export function StarBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ParticleField count={300} radius={12} color="#5BA4CF" />
          <ParticleField count={150} radius={10} color="#8B7EC8" />
        </Suspense>
      </Canvas>
    </div>
  );
}
