"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/shd-logo.glb";

export function CrystalModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.6} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
