import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Launch Tower / Service Gantry on the launchpad
 */
function LaunchGantry() {
  return (
    <group position={[-2.4, 0, -1.2]}>
      {/* Main Steel Lattice Tower Columns */}
      <mesh position={[0, 4.0, 0]}>
        <boxGeometry args={[0.9, 8.2, 0.9]} />
        <meshStandardMaterial
          color="#94a3b8"
          roughness={0.4}
          metalness={0.8}
          wireframe={true}
        />
      </mesh>

      {/* Internal elevator column */}
      <mesh position={[0, 4.0, 0]}>
        <boxGeometry args={[0.6, 8.0, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Umbilical Service Swing Arms extending to Rocket */}
      {[2.5, 4.5, 6.2].map((y, idx) => (
        <group key={idx} position={[0.45, y, 0]}>
          <mesh position={[0.9, 0, 0.3]}>
            <boxGeometry args={[1.8, 0.12, 0.25]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[1.7, -0.15, 0.3]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Lightning Mast on top */}
      <mesh position={[0, 8.8, 0]}>
        <cylinderGeometry args={[0.03, 0.08, 1.4, 8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </mesh>

      {/* Red Warning Beacon */}
      <mesh position={[0, 9.5, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

/**
 * 3D Launch Pad Surface Base with Flame Trench
 */
function LaunchPadBase() {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Concrete Pad Foundation */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 6.2, 0.8, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Flame Deflector Trench cutout collar */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.8, 2.1, 0.2, 24]} />
        <meshStandardMaterial color="#020617" roughness={0.95} />
      </mesh>

      {/* Hold-down Clamp Arms */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
        <group key={idx} rotation={[0, angle, 0]} position={[0, 0.4, 0]}>
          <mesh position={[1.15, 0.2, 0]}>
            <boxGeometry args={[0.4, 0.5, 0.3]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Pad Ground Floodlights */}
      {[-3.5, 3.5].map((x, idx) => (
        <group key={idx} position={[x, 0.4, 2.5]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.0, 8]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          <mesh position={[0, 1.05, 0]} rotation={[0.4, idx === 0 ? 0.3 : -0.3, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.2]} />
            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Detailed 3D Multi-Stage Rocket
 */
function RocketModel({ launchProgress, isIgnited }) {
  const plumeRef = useRef();
  const smokeRef = useRef();

  // Create instanced ground smoke billow particles
  const smokeParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 2.2;
      pts.push({
        x: Math.cos(angle) * radius,
        y: -0.2 + Math.random() * 1.5,
        z: Math.sin(angle) * radius,
        scale: 0.3 + Math.random() * 0.7,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      });
    }
    return pts;
  }, []);

  useFrame((state, delta) => {
    if (plumeRef.current && isIgnited) {
      // Dynamic plume turbulence and flicker
      const flicker = 1.0 + Math.sin(state.clock.elapsedTime * 35) * 0.15;
      plumeRef.current.scale.set(flicker, 1.0 + Math.cos(state.clock.elapsedTime * 28) * 0.2, flicker);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ─────────────────────────────────────────────────────────────
          ROCKET STRUCTURE
          ───────────────────────────────────────────────────────────── */}
      {/* Core Stage Main Cylinder */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 4.4, 32]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>

      {/* Black & Cyan Aerospace Aero Stripes */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.655, 0.655, 0.4, 32]} />
        <meshStandardMaterial color="#0b1120" roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[0.655, 0.655, 0.15, 32]} />
        <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.5} />
      </mesh>

      {/* Interstage Collar */}
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[0.62, 0.65, 0.4, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>

      {/* Payload Fairing Nosecone */}
      <group position={[0, 6.3, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.45, 0.62, 1.2, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <coneGeometry args={[0.45, 1.0, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Launch Abort Aerodynamic Tip */}
        <mesh position={[0, 2.3, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
      </group>

      {/* 2x Strap-on Boosters (Left & Right) */}
      {[-0.85, 0.85].map((xOffset, idx) => (
        <group key={idx} position={[xOffset, 2.4, 0]}>
          {/* Booster Body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 3.4, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.35} />
          </mesh>
          {/* Booster Nose Cone */}
          <mesh position={[0, 2.0, 0]}>
            <coneGeometry args={[0.32, 0.6, 24]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          {/* Booster Engine Nozzle */}
          <mesh position={[0, -1.9, 0]}>
            <cylinderGeometry args={[0.16, 0.28, 0.4, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Booster Aerodynamic Fin */}
          <mesh position={[idx === 0 ? -0.32 : 0.32, -1.4, 0]}>
            <boxGeometry args={[0.35, 0.6, 0.04]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Core Engine Cluster (Main stage 4 bells) */}
      <group position={[0, 0.8, 0]}>
        {[
          [0.2, 0.2],
          [-0.2, 0.2],
          [0.2, -0.2],
          [-0.2, -0.2],
        ].map(([nx, nz], idx) => (
          <mesh key={idx} position={[nx, 0, nz]}>
            <cylinderGeometry args={[0.12, 0.24, 0.45, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ─────────────────────────────────────────────────────────────
          ENGINE IGNITION & ROCKET EXHAUST PLUME
          ───────────────────────────────────────────────────────────── */}
      {isIgnited && (
        <group ref={plumeRef} position={[0, 0.6, 0]}>
          {/* White-hot Inner Core Jet */}
          <mesh position={[0, -1.4, 0]}>
            <coneGeometry args={[0.35, 2.8, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>

          {/* Fiery Orange Mid Flame Cone */}
          <mesh position={[0, -2.2, 0]}>
            <coneGeometry args={[0.75, 4.4, 24]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.75} />
          </mesh>

          {/* Radiant Amber Outer Flame Halo */}
          <mesh position={[0, -2.8, 0]}>
            <coneGeometry args={[1.2, 5.6, 24]} />
            <meshBasicMaterial color="#ea580c" transparent opacity={0.45} />
          </mesh>

          {/* Engine Illumination Point Light */}
          <pointLight position={[0, -1.5, 0]} intensity={8.0} color="#ff7700" distance={20} />
        </group>
      )}

      {/* Ground Smoke Particles upon ignition & liftoff */}
      {isIgnited && launchProgress < 0.35 && (
        <group ref={smokeRef} position={[0, 0.2, 0]}>
          {smokeParticles.map((p, idx) => (
            <mesh key={idx} position={[p.x, p.y - launchProgress * 2.0, p.z]}>
              <sphereGeometry args={[p.scale * (1 + launchProgress * 2.5), 8, 8]} />
              <meshStandardMaterial
                color="#64748b"
                transparent
                opacity={Math.max(0, 0.5 - launchProgress * 1.2)}
                roughness={1}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * Main Rocket Launch Scene with continuous scroll-driven vertical motion
 */
export default function RocketLaunchScene({ scrollProgress = 0 }) {
  // Rocket begins ignition at 0.05, lifts off at 0.10, climbs steadily through 0.50
  const isIgnited = scrollProgress >= 0.04;
  
  // Interpolate rocket vertical altitude:
  // 0.00 -> 0.05: on pad (y = 0)
  // 0.05 -> 0.15: initial liftoff (y = 0 -> 4)
  // 0.15 -> 0.35: rapid tropospheric climb (y = 4 -> 28)
  // 0.35 -> 0.55: upper atmosphere / space entry (y = 28 -> 70)
  const rocketY = useMemo(() => {
    if (scrollProgress < 0.05) return 0;
    if (scrollProgress < 0.15) {
      const t = (scrollProgress - 0.05) / 0.10;
      return t * t * 4.0;
    }
    if (scrollProgress < 0.35) {
      const t = (scrollProgress - 0.15) / 0.20;
      return 4.0 + t * 24.0;
    }
    const t = Math.min(1.0, (scrollProgress - 0.35) / 0.20);
    return 28.0 + t * 42.0;
  }, [scrollProgress]);

  // Fade out launchpad as rocket climbs into space
  const padOpacity = useMemo(() => {
    return Math.max(0, 1.0 - (scrollProgress - 0.1) * 3.5);
  }, [scrollProgress]);

  return (
    <group position={[0, 0, 0]}>
      {/* Launch pad structure (visible near ground) */}
      {padOpacity > 0.01 && (
        <group>
          <LaunchPadBase />
          <LaunchGantry />
        </group>
      )}

      {/* 3D Ascending Heavy Rocket */}
      <group position={[0, rocketY, 0]}>
        <RocketModel
          launchProgress={scrollProgress}
          isIgnited={isIgnited}
        />
      </group>
    </group>
  );
}
