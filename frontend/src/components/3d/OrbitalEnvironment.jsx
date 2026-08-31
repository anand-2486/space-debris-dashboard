import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Satellite Model Generator
 */
function SatelliteModel({ name, type, size = 1.0, color = '#38bdf8' }) {
  if (type === 'cartosat') {
    return (
      <group scale={[size, size, size]}>
        {/* Main Golden Hexagonal Bus */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.45, 0.3]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Optical Sensor Camera Aperture */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.15, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Dual Solar Panels (Left & Right Wings) */}
        {[-0.55, 0.55].map((x, idx) => (
          <group key={idx} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.65, 0.26, 0.02]} />
              <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Panel Grid Lines */}
            <mesh position={[0, 0, 0.012]}>
              <planeGeometry args={[0.62, 0.24]} />
              <meshBasicMaterial color="#38bdf8" wireframe={true} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (type === 'iss') {
    return (
      <group scale={[size * 1.3, size * 1.3, size * 1.3]}>
        {/* Main Long Truss Backbone */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {/* Pressurized Modules Cluster */}
        <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
        {/* 4x Cross Solar Wing Arrays */}
        {[-0.5, 0.5].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.22, 0.6, 0.015]} />
              <meshStandardMaterial color="#1d4ed8" metalness={0.85} />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <boxGeometry args={[0.22, 0.6, 0.015]} />
              <meshStandardMaterial color="#1d4ed8" metalness={0.85} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (type === 'starlink') {
    return (
      <group scale={[size * 0.9, size * 0.9, size * 0.9]}>
        {/* Flat Chassis */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.04]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Single Accordion Solar Array */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.01]} />
          <meshStandardMaterial color="#1e40af" metalness={0.9} />
        </mesh>
      </group>
    );
  }

  // Generic Satellite with Communication Dishes
  return (
    <group scale={[size, size, size]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.35]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} />
      </mesh>
      {/* Dish */}
      <mesh position={[0, 0, 0.22]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.16, 0.08, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>
      {/* Solar Wings */}
      {[-0.45, 0.45].map((x, idx) => (
        <mesh key={idx} position={[x, 0, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.02]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 3D Orbit Track Curve for a satellite
 */
function SatelliteOrbitTrack({ a, b, inclination, color = '#38bdf8' }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * a, Math.sin(theta) * b, 0));
    }
    return pts;
  }, [a, b]);

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group rotation={[inclination, 0, 0]}>
      <line geometry={geo}>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </line>
    </group>
  );
}

/**
 * Moving Satellite Node in Orbit
 */
function OrbitingSatellite({
  name,
  type,
  a,
  b,
  inclination,
  speed,
  color,
  showLabels = true,
  onSelect,
}) {
  const satRef = useRef();

  useFrame((state) => {
    if (satRef.current) {
      const t = state.clock.elapsedTime * speed * 0.5;
      const x = Math.cos(t) * a;
      const y = Math.sin(t) * b;
      satRef.current.position.set(x, y, 0);
    }
  });

  return (
    <group rotation={[inclination, 0, 0]}>
      <group ref={satRef}>
        <SatelliteModel name={name} type={type} color={color} />
        {showLabels && (
          <Html position={[0, 0.4, 0]} center distanceFactor={18}>
            <div className="px-2 py-0.5 rounded bg-slate-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-glow-cyan pointer-events-none">
              {name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/**
 * Instanced Debris Cloud Field (300+ tracked fragments)
 */
function DebrisField({ count = 280 }) {
  const meshRef = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const debrisData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = 2.9 + Math.random() * 2.2;
      const inclination = (Math.random() - 0.5) * Math.PI * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.6;
      const scale = 0.02 + Math.random() * 0.04;
      data.push({ radius, inclination, theta, speed, scale });
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    debrisData.forEach((d, i) => {
      d.theta += delta * d.speed * 0.4;
      const x = Math.cos(d.theta) * d.radius;
      const y = Math.sin(d.theta) * d.radius * Math.sin(d.inclination);
      const z = Math.sin(d.theta) * d.radius * Math.cos(d.inclination);

      dummy.position.set(x, y, z);
      dummy.rotation.x += delta * 1.2;
      dummy.rotation.y += delta * 0.8;
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#f43f5e" metalness={0.7} roughness={0.3} />
    </instancedMesh>
  );
}

/**
 * 3D Orbital Shell Trajectory Rings (LEO, SSO, MEO, GEO)
 */
function OrbitalShells({ layers }) {
  const shells = [
    { name: 'LEO', radius: 2.8, color: '#38bdf8', active: layers.leo },
    { name: 'SSO', radius: 3.2, color: '#10b981', inclination: 1.7, active: layers.sso },
    { name: 'MEO', radius: 4.6, color: '#f59e0b', active: layers.meo },
    { name: 'GEO', radius: 6.2, color: '#a855f7', active: layers.geo },
  ];

  return (
    <group>
      {shells.map(
        (shell) =>
          shell.active && (
            <group key={shell.name} rotation={[shell.inclination || 0, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[shell.radius - 0.015, shell.radius + 0.015, 64]} />
                <meshBasicMaterial color={shell.color} transparent opacity={0.22} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )
      )}
    </group>
  );
}

/**
 * Main Orbital Environment Scene
 */
export default function OrbitalEnvironment({
  layers = {
    leo: true,
    sso: true,
    meo: true,
    geo: true,
    satellites: true,
    debris: true,
    orbitLines: true,
    labels: true,
  },
  onSelectSatellite,
}) {
  const satellites = [
    {
      name: 'CARTOSAT-2F',
      type: 'cartosat',
      a: 3.1,
      b: 2.95,
      inclination: 1.7,
      speed: 0.8,
      color: '#38bdf8',
    },
    {
      name: 'STARLINK-4921',
      type: 'starlink',
      a: 3.3,
      b: 3.3,
      inclination: 0.92,
      speed: 0.75,
      color: '#38bdf8',
    },
    {
      name: 'ISS (ZARYA)',
      type: 'iss',
      a: 2.85,
      b: 2.85,
      inclination: 0.9,
      speed: 0.9,
      color: '#ffffff',
    },
    {
      name: 'COMMS SAT',
      type: 'comms',
      a: 4.8,
      b: 4.6,
      inclination: 0.3,
      speed: 0.35,
      color: '#f59e0b',
    },
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* Orbital Shells (LEO, SSO, MEO, GEO) */}
      <OrbitalShells layers={layers} />

      {/* Orbit Lines for monitored satellites */}
      {layers.orbitLines &&
        satellites.map((sat) => (
          <SatelliteOrbitTrack
            key={`track-${sat.name}`}
            a={sat.a}
            b={sat.b}
            inclination={sat.inclination}
            color={sat.color}
          />
        ))}

      {/* 3D Moving Satellites */}
      {layers.satellites &&
        satellites.map((sat) => (
          <OrbitingSatellite
            key={`sat-${sat.name}`}
            {...sat}
            showLabels={layers.labels}
            onSelect={onSelectSatellite}
          />
        ))}

      {/* 300+ Tracked Space Debris Objects */}
      {layers.debris && <DebrisField count={300} />}
    </group>
  );
}
