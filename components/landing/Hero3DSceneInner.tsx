"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.15;
    state.camera.position.x = Math.sin(t) * 0.3;
    state.camera.position.y = Math.cos(t * 0.7) * 0.2;
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();
  });
  return null;
}

const crabMaterial = {
  body: {
    color: "#0a7cff",
    emissive: "#0a7cff",
    emissiveIntensity: 0.25,
    metalness: 0.35,
    roughness: 0.4,
  },
  claw: {
    color: "#3aa0ff",
    emissive: "#0a7cff",
    emissiveIntensity: 0.2,
    metalness: 0.4,
    roughness: 0.35,
  },
  eye: {
    color: "#ffffff",
    emissive: "#78bfff",
    emissiveIntensity: 0.3,
    metalness: 0.1,
    roughness: 0.2,
  },
};

function FloatingCrab() {
  const group = useRef<THREE.Group>(null);
  const leftClaw = useRef<THREE.Group>(null);
  const rightClaw = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.2;
    }
    if (leftClaw.current) {
      leftClaw.current.rotation.z = Math.sin(t * 1.5) * 0.3;
    }
    if (rightClaw.current) {
      rightClaw.current.rotation.z = Math.sin(t * 1.5 + 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={group} scale={1.2}>
        {/* Body / shell - ellipsoid (wide crab shape) */}
        <mesh scale={[1.3, 0.85, 1.1]}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial {...crabMaterial.body} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.22, 0.32, 0.35]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial {...crabMaterial.eye} />
        </mesh>
        <mesh position={[0.22, 0.32, 0.35]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial {...crabMaterial.eye} />
        </mesh>
        <mesh position={[-0.22, 0.35, 0.38]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1d2939" />
        </mesh>
        <mesh position={[0.22, 0.35, 0.38]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1d2939" />
        </mesh>

        {/* Left claw */}
        <group ref={leftClaw} position={[-0.6, 0.1, 0.3]} rotation={[0, 0, Math.PI / 6]}>
          <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
          <mesh position={[-0.5, 0.08, 0.1]} rotation={[0.3, 0, Math.PI / 2]}>
            <boxGeometry args={[0.12, 0.25, 0.15]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
          <mesh position={[-0.5, -0.08, 0.1]} rotation={[-0.3, 0, Math.PI / 2]}>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
        </group>

        {/* Right claw */}
        <group ref={rightClaw} position={[0.6, 0.1, 0.3]} rotation={[0, 0, -Math.PI / 6]}>
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
          <mesh position={[0.5, 0.08, 0.1]} rotation={[0.3, 0, Math.PI / 2]}>
            <boxGeometry args={[0.12, 0.25, 0.15]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
          <mesh position={[0.5, -0.08, 0.1]} rotation={[-0.3, 0, Math.PI / 2]}>
            <boxGeometry args={[0.12, 0.2, 0.12]} />
            <meshStandardMaterial {...crabMaterial.claw} />
          </mesh>
        </group>

        {/* Legs */}
        {[-0.15, -0.05, 0.05, 0.15].map((z, i) => (
          <group key={`leg-l-${i}`} position={[-0.5, -0.15, z]} rotation={[0.4, 0, Math.PI / 4 + i * 0.05]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.02, 0.35, 8]} />
              <meshStandardMaterial {...crabMaterial.claw} />
            </mesh>
          </group>
        ))}
        {[-0.15, -0.05, 0.05, 0.15].map((z, i) => (
          <group key={`leg-r-${i}`} position={[0.5, -0.15, z]} rotation={[0.4, 0, -Math.PI / 4 - i * 0.05]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.02, 0.35, 8]} />
              <meshStandardMaterial {...crabMaterial.claw} />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
}

function Particles() {
  const count = 60;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    return pos;
  }, []);
  const mesh = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#0a7cff"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -5, 5]} intensity={0.5} color="#78bfff" />
      <pointLight position={[0, 2, 2]} intensity={0.8} color="#0a7cff" />
      <FloatingCrab />
      <Particles />
    </>
  );
}

export function Hero3DSceneInner() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-50 [perspective:1000px]">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene />
        </Canvas>
      </div>
    </div>
  );
}
