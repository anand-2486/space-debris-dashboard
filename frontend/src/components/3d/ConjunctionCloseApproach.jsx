import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Close-Approach Conjunction Event Encounter Scene
 */
export default function ConjunctionCloseApproach({
  event,
  separationMeters = 184,
  relativeVelocityKms = 14.78,
}) {
  const markerPulseRef = useRef();
  const hazardSphereRef = useRef();
  const objARef = useRef();
  const objBRef = useRef();

  // Positions in local encounter coordinate frame
  // Object A (CARTOSAT-2F) at ~ (-1.2, 0.4, -0.6)
  // Object B (FENGYUN 1C DEB) at ~ (1.1, -0.3, 0.5)
  // TCA point at (0, 0, 0)
  const posA = useMemo(() => new THREE.Vector3(-1.3, 0.45, -0.5), []);
  const posB = useMemo(() => new THREE.Vector3(1.2, -0.35, 0.4), []);
  const posTCA = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Measurement connecting vector
  const linePoints = useMemo(() => [posA, posB], [posA, posB]);
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(linePoints), [linePoints]);

  useFrame((state, delta) => {
    if (markerPulseRef.current) {
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 6.0) * 0.25;
      markerPulseRef.current.scale.set(s, s, s);
    }
    if (hazardSphereRef.current) {
      hazardSphereRef.current.rotation.y += delta * 0.4;
    }
    // Subtle trajectory drift
    if (objARef.current && objBRef.current) {
      const osc = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      objARef.current.position.set(posA.x + osc, posA.y, posA.z);
      objBRef.current.position.set(posB.x - osc, posB.y, posB.z);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ─────────────────────────────────────────────────────────────
          1. OBJECT A: CARTOSAT-2F (ISRO PRIMARY ASSET)
          ───────────────────────────────────────────────────────────── */}
      <group ref={objARef} position={posA}>
        {/* Satellite Bus (Golden MLI) */}
        <mesh>
          <boxGeometry args={[0.5, 0.7, 0.5]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Earth Observation Telescope */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.3, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} />
        </mesh>
        {/* Solar Panels (Left & Right Wings) */}
        {[-0.9, 0.9].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.0, 0.4, 0.03]} />
              <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.96, 0.36]} />
              <meshBasicMaterial color="#38bdf8" wireframe={true} />
            </mesh>
          </group>
        ))}

        {/* Telemetry Label */}
        <Html position={[0, 0.7, 0]} center distanceFactor={14}>
          <div className="bg-slate-950/90 border border-cyan-500/80 px-3 py-1 rounded-md text-xs font-mono font-bold text-cyan-300 shadow-glow-cyan pointer-events-none whitespace-nowrap">
            CARTOSAT-2F
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────
          2. OBJECT B: FENGYUN 1C DEB (ASAT BREAKUP DEBRIS)
          ───────────────────────────────────────────────────────────── */}
      <group ref={objBRef} position={posB}>
        {/* Irregular metallic tumbling fragment */}
        <mesh rotation={[0.4, 0.7, 0.2]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* Telemetry Label */}
        <Html position={[0, 0.5, 0]} center distanceFactor={14}>
          <div className="bg-slate-950/90 border border-rose-500/80 px-3 py-1 rounded-md text-xs font-mono font-bold text-rose-300 shadow-glow-rose pointer-events-none whitespace-nowrap">
            FENGYUN 1C DEB
          </div>
        </Html>
      </group>

      {/* ─────────────────────────────────────────────────────────────
          3. MINIMUM SEPARATION MEASUREMENT VECTOR & LASER LINE
          ───────────────────────────────────────────────────────────── */}
      <line geometry={lineGeo}>
        <lineBasicMaterial color="#f43f5e" linewidth={3} transparent opacity={0.85} />
      </line>

      {/* Separation distance tag at midpoint */}
      <Html position={[0, 0.1, 0]} center distanceFactor={12}>
        <div className="bg-rose-950/90 border border-rose-600/80 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-200 shadow-glow-rose pointer-events-none whitespace-nowrap text-center">
          <div className="text-[10px] text-rose-300/80">MIN. SEPARATION</div>
          <div className="text-sm font-extrabold text-white">{separationMeters} m</div>
        </div>
      </Html>

      {/* ─────────────────────────────────────────────────────────────
          4. TIME OF CLOSEST APPROACH (TCA) GLOWING PULSING NODE
          ───────────────────────────────────────────────────────────── */}
      <group position={posTCA}>
        {/* Core Glowing TCA Sphere */}
        <mesh>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>

        {/* Pulsing Concentric Hazard Waves */}
        <mesh ref={markerPulseRef}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshBasicMaterial
            color="#f43f5e"
            transparent={true}
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Critical Risk 1-Sigma Covariance Shell */}
        <mesh ref={hazardSphereRef}>
          <sphereGeometry args={[1.5, 18, 18]} />
          <meshBasicMaterial
            color="#f43f5e"
            wireframe={true}
            transparent={true}
            opacity={0.12}
          />
        </mesh>

        {/* TCA Info Tag */}
        <Html position={[0, -0.6, 0]} center distanceFactor={14}>
          <div className="bg-slate-950/90 border border-slate-700 px-3 py-1 rounded text-[11px] font-mono text-slate-300 whitespace-nowrap shadow-lg">
            <span className="text-amber-400 font-bold">TCA:</span> 26 AUG 2026 16:42:00 UTC
          </div>
        </Html>
      </group>
    </group>
  );
}
