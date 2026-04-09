"use client";

export function SciFiEnvironment() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />

      <directionalLight
        position={[5, 5, 5]}
        intensity={0.7}
        color="#ffffff"
      />

      <directionalLight
        position={[-3, -2, -3]}
        intensity={0.3}
        color="#c4b5fd"
      />

      <pointLight
        position={[0, 2, 3]}
        intensity={2}
        color="#93c5fd"
        distance={12}
        decay={2}
      />
    </>
  );
}
