/**
 * @file components/three/ParticleField.tsx
 * @description 粒子场效果组件。
 *   生成数百个微小光点，模拟星空/宇宙尘埃效果。
 *   粒子缓慢旋转和漂浮，营造科幻氛围。
 */
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  /** 粒子数量 */
  count?: number;
  /** 粒子分布半径 */
  radius?: number;
  /** 粒子颜色 */
  color?: string;
}

/**
 * ParticleField — 星空粒子场
 * 使用 Three.js Points 实现，性能优秀
 */
export function ParticleField({
  count = 500,
  radius = 8,
  color = "#00D4FF",
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // 生成随机粒子位置（仅在挂载时计算一次）
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // 球形均匀分布
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  // 每帧缓慢旋转粒子场
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.03}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
