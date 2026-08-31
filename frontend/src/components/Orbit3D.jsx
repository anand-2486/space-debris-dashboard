import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { getEarthTexture } from './3d/TextureUtils';

const EARTH_TEXTURE_URL =
  'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';

// Procedural 3D Earth sphere with photorealistic texture & atmospheric halo
function Earth() {
  const earthRef = useRef();

  const earthTexture = useMemo(() => {
    try {
      const loader = new THREE.TextureLoader();
      return loader.load(
        EARTH_TEXTURE_URL,
        undefined,
        undefined,
        () => getEarthTexture()
      );
    } catch {
      return getEarthTexture();
    }
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Core Earth Sphere with Realistic Daytime Map */}
      <mesh>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Atmospheric blue aura */}
      <mesh scale={1.03}>
        <sphereGeometry args={[2.0, 48, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer faint glow */}
      <mesh scale={1.06}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Generate complete 360-degree closed circular orbit ring passing through TCA
function generateClosedOrbitRing(
  traj,
  defaultInclination = 97.5,
  defaultRadius = 2.45,
  scale = 2.4 / 6800
) {
  const segments = 128;
  const pts = [];

  if (traj && traj.length >= 2) {
    const vecs = traj.map(
      (p) =>
        new THREE.Vector3(
          (p.x_km ?? p.x ?? 0) * scale,
          (p.z_km ?? p.z ?? 0) * scale,
          (p.y_km ?? p.y ?? 0) * scale
        )
    );

    const midIdx = Math.floor(vecs.length / 2);
    const rTca = vecs[midIdx].clone();
    const radius = Math.max(2.35, rTca.length());

    // Velocity tangent direction vector
    const vVec = vecs[vecs.length - 1].clone().sub(vecs[0]);
    if (vVec.length() < 0.001) {
      vVec.set(0, 1, 0);
    }

    // Normal to orbital plane: h = r x v
    let hVec = new THREE.Vector3().crossVectors(rTca, vVec);
    if (hVec.length() < 0.0001) {
      hVec.set(0, 1, 0);
    }
    hVec.normalize();

    // In-plane basis vectors (e1 towards TCA, e2 perpendicular in plane)
    const e1 = rTca.clone().normalize();
    const e2 = new THREE.Vector3().crossVectors(hVec, e1).normalize();

    // Complete 360-degree closed circular orbit loop
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const pt = new THREE.Vector3()
        .addScaledVector(e1, Math.cos(theta) * radius)
        .addScaledVector(e2, Math.sin(theta) * radius);
      pts.push(pt);
    }
    return pts;
  }

  // Fallback 360-degree orbit ring with inclination
  const incRad = (defaultInclination * Math.PI) / 180;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * defaultRadius;
    const y = Math.sin(theta) * defaultRadius * Math.cos(incRad);
    const z = Math.sin(theta) * defaultRadius * Math.sin(incRad);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

// Realistic 3D Satellite Models for both Primary Asset and Threat Spacecraft
function SpaceObjectMesh({ position, isDebris = false }) {
  const primaryColor = isDebris ? '#f43f5e' : '#38bdf8';
  const emissiveColor = isDebris ? '#e11d48' : '#0284c7';
  const solarPanelColor = isDebris ? '#2a0e28' : '#1e3a8a';
  const solarPanelEmissive = isDebris ? '#881337' : '#0369a1';

  return (
    <group
      position={position}
      rotation={isDebris ? [0.4, 0.8, 0.3] : [0.2, 0.5, 0]}
    >
      {/* Central Cylindrical Satellite Body */}
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={emissiveColor}
          emissiveIntensity={0.9}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Gold Thermal Blanket Wrap on Core */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.07, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Extended Solar Array Wing Left */}
      <group position={[0, 0, 0.15]}>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[0.015, 0.015, 0.04]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.08, 0.015, 0.18]} />
          <meshStandardMaterial
            color={solarPanelColor}
            emissive={solarPanelEmissive}
            emissiveIntensity={0.7}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Extended Solar Array Wing Right */}
      <group position={[0, 0, -0.15]}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.015, 0.015, 0.04]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.08, 0.015, 0.18]} />
          <meshStandardMaterial
            color={solarPanelColor}
            emissive={solarPanelEmissive}
            emissiveIntensity={0.7}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* High-Gain Communication Dish / Antenna */}
      <mesh position={[0.06, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.042, 0.04, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Antenna Mast / Sensor Boom */}
      <mesh position={[-0.05, -0.02, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.005, 0.005, 0.09, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
    </group>
  );
}

// 3D Orbital Trajectory Scene with Full 360° Closed Orbits
function TrajectoryScene({ event }) {
  const trajA = event?.trajectory_a || event?.trajectories?.object_a;
  const trajB = event?.trajectory_b || event?.trajectories?.object_b;
  const scale = 2.4 / 6800;

  const incA = event?.object_a?.inclination_deg ?? 97.55;
  const incB = event?.object_b?.inclination_deg ?? 98.72;

  // Complete 360-degree closed orbit rings around the entire Earth
  const fullOrbitA = useMemo(
    () => generateClosedOrbitRing(trajA, incA, 2.45, scale),
    [trajA, incA, scale]
  );
  const fullOrbitB = useMemo(
    () => generateClosedOrbitRing(trajB, incB, 2.48, scale),
    [trajB, incB, scale]
  );

  // TCA Encounter Intersection Point
  const tcaPos = fullOrbitA[0] || new THREE.Vector3(2.45, 0, 0);

  const [angle, setAngle] = useState(0);

  useFrame((_, delta) => {
    setAngle((prev) => (prev + delta * 0.25) % (Math.PI * 2));
  });

  const satPosA = useMemo(() => {
    if (!fullOrbitA || fullOrbitA.length === 0) return tcaPos;
    const idx = Math.floor(((angle / (Math.PI * 2)) % 1) * (fullOrbitA.length - 1));
    return fullOrbitA[idx] || tcaPos;
  }, [fullOrbitA, angle, tcaPos]);

  const satPosB = useMemo(() => {
    if (!fullOrbitB || fullOrbitB.length === 0) return tcaPos;
    const idx = Math.floor(
      (((angle + Math.PI * 0.4) / (Math.PI * 2)) % 1) * (fullOrbitB.length - 1)
    );
    return fullOrbitB[idx] || tcaPos;
  }, [fullOrbitB, angle, tcaPos]);

  return (
    <group>
      {/* 1. Complete 360-Degree Closed Orbit Ring for Object A (Cyan) */}
      {fullOrbitA.length > 1 && (
        <Line
          points={fullOrbitA}
          color="#38bdf8"
          lineWidth={2.5}
          transparent
          opacity={0.9}
        />
      )}

      {/* 2. Complete 360-Degree Closed Orbit Ring for Object B (Rose) */}
      {fullOrbitB.length > 1 && (
        <Line
          points={fullOrbitB}
          color="#f43f5e"
          lineWidth={2.5}
          transparent
          opacity={0.9}
        />
      )}

      {/* 3. TCA Close Encounter Intersection Marker */}
      <group position={tcaPos}>
        <mesh>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={2.5}
          />
        </mesh>
        {/* Pulsing Encounter Ring */}
        <mesh scale={1.8}>
          <ringGeometry args={[0.04, 0.07, 24]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Active Primary Satellite Realistic 3D Model */}
      <SpaceObjectMesh position={satPosA} isDebris={false} />

      {/* 5. Threat Debris Object Realistic 3D Model */}
      <SpaceObjectMesh position={satPosB} isDebris={true} />
    </group>
  );
}

export default function Orbit3D({ event, isFullscreen, onToggleFullscreen }) {
  const nameA =
    typeof event?.object_a === 'object'
      ? event?.object_a?.name || 'Primary Asset'
      : event?.object_a || 'Primary Asset';
  const nameB =
    typeof event?.object_b === 'object'
      ? event?.object_b?.name || 'Threat Debris'
      : event?.object_b || 'Threat Debris';

  return (
    <div
      style={{ width: '100%', height: '100%', minHeight: '600px' }}
      className="w-full h-full relative bg-slate-950/90 rounded-xl overflow-hidden flex flex-col"
    >
      <Canvas
        camera={{ position: [0, 0.8, 3.4], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={2.5} />
        <directionalLight position={[-10, -5, -5]} intensity={0.8} color="#0284c7" />

        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1} />
        <Earth />
        <TrajectoryScene event={event} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2.1}
          maxDistance={12}
        />
      </Canvas>

      {/* Telemetry Overlay / HUD */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs font-mono max-w-xs pointer-events-none shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
          <span className="text-white font-bold truncate">{nameA} (360° Orbit)</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
          <span className="text-slate-200 truncate">{nameB} (360° Orbit)</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
          <span className="text-amber-300 font-semibold truncate">TCA Encounter Point</span>
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
          Drag to rotate • Scroll to zoom • Right-click to pan
        </div>
      </div>

      <div className="absolute bottom-3 right-3 bg-slate-900/85 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-400 border border-slate-800">
        Three.js / Photorealistic 3D Earth & Orbit Conjunction
      </div>
    </div>
  );
}
