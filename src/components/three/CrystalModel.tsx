"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/shd-logo.glb";

export function CrystalModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const { scene } = useGLTF(MODEL_PATH);
  const [hovered, setHovered] = useState(false);

  const targetScale = useRef(1);
  const currentScale = useRef(1);

  targetScale.current = hovered ? 1.1 : 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 缓慢自转
    groupRef.current.rotation.y += delta * 0.25;

    // 鼠标跟随偏转
    const tiltX = pointer.y * 0.2;
    const tiltZ = -pointer.x * 0.1;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      tiltX,
      0.04
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      tiltZ,
      0.04
    );

    // 悬停缩放
    currentScale.current = THREE.MathUtils.lerp(
      currentScale.current,
      targetScale.current,
      0.08
    );
    const s = currentScale.current;
    groupRef.current.scale.set(s, s, s);
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={scene} scale={1.6} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
